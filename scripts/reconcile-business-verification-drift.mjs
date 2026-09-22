// scripts/reconcile-business-verification-drift.mjs
//
// Finding #1 fix (2026-09-07): businesses.isVerified vs businesses.verified
// drift. Canonical field decision (see PR/commit message for full
// reasoning): `verified` is authoritative -- it is the only one of the two
// fields with a live functional dependency in the app (a real MongoDB
// index in travelMapIndexes.ts, a live query filter in
// travel-map/search.ts), and its `true` values correlate with legitimate,
// admin-approved, real businesses added in one coherent 2025-05-08
// curation batch. `isVerified` has no live write path anywhere in the app,
// and of its only 2 true values across 2,334 businesses, one is a
// duplicate/junk record (name "118.3403506", status archived_duplicate)
// and the other is BWE's own unapproved, still-pending self-listing --
// neither is a legitimate signal isVerified alone was tracking.
//
// This script authoritatively sets isVerified = Boolean(verified) for
// every business record -- NOT `isVerified || verified` (which the owner
// explicitly warned against, since that could incorrectly promote a
// business based on isVerified's unreliable true values). Canonical field
// wins outright.
//
// Usage:
//   node --env-file=.env.local scripts/reconcile-business-verification-drift.mjs           (dry run, default)
//   node --env-file=.env.local scripts/reconcile-business-verification-drift.mjs --apply    (writes changes)

import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import fs from "fs";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

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
  const col = db.collection("businesses");

  const all = await col
    .find(
      {},
      {
        projection: {
          _id: 1,
          business_name: 1,
          businessName: 1,
          isVerified: 1,
          verified: 1,
          status: 1,
          approved: 1,
        },
      },
    )
    .toArray();

  const buckets = {
    verified_to_unverified: [], // isVerified was true, canonical says false
    unverified_to_verified: [], // isVerified was false/missing, canonical says true
    unchanged: [], // already matches
    missing_verified_field: [], // `verified` itself is missing/null (canonical defaults to false)
  };

  for (const doc of all) {
    const canonical = doc.verified === true;
    const currentIsVerified = doc.isVerified === true;
    const verifiedFieldMissing =
      doc.verified === undefined || doc.verified === null;

    const entry = {
      id: String(doc._id),
      name: doc.business_name || doc.businessName || "(unnamed)",
      status: doc.status || null,
      approved: doc.approved ?? null,
      wasIsVerified: doc.isVerified ?? null,
      verified: doc.verified ?? null,
      newIsVerified: canonical,
    };

    if (verifiedFieldMissing) buckets.missing_verified_field.push(entry);

    if (currentIsVerified === canonical) {
      buckets.unchanged.push(entry);
    } else if (currentIsVerified && !canonical) {
      buckets.verified_to_unverified.push(entry);
    } else if (!currentIsVerified && canonical) {
      buckets.unverified_to_verified.push(entry);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalBusinesses: all.length,
    counts: {
      verified_to_unverified: buckets.verified_to_unverified.length,
      unverified_to_verified: buckets.unverified_to_verified.length,
      unchanged: buckets.unchanged.length,
      missing_verified_field_defaults_to_false:
        buckets.missing_verified_field.length,
    },
    verified_to_unverified: buckets.verified_to_unverified,
    unverified_to_verified: buckets.unverified_to_verified,
  };

  const outPath = new URL(
    "../.tmp/business-verification-reconciliation-report.json",
    import.meta.url,
  ).pathname;
  fs.mkdirSync(new URL("../.tmp", import.meta.url).pathname, {
    recursive: true,
  });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("=== Phase 3 dry-run report ===");
  console.log("Total businesses:", report.totalBusinesses);
  console.log(
    "verified -> unverified (isVerified true becomes false):",
    report.counts.verified_to_unverified,
  );
  console.log(
    "unverified -> verified (isVerified false/missing becomes true):",
    report.counts.unverified_to_verified,
  );
  console.log("unchanged:", report.counts.unchanged);
  console.log(
    "missing verified field entirely (defaults to false):",
    report.counts.missing_verified_field_defaults_to_false,
  );
  console.log("Full report written to:", outPath);

  if (report.counts.verified_to_unverified > 0) {
    console.log("\n--- records losing isVerified:true ---");
    report.verified_to_unverified.forEach((e) =>
      console.log(
        `  ${e.id} | ${e.name} | status=${e.status} approved=${e.approved}`,
      ),
    );
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
    await client.close();
    return;
  }

  console.log("\nApplying changes...");
  let modified = 0;
  const bulk = col.initializeUnorderedBulkOp();
  let queued = 0;
  for (const doc of all) {
    const canonical = doc.verified === true;
    if ((doc.isVerified === true) === canonical) continue; // already matches
    bulk
      .find({ _id: doc._id })
      .updateOne({ $set: { isVerified: canonical, updatedAt: new Date() } });
    queued++;
  }

  if (queued > 0) {
    const result = await bulk.execute();
    modified = result.modifiedCount ?? result.nModified ?? queued;
  }

  console.log("Applied. Records updated:", modified);

  await client.close();
}

main().catch((err) => {
  console.error("reconcile-business-verification-drift: error", err);
  process.exit(2);
});
