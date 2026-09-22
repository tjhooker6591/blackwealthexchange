import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const APPLY = process.argv.includes("--apply");

const REQUIRED = [
  {
    collection: "ad_purchases",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance:
      "src/lib/business360.ts advertising lane ad_purchases.businessId",
  },
  {
    collection: "advertising_requests",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance:
      "src/lib/business360.ts advertising lane advertising_requests.businessId",
  },
  {
    collection: "featured_sponsor_schedule",
    key: { businessId: 1 },
    name: "businessId_1",
    provenance:
      "src/lib/business360.ts advertising lane featured_sponsor_schedule.businessId",
  },
  {
    collection: "affiliates",
    key: { userId: 1 },
    name: "userId_1",
    provenance: "src/lib/person360.ts findOneTracked('affiliates', { userId })",
  },
  {
    collection: "consultant_profiles",
    key: { userId: 1 },
    name: "userId_1",
    provenance:
      "src/lib/person360.ts findOneTracked('consultant_profiles', { userId })",
  },
  {
    collection: "employer_consultant_contact_requests",
    key: { employerId: 1 },
    name: "employerId_1",
    provenance:
      "src/pages/api/employer/consultant-contact-requests.ts find({ employerId })",
  },
  {
    collection: "employer_consultant_contact_requests",
    key: { consultantId: 1 },
    name: "consultantId_1",
    provenance:
      "src/pages/api/consultants/contact-requests.ts find({ consultantId: { $in } })",
  },
  {
    collection: "employer_consultant_pipeline",
    key: { employerId: 1 },
    name: "employerId_1",
    provenance:
      "src/pages/api/employer/consultant-pipeline.ts find({ employerId })",
  },
  {
    collection: "consultant_moderation_escalations",
    key: { status: 1, updatedAt: -1 },
    name: "status_1_updatedAt_-1",
    provenance:
      "src/pages/api/admin/consultant-escalations.ts find(filter).sort({ updatedAt: -1, ... })",
  },
  {
    collection: "consulting_intake",
    key: { email: 1 },
    name: "email_1",
    provenance: "src/pages/api/consulting-submission-status.ts find({ email })",
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
