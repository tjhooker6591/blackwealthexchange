import fs from "node:fs";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import type { TravelMapBusiness } from "@/types/travel-map";

function toNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

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

function mapBusiness(doc: any): TravelMapBusiness {
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

function loadFallbackBusinesses(): TravelMapBusiness[] {
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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const lat = toNumber(req.query.lat, NaN);
  const lng = toNumber(req.query.lng, NaN);
  const radiusKm = Math.min(Math.max(toNumber(req.query.radiusKm, 25), 1), 500);
  const limit = Math.min(
    Math.max(Math.floor(toNumber(req.query.limit, 20)), 1),
    100,
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res
      .status(400)
      .json({ ok: false, error: "lat and lng are required" });
  }

  const normalizedOrigin = normalizeCoordinatePair(lat, lng);
  if (
    typeof normalizedOrigin.lat !== "number" ||
    typeof normalizedOrigin.lng !== "number"
  ) {
    return res
      .status(400)
      .json({ ok: false, error: "Invalid coordinate pair" });
  }

  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();
    const businesses = db.collection("businesses");

    const docs = await businesses
      .find(
        {
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
            updatedAt: 1,
          },
        },
      )
      .limit(5000)
      .toArray();

    const nearby = docs
      .map((doc) => {
        const mapped = mapBusiness(doc);
        const bLat = mapped.location?.lat;
        const bLng = mapped.location?.lng;

        if (typeof bLat !== "number" || typeof bLng !== "number") {
          return null;
        }

        const distanceKm = haversineKm(
          normalizedOrigin.lat,
          normalizedOrigin.lng,
          bLat,
          bLng,
        );

        if (!Number.isFinite(distanceKm) || distanceKm > radiusKm) {
          return null;
        }

        return {
          ...mapped,
          distanceKm: Number(distanceKm.toFixed(2)),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, limit);

    return res.status(200).json({
      ok: true,
      origin: { lat: normalizedOrigin.lat, lng: normalizedOrigin.lng },
      radiusKm,
      total: nearby.length,
      results: nearby,
      meta: {
        source: "db",
      },
    });
  } catch (error) {
    console.error("travel-map/nearby error", error);

    const nearby = loadFallbackBusinesses()
      .map((mapped) => {
        const bLat = mapped.location?.lat;
        const bLng = mapped.location?.lng;

        if (typeof bLat !== "number" || typeof bLng !== "number") {
          return null;
        }

        const distanceKm = haversineKm(
          normalizedOrigin.lat,
          normalizedOrigin.lng,
          bLat,
          bLng,
        );

        if (!Number.isFinite(distanceKm) || distanceKm > radiusKm) {
          return null;
        }

        return {
          ...mapped,
          distanceKm: Number(distanceKm.toFixed(2)),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (a.sponsored !== b.sponsored) return a.sponsored ? -1 : 1;
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, limit);

    return res.status(200).json({
      ok: true,
      origin: { lat: normalizedOrigin.lat, lng: normalizedOrigin.lng },
      radiusKm,
      total: nearby.length,
      results: nearby,
      meta: {
        source: "fallback",
      },
    });
  }
}
