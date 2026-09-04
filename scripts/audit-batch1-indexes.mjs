import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const APPLY = process.argv.includes("--apply");

const REQUIRED = [
  {
    collection: "sellers",
    key: { userId: 1 },
    name: "userId_1",
    provenance: "src/lib/person360.ts findManyTracked('sellers', { userId })",
  },
  {
    collection: "sellers",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance: "src/lib/business360.ts directSellerFilter businessId",
  },
  {
    collection: "sellers",
    key: { business_id: 1 },
    name: "business_id_1",
    provenance: "src/lib/business360.ts directSellerFilter business_id",
  },
  {
    collection: "business_memberships",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance:
      "src/lib/business360.ts findManyTracked('business_memberships', businessIdFilter)",
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "bwes-cluster";
  if (!uri) throw new Error("Missing MONGODB_URI");

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const report = [];

    for (const req of REQUIRED) {
      const existing = await db.collection(req.collection).indexes();
      const present = existing.some(
        (idx) => JSON.stringify(idx.key) === JSON.stringify(req.key),
      );

      const entry = {
        collection: req.collection,
        name: req.name,
        key: req.key,
        provenance: req.provenance,
        alreadyPresent: present,
        created: false,
      };

      if (!present && APPLY) {
        await db
          .collection(req.collection)
          .createIndex(req.key, { name: req.name, background: true });
        entry.created = true;
      }

      report.push(entry);
    }

    console.log(JSON.stringify({ db: dbName, apply: APPLY, report }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
