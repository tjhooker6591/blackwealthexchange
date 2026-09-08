// src/lib/directory/__tests__/lifecycleClassification-tests.ts
//
// Run with: npx tsx src/lib/directory/__tests__/lifecycleClassification-tests.ts

import * as assert from "node:assert/strict";
import {
  classifyBusinessRecord,
  classifyOrganizationRecord,
  computeDuplicatePhoneIds,
} from "../lifecycleClassification";

function main() {
  // VERIFIED short-circuits everything else.
  assert.equal(
    classifyBusinessRecord(
      { _id: "1", verified: true, isComplete: false, status: "rejected" },
      new Set(["1"]),
    ),
    "VERIFIED",
  );

  // Invalid entity (garbage name) -> NEEDS_MANUAL_REVIEW even if "complete".
  assert.equal(
    classifyBusinessRecord(
      { _id: "2", business_name: "118.3403506", isComplete: true },
      new Set(),
    ),
    "NEEDS_MANUAL_REVIEW",
  );

  // Bad status -> NEEDS_MANUAL_REVIEW.
  assert.equal(
    classifyBusinessRecord(
      { _id: "3", status: "archived_duplicate", isComplete: true },
      new Set(),
    ),
    "NEEDS_MANUAL_REVIEW",
  );

  // Duplicate phone -> POSSIBLE_DUPLICATE, takes priority over isComplete.
  assert.equal(
    classifyBusinessRecord({ _id: "4", isComplete: true }, new Set(["4"])),
    "POSSIBLE_DUPLICATE",
  );

  // Uncertain enrichment provenance -> NEEDS_MANUAL_REVIEW.
  assert.equal(
    classifyBusinessRecord(
      {
        _id: "5",
        isComplete: true,
        enrichmentProvenance: [{ note: "CONFLICT: phone mismatch" }],
      },
      new Set(),
    ),
    "NEEDS_MANUAL_REVIEW",
  );

  // Complete, no flags -> READY_FOR_REVIEW.
  assert.equal(
    classifyBusinessRecord({ _id: "6", isComplete: true }, new Set()),
    "READY_FOR_REVIEW",
  );

  // Incomplete, no flags -> NEEDS_ENRICHMENT.
  assert.equal(
    classifyBusinessRecord({ _id: "7", isComplete: false }, new Set()),
    "NEEDS_ENRICHMENT",
  );

  // Organizations: never VERIFIED, even if isComplete is true and status
  // is "approved" -- no live verification mechanism exists for this
  // collection yet.
  assert.equal(
    classifyOrganizationRecord(
      { _id: "8", isComplete: true, status: "approved" },
      new Set(),
    ),
    "READY_FOR_REVIEW",
  );

  assert.equal(
    classifyOrganizationRecord({ _id: "9", isComplete: false }, new Set()),
    "NEEDS_ENRICHMENT",
  );

  assert.equal(
    classifyOrganizationRecord({ _id: "10" }, new Set(["10"])),
    "POSSIBLE_DUPLICATE",
  );

  // computeDuplicatePhoneIds: groups of 2+ flagged, singletons and empty
  // phones ignored.
  const dupIds = computeDuplicatePhoneIds([
    { _id: "a", phone: "555-0001" },
    { _id: "b", phone: "555-0001" },
    { _id: "c", phone: "555-0002" },
    { _id: "d", phone: "" },
    { _id: "e", phone: null },
  ]);
  assert.equal(dupIds.has("a"), true);
  assert.equal(dupIds.has("b"), true);
  assert.equal(dupIds.has("c"), false);
  assert.equal(dupIds.has("d"), false);
  assert.equal(dupIds.has("e"), false);
  assert.equal(dupIds.size, 2);

  console.log("lifecycleClassification-tests: ok");
}

main();
