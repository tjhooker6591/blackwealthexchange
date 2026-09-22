import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const APPLY = process.argv.includes("--apply");

const REQUIRED = [
  {
    collection: "flow_events",
    key: { businessId: 1, createdAt: -1 },
    name: "businessId_1_createdAt_-1",
    provenance:
      "src/lib/activity360.ts resolveBusinessActivity360 find({ businessId }, sort createdAt desc)",
  },
  {
    collection: "flow_events",
    key: { userId: 1, createdAt: -1 },
    name: "userId_1_createdAt_-1",
    provenance:
      "src/lib/activity360.ts resolvePersonActivity360 find({ userId }, sort createdAt desc)",
  },
  {
    collection: "search_quality_events",
    key: { selectedBusinessId: 1, createdAt: -1 },
    name: "selectedBusinessId_1_createdAt_-1",
    provenance:
      "src/lib/activity360.ts resolveBusinessActivity360 find({ selectedBusinessId }, sort createdAt desc)",
  },
  {
    collection: "support_tickets",
    key: { relatedBusinessId: 1 },
    name: "relatedBusinessId_1",
    provenance:
      "src/lib/business360.ts support lane find({ relatedBusinessId })",
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
      const existing = await db
        .collection(req.collection)
        .indexes()
        .catch((error) => {
          if (error?.codeName === "NamespaceNotFound") return [];
          throw error;
        });
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
