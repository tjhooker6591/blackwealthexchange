import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const APPLY = process.argv.includes("--apply");

const REQUIRED = [
  {
    collection: "products",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance: "src/lib/business360.ts directProductFilter businessId",
  },
  {
    collection: "products",
    key: { business_id: 1 },
    name: "business_id_1",
    provenance: "src/lib/business360.ts directProductFilter business_id",
  },
  {
    collection: "products",
    key: { sellerId: 1 },
    name: "sellerId_1",
    provenance: "src/lib/business360.ts sellerIdsFromProducts product.sellerId",
  },
  {
    collection: "orders",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance: "src/lib/business360.ts commerce directOrders businessId",
  },
  {
    collection: "orders",
    key: { business_id: 1 },
    name: "business_id_1",
    provenance: "src/lib/business360.ts commerce directOrders business_id",
  },
  {
    collection: "orders",
    key: { productId: 1 },
    name: "productId_1",
    provenance: "src/lib/business360.ts commerce productLinkedOrders productId",
  },
  {
    collection: "payments",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance: "src/lib/business360.ts commerce directPayments businessId",
  },
  {
    collection: "payments",
    key: { "metadata.businessId": 1 },
    name: "metadata.businessId_1",
    provenance:
      "src/lib/business360.ts commerce directPayments metadata.businessId",
  },
  {
    collection: "payments",
    key: { productId: 1 },
    name: "productId_1",
    provenance: "src/lib/business360.ts productIdFilter productId",
  },
  {
    collection: "bmev_records",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance:
      "src/lib/economicActivity360.ts resolveBusinessEconomicActivity360",
  },
  {
    collection: "bmev_records",
    key: { buyerUserId: 1 },
    name: "buyerUserId_1",
    provenance:
      "src/lib/economicActivity360.ts resolvePersonEconomicActivity360",
  },
  {
    collection: "bmev_records",
    key: { economicTransactionId: 1 },
    name: "economicTransactionId_1_unique",
    unique: true,
    provenance:
      "src/lib/economics/marketplaceBmev.ts upsertMarketplaceBmevRecord dedupe key",
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
        unique: Boolean(req.unique),
        provenance: req.provenance,
        alreadyPresent: present,
        created: false,
      };

      if (!present && APPLY) {
        await db.collection(req.collection).createIndex(req.key, {
          name: req.name,
          background: true,
          unique: Boolean(req.unique),
        });
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
