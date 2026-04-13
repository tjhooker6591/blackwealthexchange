import fs from "node:fs";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Document, Filter } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type {
  TravelMapBusiness,
  TravelMapSearchResponse,
} from "@/types/travel-map";

function firstString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clampString(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function firstBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return value === "true" || value === "1";
}

function firstPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  if (parsedLat === 0 && parsedLng === 0) {
    return { lat: null, lng: null };
  }

  if (parsedLat < -90 || parsedLat > 90) {
    return { lat: null, lng: null };
  }

  if (parsedLng < -180 || parsedLng > 180) {
    return { lat: null, lng: null };
  }

  return { lat: parsedLat, lng: parsedLng };
}

function parseAddressString(address: string) {
  const trimmed = address.trim();
  if (!trimmed) {
    return {
      street: "",
      city: "",
      state: "",
      zip: "",
      formatted: "",
    };
  }

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let street = "";
  let city = "";
  let state = "";
  let zip = "";

  if (parts.length >= 1) {
    street = parts[0];
  }

  if (parts.length >= 2) {
    city = parts[1];
  }

  if (parts.length >= 3) {
    const stateZip = parts[2].split(/\s+/).filter(Boolean);
    if (stateZip.length >= 1) state = stateZip[0];
    if (stateZip.length >= 2) zip = stateZip.slice(1).join(" ");
  }

  return {
    street,
    city,
    state,
    zip,
    formatted: trimmed,
  };
}

function buildAddressParts(doc: any) {
  const addressObject =
    doc?.address &&
    typeof doc.address === "object" &&
    !Array.isArray(doc.address)
      ? doc.address
      : null;

  const rawAddressString =
    typeof doc?.address === "string"
      ? cleanString(doc.address)
      : cleanString(addressObject?.formatted) ||
        cleanString(addressObject?.street);

  const parsedFromString = rawAddressString
    ? parseAddressString(rawAddressString)
    : { street: "", city: "", state: "", zip: "", formatted: "" };

  const street =
    cleanString(addressObject?.street) ||
    (rawAddressString && rawAddressString.includes(",")
      ? parsedFromString.street
      : rawAddressString);

  const city =
    cleanString(doc?.city) ||
    cleanString(addressObject?.city) ||
    parsedFromString.city;

  const state =
    cleanString(doc?.state) ||
    cleanString(addressObject?.state) ||
    parsedFromString.state;

  const zip =
    cleanString(doc?.zip) ||
    cleanString(addressObject?.zip) ||
    parsedFromString.zip;

  const formatted =
    cleanString(addressObject?.formatted) ||
    (rawAddressString && rawAddressString.includes(",")
      ? rawAddressString
      : [street, city, [state, zip].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", "));

  return {
    street,
    city,
    state,
    zip,
    formatted,
  };
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
  const address = buildAddressParts(doc);

  let image: string | null = null;

  if (typeof doc?.image === "string" && doc.image.trim()) {
    image = doc.image.trim();
  } else if (Array.isArray(doc?.images) && doc.images.length > 0) {
    const first = doc.images[0];
    if (typeof first === "string" && first.trim()) {
      image = first.trim();
    } else if (first && typeof first.url === "string" && first.url.trim()) {
      image = first.url.trim();
    }
  }

  return {
    _id: String(doc._id),
    business_name: cleanString(doc?.business_name) || "Untitled Business",
    slug: cleanString(doc?.slug),
    description: cleanString(doc?.description),
    category: cleanString(doc?.category),
    subcategory: cleanString(doc?.subcategory),
    website: cleanString(doc?.website),
    phone: cleanString(doc?.phone),
    image,
    verified: doc?.verified === true,
    sponsored: doc?.sponsored === true,
    featured: doc?.featured === true,
    address,
    location: {
      lat: normalized.lat,
      lng: normalized.lng,
    },
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

    return parsed
      .map((doc: any, index: number) => ({
        _id: String(doc?._id || doc?.id || `fallback-${index}`),
        business_name: cleanString(doc?.business_name) || "Untitled Business",
        slug: cleanString(doc?.slug || doc?.alias),
        description: cleanString(doc?.description),
        category: cleanString(doc?.category || doc?.display_categories),
        subcategory: Array.isArray(doc?.categories)
          ? cleanString(doc.categories[0])
          : cleanString(doc?.subcategory),
        website: cleanString(doc?.website),
        phone: cleanString(doc?.phone),
        verified: doc?.verified === true || doc?.isVerified === true,
        sponsored: doc?.sponsored === true,
        featured: doc?.featured === true,
        address: {
          formatted: cleanString(doc?.address),
          city: cleanString(doc?.city),
          state: cleanString(doc?.state),
        },
        location: normalizeCoordinatePair(doc?.latitude, doc?.longitude),
      }))
      .filter((item: TravelMapBusiness) => item.business_name);
  } catch {
    return [];
  }
}

