import { MongoClient } from "mongodb";

function asTrimmed(v) {
  if (typeof v === "string") return v.trim();
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function hasValue(v) {
  if (Array.isArray(v)) return v.some((x) => asTrimmed(x).length > 0);
  return asTrimmed(v).length > 0;
}

function getAliasCategory(doc) {
  if (hasValue(doc.display_categories))
    return asTrimmed(doc.display_categories);
  if (Array.isArray(doc.categories))
    return doc.categories
      .map((x) => asTrimmed(x))
      .filter(Boolean)
      .join(", ");
  if (hasValue(doc.categories)) return asTrimmed(doc.categories);
  if (hasValue(doc.category)) return asTrimmed(doc.category);
  if (hasValue(doc.orgType)) return asTrimmed(doc.orgType);
  return "";
}

function computeListingCompleteness(doc) {
  const checks = [
    [
      "name",
      hasValue(doc.business_name) ||
        hasValue(doc.name) ||
        hasValue(doc.organization_name),
    ],
    ["description", hasValue(doc.description)],
    ["address", hasValue(doc.address)],
    ["city", hasValue(doc.city)],
    ["state", hasValue(doc.state)],
    ["phone", hasValue(doc.phone)],
    ["category", hasValue(getAliasCategory(doc))],
    ["website", hasValue(doc.website)],
    ["image", hasValue(doc.image)],
  ];

  const total = checks.length;
  const present = checks.filter(([, ok]) => ok).length;
  const missingFields = checks.filter(([, ok]) => !ok).map(([k]) => k);
  const completenessScore = Math.round((present / total) * 100);
  const isComplete = present >= 7;

  return { missingFields, completenessScore, isComplete };
}

const URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGODB_ATLAS_URI;
const DB_NAME = process.env.MONGO_DB_NAME || "bwes-cluster";

if (!URI) {
  console.error(
    "Missing Mongo URI env var (MONGO_URI / MONGODB_URI / MONGODB_ATLAS_URI)",
  );
  process.exit(1);
}

async function stampCollection(db, name) {
  const col = db.collection(name);
  const cursor = col.find({}, { projection: { _id: 1 } });

  let scanned = 0;
  let updated = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;
    scanned++;

    const full = await col.findOne({ _id: doc._id });
    if (!full) continue;

    const next = computeListingCompleteness(full);
    const currentMissing = Array.isArray(full.missingFields)
      ? full.missingFields
      : [];
    const sameMissing =
      currentMissing.length === next.missingFields.length &&
      currentMissing.every((v, i) => v === next.missingFields[i]);

    if (
      full.completenessScore === next.completenessScore &&
      full.isComplete === next.isComplete &&
      sameMissing
    ) {
      continue;
    }

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          completenessScore: next.completenessScore,
          missingFields: next.missingFields,
          isComplete: next.isComplete,
          lastAuditAt: new Date(),
        },
      },
    );
    updated++;
  }

  return { name, scanned, updated };
}

const client = new MongoClient(URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
});

try {
  await client.connect();
  const db = client.db(DB_NAME);

  const [businesses, organizations] = await Promise.all([
    stampCollection(db, "businesses"),
    stampCollection(db, "organizations"),
  ]);

  console.log(JSON.stringify({ ok: true, businesses, organizations }, null, 2));
} catch (err) {
  console.error("Failed to stamp completeness:", err);
  process.exitCode = 1;
} finally {
  await client.close();
}
