// src/lib/directory/lifecycleClassification.ts
//
// Owner-specified directory record lifecycle (2026-09-07):
//   ALL RECORDS -> CLASSIFY ->
//     NEEDS_ENRICHMENT     missing required verification data
//     READY_FOR_REVIEW     required data complete
//     VERIFIED             approved and consistent everywhere
//     NEEDS_MANUAL_REVIEW  conflicting/uncertain information
//     POSSIBLE_DUPLICATE   preserve record -- do not merge/delete
//
// Canonical classification logic for both `businesses` and `organizations`.
// This is READ logic only -- it never decides to delete, merge, or approve
// anything; it just labels current state so an admin surface (not yet
// built) can act on it. Two owner-approved judgment calls baked in here:
//
// 1. Records with no coherent identity (garbage/numeric business_name, or
//    a rejected/duplicate/archived status on `businesses` -- there is no
//    equivalent bad-status pattern on `organizations`, checked and
//    confirmed absent) fall under NEEDS_MANUAL_REVIEW. The lifecycle has
//    no distinct "invalid" bucket, and these aren't simple missing-data
//    cases -- they need a human decision, same as a data conflict does.
//
// 2. `organizations` has no live verification mechanism at all (unlike
//    `businesses.verified`, established as canonical in Finding #1) --
//    its `status`/`status_suggestion` fields are never written by any live
//    code path (status_suggestion has zero code references anywhere in
//    src/, the same "dead field" pattern `businesses.isVerified` turned
//    out to have). Nothing is classified VERIFIED for organizations until
//    a real verification mechanism exists for that collection; `approved`
//    means "listed in the directory," not "verified" -- the exact
//    distinction Finding #1 already established for businesses.

export type LifecycleState =
  | "VERIFIED"
  | "POSSIBLE_DUPLICATE"
  | "NEEDS_MANUAL_REVIEW"
  | "READY_FOR_REVIEW"
  | "NEEDS_ENRICHMENT";

type AnyDoc = Record<string, any>;

const UNCERTAIN_PROVENANCE_MARKERS = [
  "NEEDS MANUAL REVIEW",
  "CONFLICT",
  "INACTIVE/CLOSED-LOOKING",
];

function hasUncertainProvenance(doc: AnyDoc): boolean {
  const provenance = doc.enrichmentProvenance;
  if (!Array.isArray(provenance)) return false;
  return provenance.some((entry: AnyDoc) =>
    UNCERTAIN_PROVENANCE_MARKERS.some((marker) =>
      String(entry?.note || "").includes(marker),
    ),
  );
}

/**
 * Groups records by a normalized phone number and returns the set of
 * record ids that share a phone with at least one other record --
 * POSSIBLE_DUPLICATE candidates. Pass only the records already excluded
 * from VERIFIED/invalid-entity consideration (see classify* below for the
 * exact ordering) so verified records never get relabeled a duplicate.
 */
export function computeDuplicatePhoneIds(
  docs: Array<{ _id: unknown; phone?: unknown }>,
): Set<string> {
  const groups = new Map<string, string[]>();
  for (const doc of docs) {
    const phone = String(doc.phone || "").trim();
    if (!phone) continue;
    const id = String(doc._id);
    if (!groups.has(phone)) groups.set(phone, []);
    groups.get(phone)!.push(id);
  }
  const duplicateIds = new Set<string>();
  for (const ids of groups.values()) {
    if (ids.length > 1) ids.forEach((id) => duplicateIds.add(id));
  }
  return duplicateIds;
}

function isInvalidEntityBusiness(doc: AnyDoc): boolean {
  const badStatus = [
    "rejected",
    "duplicate_pending_review",
    "archived_duplicate",
  ];
  if (badStatus.includes(doc.status)) return true;
  const name = String(doc.business_name || "").trim();
  return name.length > 0 && /^[0-9.-]+$/.test(name);
}

export function classifyBusinessRecord(
  doc: AnyDoc,
  duplicatePhoneIds: Set<string>,
): LifecycleState {
  if (doc.verified === true) return "VERIFIED";

  const id = String(doc._id);
  if (isInvalidEntityBusiness(doc)) return "NEEDS_MANUAL_REVIEW";
  if (duplicatePhoneIds.has(id)) return "POSSIBLE_DUPLICATE";
  if (hasUncertainProvenance(doc)) return "NEEDS_MANUAL_REVIEW";
  if (doc.isComplete === true) return "READY_FOR_REVIEW";
  return "NEEDS_ENRICHMENT";
}

export function classifyOrganizationRecord(
  doc: AnyDoc,
  duplicatePhoneIds: Set<string>,
): LifecycleState {
  // No live verification mechanism exists for organizations yet -- see
  // header comment. Never classify VERIFIED here until one does.
  const id = String(doc._id);
  if (duplicatePhoneIds.has(id)) return "POSSIBLE_DUPLICATE";
  if (hasUncertainProvenance(doc)) return "NEEDS_MANUAL_REVIEW";
  if (doc.isComplete === true) return "READY_FOR_REVIEW";
  return "NEEDS_ENRICHMENT";
}
