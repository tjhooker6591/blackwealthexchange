import assert from "node:assert/strict";

function classifyFoundingConsistency(row) {
  const issues = [];
  if (!row.membershipId) issues.push("missing_membership_id");
  if (!row.businessId) issues.push("missing_business_link");
  if (!row.userId) issues.push("missing_claimant_user");
  if (!row.review) issues.push("missing_review_record");
  if (
    !row.claim &&
    row.queueBucket !== "history" &&
    row.queueBucket !== "pending"
  ) {
    issues.push("missing_claim_record");
  }
  if (!row.business) issues.push("missing_business_record");
  if (!row.payment || row.paymentStatus !== "paid") {
    issues.push("payment_inconsistency");
  }
  if (
    row.queueState === "ownership_verified" &&
    (row.claimStatus !== "ownership_verified" ||
      row.ownershipReviewStatus !== "ownership_verified" ||
      row.claimStage !== "ownership_verified" ||
      row.publicListingStatus !== "ownership_verified" ||
      row.managementAccessStatus !== "approved" ||
      row.ownershipAccessStatus !== "approved" ||
      row.fulfillmentStatus !== "active" ||
      row.evidencePortalStatus !== "complete")
  ) {
    issues.push("conflicting_state");
  }
  if (row.claimedByUserId && row.userId && row.claimedByUserId !== row.userId) {
    issues.push("conflicting_claimant");
  }
  if (row.managedByUserId && row.userId && row.managedByUserId !== row.userId) {
    issues.push("cross_business_management_access");
  }

  if (!issues.length && row.queueState === "ownership_verified") {
    return { issues, consistency: "consistent_verified" };
  }
  if (
    !issues.length &&
    [
      "ownership_verification_pending",
      "additional_evidence_required",
      "disputed",
    ].includes(row.queueState)
  ) {
    return { issues, consistency: "consistent_pending_verification" };
  }
  if (issues.includes("conflicting_claimant")) {
    return { issues, consistency: "conflicting_claimant" };
  }
  if (issues.includes("payment_inconsistency")) {
    return { issues, consistency: "payment_inconsistency" };
  }
  if (
    issues.includes("conflicting_state") ||
    issues.includes("cross_business_management_access")
  ) {
    return { issues, consistency: "conflicting_state" };
  }
  if (issues.some((issue) => issue.startsWith("missing_"))) {
    return { issues, consistency: "missing_linked_record" };
  }
  return { issues, consistency: "legacy_status_requiring_normalization" };
}

function deriveFoundingNormalCheckResult(row) {
  const { issues, consistency } = classifyFoundingConsistency(row);
  if (consistency === "consistent_verified") {
    return {
      consistency,
      issues,
      verdict: "routine_admin_review",
      verdictReason: "verified_history_consistent",
      needsExceptionReview: false,
    };
  }
  if (consistency === "consistent_pending_verification") {
    return {
      consistency,
      issues,
      verdict: "routine_admin_review",
      verdictReason: "pending_flow_consistent",
      needsExceptionReview: false,
    };
  }
  const verdictReason =
    consistency === "missing_linked_record"
      ? "missing_linked_record"
      : consistency === "payment_inconsistency"
        ? "payment_inconsistency"
        : consistency === "conflicting_claimant"
          ? "conflicting_claimant"
          : consistency === "conflicting_state"
            ? "conflicting_state"
            : "legacy_status_requiring_normalization";
  return {
    consistency,
    issues,
    verdict: "exception_admin_review",
    verdictReason,
    needsExceptionReview: true,
  };
}

