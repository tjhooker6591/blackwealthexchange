import assert from "node:assert/strict";

function normalizeFoundingClaimStage(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (normalized === "claim_initiated") return "claim_pending";
  if (normalized === "pending_review") return "ownership_review_pending";
  if (normalized === "approved") return "ownership_approved";
  if (normalized === "rejected") return "ownership_rejected";
  return normalized;
}

function getFoundingClaimStatusLabel(value) {
  const normalized = normalizeFoundingClaimStage(value);
  if (
    normalized === "ownership_review_pending" ||
    normalized === "claim_pending"
  ) {
    return "Claim pending ownership review";
  }
  if (normalized === "additional_evidence_required") {
    return "Additional evidence required";
  }
  if (normalized === "disputed") {
    return "Ownership claim disputed";
  }
  if (
    normalized === "ownership_approved" ||
    normalized === "ownership_verified"
  ) {
    return "Ownership approved";
  }
  if (normalized === "ownership_rejected") {
    return "Ownership claim rejected";
  }
  if (normalized === "founding_growth_member") {
    return "Founding Growth Member";
  }
  return null;
}

function getFoundingMembershipAvailability(row) {
  const publicStatus =
    String(row.status || row.trustStatus || "")
      .trim()
      .toLowerCase() || "public";
  const currentClaimState =
    String(row.claimStage || "")
      .trim()
      .toLowerCase() || null;
  const alreadyVerified =
    row.verified === true ||
    row.isVerified === true ||
    publicStatus === "verified";
  const unavailableReason = alreadyVerified
    ? "already_verified"
    : currentClaimState === "claim_initiated" ||
        currentClaimState === "claim_pending" ||
        currentClaimState === "additional_evidence_required" ||
        currentClaimState === "disputed"
      ? "claim_already_initiated"
      : currentClaimState === "ownership_review_pending"
        ? "ownership_review_pending"
        : currentClaimState === "founding_growth_member" ||
            currentClaimState === "ownership_approved" ||
            currentClaimState === "ownership_verified"
          ? "membership_already_active"
          : null;

  return {
    publicStatus,
    currentClaimState,
    claimable: unavailableReason == null,
    unavailableReason,
  };
}

function applyWebhook(state) {
  const membershipId = `founding_verified_business_growth_membership:${state.businessId}`;
  if (!state.membership) {
    state.membership = {
      membershipId,
      membershipStatus: "active",
      ownershipReviewStatus: "ownership_review_pending",
      businessId: state.businessId,
      userId: state.userId,
      managementAccessStatus: "locked_pending_review",
    };
  }
  if (!state.claim) {
    state.claim = {
      membershipId,
      businessId: state.businessId,
      userId: state.userId,
      claimStatus: "claim_pending",
      ownershipReviewStatus: "ownership_review_pending",
      claimLocked: true,
      auditHistory: [],
    };
  }
  if (!state.review) {
    state.review = {
      sourceMembershipId: membershipId,
      businessId: state.businessId,
      userId: state.userId,
      reviewStatus: "ownership_review_pending",
      evidenceStatus: "awaiting_owner_documents",
      auditHistory: [],
    };
  }
  state.business.claimStage = "ownership_review_pending";
  state.business.claimLocked = true;
  return state;
}

function adminAction(state, action) {
  if (action === "request_additional_evidence") {
    state.claim.claimStatus = "additional_evidence_required";
    state.review.reviewStatus = "additional_evidence_required";
    state.business.claimStage = "additional_evidence_required";
    state.claim.claimLocked = true;
  }
  if (action === "approve") {
    state.claim.claimStatus = "ownership_approved";
    state.review.reviewStatus = "ownership_approved";
    state.business.claimStage = "ownership_verified";
    state.membership.managementAccessStatus = "approved";
  }
  if (action === "reject") {
    state.claim.claimStatus = "ownership_rejected";
    state.review.reviewStatus = "ownership_rejected";
    state.business.claimStage = "unclaimed";
    state.claim.claimLocked = false;
    state.membership.managementAccessStatus = "rejected";
  }
  state.claim.auditHistory.push({ action });
}

const available = getFoundingMembershipAvailability({
  status: "approved",
  claimStage: null,
});
assert.equal(available.claimable, true);
assert.equal(normalizeFoundingClaimStage("claim_initiated"), "claim_pending");
assert.equal(
  getFoundingClaimStatusLabel("claim_pending"),
  "Claim pending ownership review",
);
assert.equal(
  getFoundingMembershipAvailability({
    status: "approved",
    claimStage: "additional_evidence_required",
  }).claimable,
  false,
);

const base = {
  userId: "user-1",
  businessId: "biz-1",
  business: { claimStage: "unclaimed", claimLocked: false },
};
const once = applyWebhook(structuredClone(base));
assert.equal(once.membership.membershipStatus, "active");
assert.equal(once.claim.claimStatus, "claim_pending");
assert.equal(once.review.reviewStatus, "ownership_review_pending");
assert.equal(once.business.claimStage, "ownership_review_pending");

const twice = applyWebhook(structuredClone(once));
assert.equal(twice.membership.membershipId, once.membership.membershipId);
assert.equal(twice.claim.membershipId, once.claim.membershipId);
assert.equal(twice.review.sourceMembershipId, once.review.sourceMembershipId);

adminAction(twice, "request_additional_evidence");
assert.equal(twice.claim.claimLocked, true);
assert.equal(twice.business.claimStage, "additional_evidence_required");

adminAction(twice, "approve");
assert.equal(twice.business.claimStage, "ownership_verified");
assert.equal(twice.membership.managementAccessStatus, "approved");

const rejected = applyWebhook(structuredClone(base));
adminAction(rejected, "reject");
assert.equal(rejected.membership.managementAccessStatus, "rejected");
assert.equal(rejected.claim.claimLocked, false);
assert.equal(rejected.business.claimStage, "unclaimed");
assert.ok(rejected.claim.auditHistory.length >= 1);

console.log("founding-claim-reconciliation-tests: ok");
