import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const APPLY = process.argv.includes("--apply");

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
  if (Array.isArray(doc.categories)) {
    return doc.categories
      .map((x) => asTrimmed(x))
      .filter(Boolean)
      .join(", ");
  }
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

  const present = checks.filter(([, ok]) => ok).length;

  return {
    missingFields: checks.filter(([, ok]) => !ok).map(([key]) => key),
    completenessScore: Math.round((present / checks.length) * 100),
    isComplete: present >= 7,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "bwes-cluster";
  if (!uri) throw new Error("Missing MONGODB_URI");

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const rows = await db
      .collection("businesses")
      .find(
        {},
        {
          projection: {
            _id: 1,
            business_name: 1,
            name: 1,
            organization_name: 1,
            description: 1,
            address: 1,
            city: 1,
            state: 1,
            phone: 1,
            website: 1,
            image: 1,
            display_categories: 1,
            categories: 1,
            category: 1,
            orgType: 1,
            missingFields: 1,
            completenessScore: 1,
            isComplete: 1,
            status: 1,
            alias: 1,
            slug: 1,
          },
        },
      )
      .toArray();

    const drifted = [];

    for (const row of rows) {
      const next = computeListingCompleteness(row);
      const currentMissing = Array.isArray(row.missingFields)
        ? [...row.missingFields].sort()
        : [];
      const nextMissingSorted = [...next.missingFields].sort();
      const sameMissing =
        currentMissing.length === nextMissingSorted.length &&
        currentMissing.every(
          (value, index) => value === nextMissingSorted[index],
        );

      if (
        row.completenessScore === next.completenessScore &&
        Boolean(row.isComplete) === next.isComplete &&
        sameMissing
      ) {
        continue;
      }

      drifted.push({
        id: String(row._id),
        name:
          asTrimmed(row.business_name) ||
          asTrimmed(row.name) ||
          asTrimmed(row.organization_name) ||
          null,
        before: {
          completenessScore: row.completenessScore ?? null,
          isComplete: Boolean(row.isComplete),
          missingFields: Array.isArray(row.missingFields)
            ? row.missingFields
            : [],
        },
        after: {
          completenessScore: next.completenessScore,
          isComplete: next.isComplete,
          missingFields: next.missingFields,
        },
        crossesPublicThreshold:
          (row.completenessScore ?? 0) < 70 && next.completenessScore >= 70,
      });
    }

    let updated = 0;
    if (APPLY) {
      for (const entry of drifted) {
        const result = await db.collection("businesses").updateOne(
          { _id: new (await import("mongodb")).ObjectId(entry.id) },
          {
            $set: {
              completenessScore: entry.after.completenessScore,
              missingFields: entry.after.missingFields,
              isComplete: entry.after.isComplete,
              lastAuditAt: new Date(),
            },
          },
        );
        updated += result.modifiedCount;
      }
    }

    const crossesThreshold = drifted.filter((d) => d.crossesPublicThreshold);

    console.log(
      JSON.stringify(
        {
          db: dbName,
          apply: APPLY,
          scanned: rows.length,
          driftedCount: drifted.length,
          updated,
          crossesPublicThresholdCount: crossesThreshold.length,
          crossesPublicThresholdSample: crossesThreshold.slice(0, 40),
          driftedSample: drifted.slice(0, 15),
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