const routinePending = deriveFoundingNormalCheckResult({
  membershipId: "membership-1",
  businessId: "business-1",
  userId: "user-1",
  review: { reviewStatus: "ownership_verification_pending" },
  claim: { claimStatus: "claim_initiated" },
  business: { claimStage: "ownership_verification_pending" },
  payment: { _id: "payment-1" },
  paymentStatus: "paid",
  queueState: "ownership_verification_pending",
  queueBucket: "pending",
  claimStatus: "claim_initiated",
  ownershipReviewStatus: "ownership_verification_pending",
  claimStage: "ownership_verification_pending",
  publicListingStatus: "verification_pending",
  managementAccessStatus: "locked_pending_verification",
  ownershipAccessStatus: "locked_pending_verification",
  fulfillmentStatus: "pending_verification_queue",
  evidencePortalStatus: "open",
  claimedByUserId: null,
  managedByUserId: null,
});
assert.equal(routinePending.verdict, "routine_admin_review");
assert.equal(routinePending.verdictReason, "pending_flow_consistent");
assert.equal(routinePending.needsExceptionReview, false);

const routineVerified = deriveFoundingNormalCheckResult({
  membershipId: "membership-2",
  businessId: "business-2",
  userId: "user-2",
  review: { reviewStatus: "ownership_verified" },
  claim: { claimStatus: "ownership_verified" },
  business: { claimStage: "ownership_verified" },
  payment: { _id: "payment-2" },
  paymentStatus: "paid",
  queueState: "ownership_verified",
  queueBucket: "history",
  claimStatus: "ownership_verified",
  ownershipReviewStatus: "ownership_verified",
  claimStage: "ownership_verified",
  publicListingStatus: "ownership_verified",
  managementAccessStatus: "approved",
  ownershipAccessStatus: "approved",
  fulfillmentStatus: "active",
  evidencePortalStatus: "complete",
  claimedByUserId: "user-2",
  managedByUserId: "user-2",
});
assert.equal(routineVerified.verdict, "routine_admin_review");
assert.equal(routineVerified.verdictReason, "verified_history_consistent");

const paymentException = deriveFoundingNormalCheckResult({
  membershipId: "membership-3",
  businessId: "business-3",
  userId: "user-3",
  review: { reviewStatus: "ownership_verification_pending" },
  claim: { claimStatus: "claim_initiated" },
  business: { claimStage: "ownership_verification_pending" },
  payment: null,
  paymentStatus: "pending",
  queueState: "ownership_verification_pending",
  queueBucket: "pending",
  claimStatus: "claim_initiated",
  ownershipReviewStatus: "ownership_verification_pending",
  claimStage: "ownership_verification_pending",
  publicListingStatus: "verification_pending",
  managementAccessStatus: "locked_pending_verification",
  ownershipAccessStatus: "locked_pending_verification",
  fulfillmentStatus: "pending_verification_queue",
  evidencePortalStatus: "open",
  claimedByUserId: null,
  managedByUserId: null,
});
assert.equal(paymentException.verdict, "exception_admin_review");
assert.equal(paymentException.verdictReason, "payment_inconsistency");
assert.ok(paymentException.issues.includes("payment_inconsistency"));

const claimantException = deriveFoundingNormalCheckResult({
  membershipId: "membership-4",
  businessId: "business-4",
  userId: "user-4",
  review: { reviewStatus: "ownership_verified" },
  claim: { claimStatus: "ownership_verified" },
  business: { claimStage: "ownership_verified" },
  payment: { _id: "payment-4" },
  paymentStatus: "paid",
  queueState: "ownership_verified",
  queueBucket: "history",
  claimStatus: "ownership_verified",
  ownershipReviewStatus: "ownership_verified",
  claimStage: "ownership_verified",
  publicListingStatus: "ownership_verified",
  managementAccessStatus: "approved",
  ownershipAccessStatus: "approved",
  fulfillmentStatus: "active",
  evidencePortalStatus: "complete",
  claimedByUserId: "user-x",
  managedByUserId: "user-4",
});
assert.equal(claimantException.verdict, "exception_admin_review");
assert.equal(claimantException.verdictReason, "conflicting_claimant");

console.log("founding-normal-check-tests: ok");
