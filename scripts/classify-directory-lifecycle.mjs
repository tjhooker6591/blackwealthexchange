// scripts/classify-directory-lifecycle.mjs
//
// Owner-specified directory record lifecycle (2026-09-07):
//   ALL RECORDS -> CLASSIFY ->
//     NEEDS_ENRICHMENT | READY_FOR_REVIEW | VERIFIED |
//     NEEDS_MANUAL_REVIEW | POSSIBLE_DUPLICATE
//
// Persists a `lifecycleStatus` field on every `businesses` and
// `organizations` record, computed by the same logic as the canonical
// src/lib/directory/lifecycleClassification.ts (this script reimplements
// it in plain JS since it runs standalone via `node`, not through the
// Next.js/TS build -- same relationship as the other reconcile-*.mjs
// scripts in this directory to their src/lib counterparts; keep them in
// sync if the logic ever changes).
//
// Never touches `verified`, `isVerified`, `approved`, or `status` --
// classification is read-derived only. Never deletes/merges/collapses
// anything -- POSSIBLE_DUPLICATE and NEEDS_MANUAL_REVIEW records are
// preserved as-is, just labeled.
//
// Usage:
//   node --env-file=.env.local scripts/classify-directory-lifecycle.mjs           (dry run, default)
//   node --env-file=.env.local scripts/classify-directory-lifecycle.mjs --apply    (writes lifecycleStatus)

import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const UNCERTAIN_PROVENANCE_MARKERS = [
  "NEEDS MANUAL REVIEW",
  "CONFLICT",
  "INACTIVE/CLOSED-LOOKING",
];

function hasUncertainProvenance(doc) {
  if (!Array.isArray(doc.enrichmentProvenance)) return false;
  return doc.enrichmentProvenance.some((entry) =>
    UNCERTAIN_PROVENANCE_MARKERS.some((marker) =>
      String(entry?.note || "").includes(marker),
    ),
  );
}

function computeDuplicatePhoneIds(docs) {
  const groups = new Map();
  for (const doc of docs) {
    const phone = String(doc.phone || "").trim();
    if (!phone) continue;
    const id = String(doc._id);
    if (!groups.has(phone)) groups.set(phone, []);
    groups.get(phone).push(id);
  }
  const duplicateIds = new Set();
  for (const ids of groups.values()) {
    if (ids.length > 1) ids.forEach((id) => duplicateIds.add(id));
  }
  return duplicateIds;
}

function isInvalidEntityBusiness(doc) {
  const badStatus = [
    "rejected",
    "duplicate_pending_review",
    "archived_duplicate",
  ];
  if (badStatus.includes(doc.status)) return true;
  const name = String(doc.business_name || "").trim();
  return name.length > 0 && /^[0-9.-]+$/.test(name);
}

async function classifyCollection(db, { name, isBusiness }) {
  const col = db.collection(name);
  const all = await col
    .find(
      {},
      {
        projection: {
          business_name: 1,
          name: 1,
          verified: 1,
          isComplete: 1,
          status: 1,
          phone: 1,
          enrichmentProvenance: 1,
        },
      },
    )
    .toArray();

  // Duplicate-phone detection excludes VERIFIED and invalid-entity records
  // from the grouping input itself (matching the Phase 4 methodology this
  // session already established) -- a verified business's phone number
  // isn't a "duplicate problem" signal, and neither is a garbage/invalid
  // record's.
  const groupingInput = all.filter((d) => {
    if (isBusiness && d.verified === true) return false;
    if (isBusiness && isInvalidEntityBusiness(d)) return false;
    return true;
  });
  const duplicatePhoneIds = computeDuplicatePhoneIds(groupingInput);

  const counts = {
    VERIFIED: 0,
    POSSIBLE_DUPLICATE: 0,
    NEEDS_MANUAL_REVIEW: 0,
    READY_FOR_REVIEW: 0,
    NEEDS_ENRICHMENT: 0,
  };
  const writes = [];

  for (const doc of all) {
    const id = String(doc._id);
    let state;

    if (isBusiness && doc.verified === true) {
      state = "VERIFIED";
    } else if (isBusiness && isInvalidEntityBusiness(doc)) {
      state = "NEEDS_MANUAL_REVIEW";
    } else if (duplicatePhoneIds.has(id)) {
      state = "POSSIBLE_DUPLICATE";
    } else if (hasUncertainProvenance(doc)) {
      state = "NEEDS_MANUAL_REVIEW";
    } else if (doc.isComplete === true) {
      state = "READY_FOR_REVIEW";
    } else {
      state = "NEEDS_ENRICHMENT";
    }

    counts[state]++;
    writes.push({ id, state });
  }

  return { total: all.length, counts, writes };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(2);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("bwes-cluster");

  const businesses = await classifyCollection(db, {
    name: "businesses",
    isBusiness: true,
  });
  const organizations = await classifyCollection(db, {
    name: "organizations",
    isBusiness: false,
  });

  console.log("=== businesses ===");
  console.log("total:", businesses.total);
  console.log(JSON.stringify(businesses.counts, null, 2));
  console.log("=== organizations ===");
  console.log("total:", organizations.total);
  console.log(JSON.stringify(organizations.counts, null, 2));

  if (!apply) {
    console.log(
      "\nDry run only. Re-run with --apply to write lifecycleStatus.",
    );
    await client.close();
    return;
  }

  console.log("\nApplying lifecycleStatus writes...");
  const now = new Date();

  for (const { name, writes } of [
    { name: "businesses", writes: businesses.writes },
    { name: "organizations", writes: organizations.writes },
  ]) {
    const col = db.collection(name);
    const { ObjectId } = await import("mongodb");
    const bulk = col.initializeUnorderedBulkOp();
    for (const w of writes) {
      bulk.find({ _id: new ObjectId(w.id) }).updateOne({
        $set: { lifecycleStatus: w.state, lifecycleClassifiedAt: now },
      });
    }
    const result = await bulk.execute();
    console.log(
      name,
      "modified:",
      result.modifiedCount ?? result.nModified ?? writes.length,
    );
  }

  await client.close();
}

main().catch((err) => {
  console.error("classify-directory-lifecycle: error", err);
  process.exit(2);
});