function filterFallbackBusinesses(
  docs: TravelMapBusiness[],
  filters: {
    q: string;
    city: string;
    state: string;
    category: string;
    verified: boolean;
    sponsored: boolean;
  },
): TravelMapBusiness[] {
  const q = filters.q.toLowerCase();
  const city = filters.city.toLowerCase();
  const state = filters.state.toLowerCase();
  const category = filters.category.toLowerCase();

  return docs.filter((item) => {
    const haystack = [
      item.business_name,
      item.description,
      item.category,
      item.subcategory,
      item.address?.formatted,
      item.address?.city,
      item.address?.state,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (q && !haystack.includes(q)) return false;
    if (city && !(item.address?.city || "").toLowerCase().includes(city))
      return false;
    if (state && !(item.address?.state || "").toLowerCase().includes(state))
      return false;
    if (category) {
      const c =
        `${item.category || ""} ${item.subcategory || ""}`.toLowerCase();
      if (!c.includes(category)) return false;
    }
    if (filters.verified && !item.verified) return false;
    if (filters.sponsored && !item.sponsored) return false;

    return true;
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TravelMapSearchResponse | { ok: false; error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const q = clampString(firstString(req.query.q), 120);
    const city = clampString(firstString(req.query.city), 80);
    const state = clampString(firstString(req.query.state), 40);
    const category = clampString(firstString(req.query.category), 80);
    const verified = firstBoolean(req.query.verified);
    const sponsored = firstBoolean(req.query.sponsored);
    const sort = firstString(req.query.sort).toLowerCase();
    const page = firstPositiveInt(req.query.page, 1);
    const pageSize = Math.min(firstPositiveInt(req.query.pageSize, 12), 48);

    if (
      process.env.NODE_ENV !== "production" &&
      req.query.source === "fallback"
    ) {
      throw new Error("Forced fallback source for runtime proof");
    }

    const filter: Filter<Document> = {
      status: { $nin: ["rejected", "archived"] },
      $nor: [
        { business_name: { $regex: "^sched-proof-", $options: "i" } },
        { description: { $regex: "legacy sponsor", $options: "i" } },
        { website: { $regex: "example\\.com/legacy", $options: "i" } },
      ],
    };

    const andClauses: Document[] = [];

    if (q) {
      const safe = escapeRegex(q);
      andClauses.push({
        $or: [
          { business_name: { $regex: safe, $options: "i" } },
          { description: { $regex: safe, $options: "i" } },
          { category: { $regex: safe, $options: "i" } },
          { subcategory: { $regex: safe, $options: "i" } },
          { city: { $regex: safe, $options: "i" } },
          { state: { $regex: safe, $options: "i" } },
          { address: { $regex: safe, $options: "i" } },
          { "address.street": { $regex: safe, $options: "i" } },
          { "address.city": { $regex: safe, $options: "i" } },
          { "address.state": { $regex: safe, $options: "i" } },
        ],
      });
    }

    if (city) {
      const safeCity = escapeRegex(city);
      andClauses.push({
        $or: [
          { city: { $regex: `^${safeCity}$`, $options: "i" } },
          { "address.city": { $regex: `^${safeCity}$`, $options: "i" } },
          { address: { $regex: `,\\s*${safeCity}\\s*,`, $options: "i" } },
        ],
      });
    }

    if (state) {
      const safeState = escapeRegex(state);
      andClauses.push({
        $or: [
          { state: { $regex: `^${safeState}$`, $options: "i" } },
          { "address.state": { $regex: `^${safeState}$`, $options: "i" } },
          { address: { $regex: `,\\s*${safeState}(\\s|$)`, $options: "i" } },
        ],
      });
    }

    if (category) {
      const safeCategory = escapeRegex(category);
      andClauses.push({
        $or: [
          { category: { $regex: safeCategory, $options: "i" } },
          { subcategory: { $regex: safeCategory, $options: "i" } },
        ],
      });
    }

    if (verified) {
      andClauses.push({ verified: true });
    }

    if (sponsored) {
      andClauses.push({ sponsored: true });
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();
    const businesses = db.collection("businesses");

    const total = await businesses.countDocuments(filter);

    const docs = await businesses
      .find(filter, {
        projection: {
          business_name: 1,
          slug: 1,
          description: 1,
          category: 1,
          subcategory: 1,
          website: 1,
          phone: 1,
          image: 1,
          images: 1,
          verified: 1,
          sponsored: 1,
          featured: 1,
          address: 1,
          city: 1,
          state: 1,
          zip: 1,
          latitude: 1,
          longitude: 1,
          location: 1,
          updatedAt: 1,
        },
      })
      .sort({
        sponsored: -1,
        verified: -1,
        featured: -1,
        updatedAt: -1,
        business_name: 1,
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    let results = docs.map(mapBusiness);

    results = results.sort((a, b) => {
      const aMapped = Number(
        Number.isFinite(a.location?.lat) && Number.isFinite(a.location?.lng),
      );
      const bMapped = Number(
        Number.isFinite(b.location?.lat) && Number.isFinite(b.location?.lng),
      );
      return bMapped - aMapped;
    });

    if (q && sort !== "recent") {
      const qNorm = q.toLowerCase();
      results = results
        .map((item) => {
          const text =
            `${item.business_name} ${item.description || ""} ${item.category || ""} ${item.subcategory || ""} ${item.address?.city || ""} ${item.address?.state || ""}`.toLowerCase();
          let score = 0;
          if (item.business_name?.toLowerCase() === qNorm) score += 100;
          if (item.business_name?.toLowerCase().startsWith(qNorm)) score += 50;
          if (text.includes(qNorm)) score += 15;
          if (item.verified) score += 8;
          if (item.sponsored) score += 3;
          return { item, score };
        })
        .sort((a, b) => b.score - a.score)
        .map((x) => x.item);
    }

    const mappedCount = results.filter(
      (item) =>
        Number.isFinite(item.location?.lat) &&
        Number.isFinite(item.location?.lng),
    ).length;

    return res.status(200).json({
      ok: true,
      total,
      page,
      pageSize,
      results,
      filters: {
        q,
        city,
        state,
        category,
        verified,
        sponsored,
        sort,
      },
      meta: {
        source: "db",
        mappedCount,
      },
    });
  } catch (error) {
    console.error("travel-map/search error", error);

    const q = clampString(firstString(req.query.q), 120);
    const city = clampString(firstString(req.query.city), 80);
    const state = clampString(firstString(req.query.state), 40);
    const category = clampString(firstString(req.query.category), 80);
    const verified = firstBoolean(req.query.verified);
    const sponsored = firstBoolean(req.query.sponsored);
    const sort = firstString(req.query.sort).toLowerCase();
    const page = firstPositiveInt(req.query.page, 1);
    const pageSize = Math.min(firstPositiveInt(req.query.pageSize, 12), 48);

    const fallback = filterFallbackBusinesses(loadFallbackBusinesses(), {
      q,
      city,
      state,
      category,
      verified,
      sponsored,
    });

    const paged = fallback.slice((page - 1) * pageSize, page * pageSize);
    const mappedCount = fallback.filter(
      (item) =>
        Number.isFinite(item.location?.lat) &&
        Number.isFinite(item.location?.lng),
    ).length;

    return res.status(200).json({
      ok: true,
      total: fallback.length,
      page,
      pageSize,
      results: paged,
      filters: {
        q,
        city,
        state,
        category,
        verified,
        sponsored,
        sort,
      },
      meta: {
        source: "fallback",
        mappedCount,
      },
    });
  }
}
