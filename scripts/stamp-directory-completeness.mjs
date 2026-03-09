import { MongoClient } from "mongodb";
import { computeListingCompleteness } from "../src/lib/directory/completeness";

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
