import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireWealthUser } from "@/lib/wealth-builder/auth";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCoordinatePair(lat: unknown, lng: unknown) {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return { lat: null, lng: null };
  }

  if (parsedLat === 0 && parsedLng === 0) return { lat: null, lng: null };
  if (parsedLat < -90 || parsedLat > 90) return { lat: null, lng: null };
  if (parsedLng < -180 || parsedLng > 180) return { lat: null, lng: null };

  return { lat: parsedLat, lng: parsedLng };
}

function mapBusiness(doc: any) {
  const rawLat =
    typeof doc?.latitude === "number"
      ? doc.latitude
      : Array.isArray(doc?.location?.coordinates)
        ? doc.location.coordinates[1]
        : null;

  const rawLng =
    typeof doc?.longitude === "number"
      ? doc.longitude
      : Array.isArray(doc?.location?.coordinates)
        ? doc.location.coordinates[0]
        : null;

  const normalized = normalizeCoordinatePair(rawLat, rawLng);

  return {
    _id: String(doc._id),
    business_name: cleanString(doc?.business_name) || "Untitled Business",
    slug: cleanString(doc?.slug),
    description: cleanString(doc?.description),
    category: cleanString(doc?.category),
    subcategory: cleanString(doc?.subcategory),
    website: cleanString(doc?.website),
    phone: cleanString(doc?.phone),
    verified: doc?.verified === true,
    sponsored: doc?.sponsored === true,
    featured: doc?.featured === true,
    address: {
      formatted:
        cleanString(doc?.address?.formatted) ||
        cleanString(doc?.address) ||
        [cleanString(doc?.city), cleanString(doc?.state)]
          .filter(Boolean)
          .join(", "),
      city: cleanString(doc?.city) || cleanString(doc?.address?.city),
      state: cleanString(doc?.state) || cleanString(doc?.address?.state),
    },
    location: normalized,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();

    const savedCol = db.collection("travel_map_saved_places");
    const businessesCol = db.collection("businesses");

    const businessIdQuery =
      typeof req.query.businessId === "string"
        ? cleanString(req.query.businessId)
        : "";

    if (req.method === "GET" && businessIdQuery) {
      let objectId: ObjectId;
      try {
        objectId = new ObjectId(businessIdQuery);
      } catch {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid businessId." });
      }

      const saved = await savedCol.findOne(
        {
          userId: auth.userId,
          accountType: "user",
          businessId: String(objectId),
        },
        { projection: { _id: 1, createdAt: 1 } },
      );

      return res.status(200).json({
        ok: true,
        businessId: String(objectId),
        saved: Boolean(saved),
        itemId: saved ? String(saved._id) : null,
        createdAt: saved?.createdAt
          ? new Date(saved.createdAt).toISOString()
          : null,
      });
    }

    if (req.method === "GET") {
      const savedDocs = await savedCol
        .find({ userId: auth.userId, accountType: "user" })
        .sort({ createdAt: -1 })
        .toArray();

      const businessIds = savedDocs
        .map((doc: any) => {
          try {
            return new ObjectId(String(doc.businessId));
          } catch {
            return null;
          }
        })
        .filter(Boolean) as ObjectId[];

      if (!businessIds.length) {
        return res.status(200).json({ ok: true, items: [] });
      }

      const businesses = await businessesCol
        .find(
          {
            _id: { $in: businessIds },
            status: { $nin: ["rejected", "archived"] },
          },
          {
            projection: {
              business_name: 1,
              slug: 1,
              description: 1,
              category: 1,
              subcategory: 1,
              website: 1,
              phone: 1,
              verified: 1,
              sponsored: 1,
              featured: 1,
              address: 1,
              city: 1,
              state: 1,
              latitude: 1,
              longitude: 1,
              location: 1,
            },
          },
        )
        .toArray();

      const businessById = new Map(
        businesses.map((doc: any) => [String(doc._id), mapBusiness(doc)]),
      );

      const items = savedDocs
        .map((saved: any) => {
          const businessId = String(saved.businessId || "");
          const business = businessById.get(businessId);
          if (!business) return null;

          return {
            id: String(saved._id),
            businessId,
            createdAt: saved.createdAt
              ? new Date(saved.createdAt).toISOString()
              : null,
            business,
          };
        })
        .filter(Boolean);

      return res.status(200).json({ ok: true, items });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "object" && req.body ? req.body : {};
      const businessId = cleanString((body as any).businessId);

      if (!businessId) {
        return res
          .status(400)
          .json({ ok: false, message: "businessId is required." });
      }

      let objectId: ObjectId;
      try {
        objectId = new ObjectId(businessId);
      } catch {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid businessId." });
      }

      const business = await businessesCol.findOne(
        { _id: objectId, status: { $nin: ["rejected", "archived"] } },
        { projection: { _id: 1 } },
      );

      if (!business) {
        return res
          .status(404)
          .json({ ok: false, message: "Business not found." });
      }

      const now = new Date();
      await savedCol.updateOne(
        {
          userId: auth.userId,
          accountType: "user",
          businessId: businessId,
        },
        {
          $set: {
            userId: auth.userId,
            accountType: "user",
            businessId,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      );

      return res.status(200).json({ ok: true, businessId, saved: true });
    }

    if (req.method === "DELETE") {
      const businessId = cleanString(
        (typeof req.query.businessId === "string" && req.query.businessId) ||
          (typeof req.body === "object" && req.body
            ? (req.body as any).businessId
            : ""),
      );

      if (!businessId) {
        return res
          .status(400)
          .json({ ok: false, message: "businessId is required." });
      }

      let objectId: ObjectId;
      try {
        objectId = new ObjectId(businessId);
      } catch {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid businessId." });
      }

      const result = await savedCol.deleteOne({
        userId: auth.userId,
        accountType: "user",
        businessId: String(objectId),
      });

      return res.status(200).json({
        ok: true,
        businessId: String(objectId),
        removed: result.deletedCount > 0,
      });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res
      .status(405)
      .json({ ok: false, message: `Method ${req.method} not allowed.` });
  } catch (error) {
    console.error("travel-map/saved error", error);
    return res
      .status(500)
      .json({ ok: false, message: "Failed to process saved places." });
  }
}
