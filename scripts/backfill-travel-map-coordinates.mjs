import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const COMMIT = args.has("--commit");
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : 100;
const CACHE_DIR = path.join(ROOT, ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "travel-map-geocode-cache.json");

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const eq = trimmed.indexOf("=");
  if (eq === -1) return null;

  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      if (!(parsed.key in process.env)) {
        process.env[parsed.key] = parsed.value;
      }
    }
  } catch {
    // ignore missing env files
  }
}

async function loadEnv() {
  await loadEnvFile(path.join(ROOT, ".env"));
  await loadEnvFile(path.join(ROOT, ".env.local"));
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildAddress(doc) {
  const businessName = cleanString(doc.business_name);

  const addressObject =
    doc?.address &&
    typeof doc.address === "object" &&
    !Array.isArray(doc.address)
      ? doc.address
      : null;

  const addressString =
    typeof doc?.address === "string"
      ? cleanString(doc.address)
      : cleanString(addressObject?.formatted);

  const street =
    cleanString(addressObject?.street) ||
    (!addressString.includes(",") ? addressString : addressString.split(",")[0]?.trim()) ||
    cleanString(doc.street);

  const city =
    cleanString(doc.city) ||
    cleanString(addressObject?.city);

  const state =
    cleanString(doc.state) ||
    cleanString(addressObject?.state);

  const zip =
    cleanString(doc.zip) ||
    cleanString(addressObject?.zip);

  const formatted =
    addressString ||
    [street, city, [state, zip].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");

  return {
    businessName,
    street,
    city,
    state,
    zip,
    formatted,
    query: [businessName, formatted].filter(Boolean).join(", "),
  };
}

function hasValidCoords(doc) {
  const lat =
    typeof doc?.latitude === "number"
      ? doc.latitude
      : Array.isArray(doc?.location?.coordinates)
        ? Number(doc.location.coordinates[1])
        : null;

  const lng =
    typeof doc?.longitude === "number"
      ? doc.longitude
      : Array.isArray(doc?.location?.coordinates)
        ? Number(doc.location.coordinates[0])
        : null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function loadCache() {
  await ensureCacheDir();
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await ensureCacheDir();
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

function pickProvider() {
  if (process.env.MAPBOX_ACCESS_TOKEN?.trim()) {
    return "mapbox";
  }

  if (process.env.USE_NOMINATIM === "1") {
    return "nominatim";
  }

  throw new Error(
    "No geocoding provider configured. Set MAPBOX_ACCESS_TOKEN for Mapbox, or set USE_NOMINATIM=1 for dev fallback.",
  );
}

async function geocodeWithMapbox(query) {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("country", "US");
  url.searchParams.set("access_token", token);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mapbox geocode failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const feature = data?.features?.[0];
  const coords = feature?.geometry?.coordinates;

  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  const lng = Number(coords[0]);
  const lat = Number(coords[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    provider: "mapbox",
    label:
      cleanString(feature?.properties?.full_address) ||
      cleanString(feature?.place_name),
  };
}

async function geocodeWithNominatim(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        process.env.GEOCODER_USER_AGENT?.trim() ||
        "BlackWealthExchangeTravelMap/1.0 (dev geocode backfill)",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Nominatim geocode failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const hit = Array.isArray(data) ? data[0] : null;

  if (!hit) {
    return null;
  }

  const lat = Number(hit.lat);
  const lng = Number(hit.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  await sleep(1100);

  return {
    lat,
    lng,
    provider: "nominatim",
    label: cleanString(hit.display_name),
  };
}

async function geocode(query, provider, cache) {
  if (cache[query]) {
    return cache[query];
  }

  let result = null;

  if (provider === "mapbox") {
    result = await geocodeWithMapbox(query);
  } else {
    result = await geocodeWithNominatim(query);
  }

  cache[query] = result;
  await saveCache(cache);
  return result;
}

function previewLine(doc, address, geo) {
  return {
    id: String(doc._id),
    business_name: doc.business_name,
    query: address.query,
    geocoded: !!geo,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    provider: geo?.provider ?? null,
    label: geo?.label ?? null,
  };
}

async function main() {
  await loadEnv();

  const mongoUri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB?.trim();

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI");
  }

  const provider = pickProvider();
  const cache = await loadCache();

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = dbName ? client.db(dbName) : client.db();
    const businesses = db.collection("businesses");

    const filter = {
      status: { $nin: ["rejected", "archived"] },
      $nor: [
        { business_name: { $regex: "^sched-proof-", $options: "i" } },
        { description: { $regex: "legacy sponsor", $options: "i" } },
        { website: { $regex: "example\\.com/legacy", $options: "i" } },
      ],
    };

    const docs = await businesses
      .find(filter, {
        projection: {
          business_name: 1,
          address: 1,
          city: 1,
          state: 1,
          zip: 1,
          latitude: 1,
          longitude: 1,
          location: 1,
          description: 1,
          website: 1,
          status: 1,
          updatedAt: 1,
        },
      })
      .sort({ updatedAt: -1, business_name: 1 })
      .limit(LIMIT)
      .toArray();

    const needingCoords = docs.filter((doc) => !hasValidCoords(doc));

    console.log(`Provider: ${provider}`);
    console.log(`Scanned: ${docs.length}`);
    console.log(`Need coordinates: ${needingCoords.length}`);
    console.log(`Mode: ${COMMIT ? "COMMIT" : "DRY RUN"}`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of needingCoords) {
      const address = buildAddress(doc);

      if (!address.query || address.query.length < 8) {
        skipped += 1;
        console.log(
          `[skip] ${doc.business_name} :: insufficient address -> ${address.query || "(empty)"}`,
        );
        continue;
      }

      try {
        const geo = await geocode(address.query, provider, cache);
        console.log(previewLine(doc, address, geo));

        if (!geo) {
          skipped += 1;
          continue;
        }

        if (COMMIT) {
          await businesses.updateOne(
            { _id: doc._id },
            {
              $set: {
                latitude: geo.lat,
                longitude: geo.lng,
                location: {
                  type: "Point",
                  coordinates: [geo.lng, geo.lat],
                },
                geocodedAt: new Date(),
                geocodeProvider: geo.provider,
                geocodeQuery: address.query,
                geocodeLabel: geo.label || "",
              },
            },
          );
        }

        updated += 1;
      } catch (error) {
        failed += 1;
        const message =
          error instanceof Error ? error.message : String(error);
        console.error(`[error] ${doc.business_name}: ${message}`);
      }
    }

    console.log("");
    console.log("Summary");
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});