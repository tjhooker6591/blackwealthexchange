import fs from "node:fs";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

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

function loadFallbackBusinesses() {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "black_owned_geocoded.json",
    );
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((doc: any, index: number) =>
      mapBusiness({
        _id: doc?._id || doc?.id || `fallback-${index}`,
        business_name: doc?.business_name,
        slug: doc?.slug || doc?.alias,
        description: doc?.description,
        category: doc?.category || doc?.display_categories,
        subcategory: Array.isArray(doc?.categories)
          ? doc.categories[0]
          : doc?.subcategory,
        website: doc?.website,
        phone: doc?.phone,
        verified: doc?.verified === true || doc?.isVerified === true,
        sponsored: doc?.sponsored === true,
        featured: doc?.featured === true,
        address: doc?.address,
        city: doc?.city,
        state: doc?.state,
        latitude: doc?.latitude,
        longitude: doc?.longitude,
      }),
    );
  } catch {
    return [];
  }
}

function resolveFallbackBusiness(id: string) {
  const docs = loadFallbackBusinesses();
  return docs.find((item: any) => item._id === id || item.slug === id) || null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (typeof id !== "string" || !id.trim()) {
    return res
      .status(400)
      .json({ ok: false, error: "Business id is required" });
  }

  let objectId: ObjectId | null = null;
  try {
    objectId = new ObjectId(id);
  } catch {
    const fallback = resolveFallbackBusiness(id);
    if (fallback) {
      return res.status(200).json({
        ok: true,
        business: fallback,
        meta: { source: "fallback" },
      });
    }
    return res.status(400).json({ ok: false, error: "Invalid business id" });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();

    const doc = await db.collection("businesses").findOne(
      {
        _id: objectId!,
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
    );

    if (!doc) {
      const fallback = resolveFallbackBusiness(id);
      if (fallback) {
        return res.status(200).json({
          ok: true,
          business: fallback,
          meta: { source: "fallback" },
        });
      }
      return res.status(404).json({ ok: false, error: "Business not found" });
    }

    return res.status(200).json({
      ok: true,
      business: mapBusiness(doc),
      meta: { source: "db" },
    });
  } catch (error) {
    console.error("travel-map/business detail error", error);
    const fallback = resolveFallbackBusiness(id);
    if (fallback) {
      return res.status(200).json({
        ok: true,
        business: fallback,
        meta: { source: "fallback" },
      });
    }
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
