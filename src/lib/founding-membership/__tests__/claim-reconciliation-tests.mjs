import assert from "node:assert/strict";

function normalizeFoundingClaimStage(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (normalized === "claim_pending") return "claim_initiated";
  if (normalized === "pending_review") return "ownership_verification_pending";
  if (normalized === "ownership_review_pending")
    return "ownership_verification_pending";
  if (normalized === "verification_pending")
    return "ownership_verification_pending";
  if (normalized === "approved") return "ownership_verified";
  if (normalized === "ownership_approved") return "ownership_verified";
  if (normalized === "rejected") return "ownership_verification_failed";
  if (normalized === "ownership_rejected")
    return "ownership_verification_failed";
  return normalized;
}

function getFoundingClaimStatusLabel(value) {
  const normalized = normalizeFoundingClaimStage(value);
  if (normalized === "ownership_verification_pending") {
    return "Ownership verification pending";
  }
  if (normalized === "claim_initiated") {
    return "Claim initiated";
  }
  if (normalized === "additional_evidence_required") {
    return "Additional evidence required";
  }
  if (normalized === "disputed") {
    return "Ownership verification disputed";
  }
  if (normalized === "ownership_verified") {
    return "Ownership verified";
  }
  if (normalized === "ownership_verification_failed") {
    return "Ownership verification failed";
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
        currentClaimState === "additional_evidence_required" ||
        currentClaimState === "disputed"
      ? "claim_already_initiated"
      : currentClaimState === "ownership_verification_pending"
        ? "ownership_review_pending"
        : currentClaimState === "founding_growth_member" ||
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
      ownershipReviewStatus: "ownership_verification_pending",
      businessId: state.businessId,
      userId: state.userId,
      managementAccessStatus: "locked_pending_verification",
    };
  }
  if (!state.claim) {
    state.claim = {
      membershipId,
      businessId: state.businessId,
      userId: state.userId,
      claimStatus: "claim_initiated",
      ownershipReviewStatus: "ownership_verification_pending",
      claimLocked: true,
      auditHistory: [],
    };
  }
  if (!state.review) {
    state.review = {
      sourceMembershipId: membershipId,
      businessId: state.businessId,
      userId: state.userId,
      reviewStatus: "ownership_verification_pending",
      evidenceStatus: "awaiting_owner_documents",
      auditHistory: [],
    };
  }
  state.business.claimStage = "ownership_verification_pending";
  state.business.claimLocked = true;
  return state;
}

function adminAction(state, action) {
  if (action === "request_additional_evidence") {
    state.claim.claimStatus = "additional_evidence_required";
    state.review.reviewStatus = "additional_evidence_required";
    state.business.claimStage = "ownership_verification_pending";
    state.business.publicListingStatus = "verification_pending";
    state.claim.claimLocked = true;
    state.membership.managementAccessStatus = "locked_pending_verification";
    state.fulfillment.fulfillmentStatus = "pending_verification_queue";
    state.fulfillment.ownershipAccessStatus = "locked_pending_verification";
    state.onboarding.evidencePortalStatus = "open";
  }
  if (action === "verify") {
    state.claim.claimStatus = "ownership_verified";
    state.review.reviewStatus = "ownership_verified";
    state.business.claimStage = "ownership_verified";
    state.business.publicListingStatus = "ownership_verified";
    state.membership.managementAccessStatus = "approved";
    state.membership.paymentStatus = "paid";
    state.fulfillment.fulfillmentStatus = "active";
    state.fulfillment.ownershipAccessStatus = "approved";
    state.onboarding.evidencePortalStatus = "complete";
  }
  if (action === "verification_failed") {
    state.claim.claimStatus = "ownership_verification_failed";
    state.review.reviewStatus = "ownership_verification_failed";
    state.business.claimStage = "unclaimed";
    state.business.publicListingStatus = "unclaimed";
    state.claim.claimLocked = false;
    state.membership.managementAccessStatus = "rejected";
    state.fulfillment.fulfillmentStatus = "closed";
    state.fulfillment.ownershipAccessStatus = "rejected";
    state.onboarding.evidencePortalStatus = "closed";
  }
  if (action === "mark_disputed") {
    state.claim.claimStatus = "disputed";
    state.review.reviewStatus = "disputed";
    state.business.claimStage = "ownership_verification_pending";
    state.business.publicListingStatus = "verification_pending";
    state.claim.claimLocked = true;
  }
  if (action === "reopen_verification") {
    state.claim.claimStatus = "claim_initiated";
    state.review.reviewStatus = "ownership_verification_pending";
    state.business.claimStage = "ownership_verification_pending";
    state.business.publicListingStatus = "verification_pending";
    state.claim.claimLocked = true;
    state.membership.managementAccessStatus = "locked_pending_verification";
    state.fulfillment.fulfillmentStatus = "pending_verification_queue";
    state.fulfillment.ownershipAccessStatus = "locked_pending_verification";
    state.onboarding.evidencePortalStatus = "open";
  }
  state.claim.auditHistory.push({ action });
}

const available = getFoundingMembershipAvailability({
  status: "approved",
  claimStage: null,
});
assert.equal(available.claimable, true);
assert.equal(normalizeFoundingClaimStage("claim_initiated"), "claim_initiated");
assert.equal(
  getFoundingClaimStatusLabel("ownership_verification_pending"),
  "Ownership verification pending",
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
  business: { claimStage: "unclaimed", publicListingStatus: "unclaimed", claimLocked: false },
  fulfillment: { fulfillmentStatus: "pending_verification_queue", ownershipAccessStatus: "locked_pending_verification" },
  onboarding: { evidencePortalStatus: "open" },
};
const once = applyWebhook(structuredClone(base));
assert.equal(once.membership.membershipStatus, "active");
assert.equal(once.claim.claimStatus, "claim_initiated");
assert.equal(once.review.reviewStatus, "ownership_verification_pending");
assert.equal(once.business.claimStage, "ownership_verification_pending");

const twice = applyWebhook(structuredClone(once));
assert.equal(twice.membership.membershipId, once.membership.membershipId);
assert.equal(twice.claim.membershipId, once.claim.membershipId);
assert.equal(twice.review.sourceMembershipId, once.review.sourceMembershipId);

adminAction(twice, "request_additional_evidence");
assert.equal(twice.claim.claimLocked, true);
assert.equal(twice.business.claimStage, "ownership_verification_pending");

adminAction(twice, "verify");
assert.equal(twice.business.claimStage, "ownership_verified");
assert.equal(twice.business.publicListingStatus, "ownership_verified");
assert.equal(twice.membership.managementAccessStatus, "approved");
assert.equal(twice.fulfillment.fulfillmentStatus, "active");
assert.equal(twice.fulfillment.ownershipAccessStatus, "approved");
assert.equal(twice.onboarding.evidencePortalStatus, "complete");

const disputed = applyWebhook(structuredClone(base));
adminAction(disputed, "mark_disputed");
assert.equal(disputed.claim.claimStatus, "disputed");
assert.equal(disputed.business.publicListingStatus, "verification_pending");

adminAction(disputed, "reopen_verification");
assert.equal(disputed.claim.claimStatus, "claim_initiated");
assert.equal(disputed.review.reviewStatus, "ownership_verification_pending");
assert.equal(disputed.fulfillment.fulfillmentStatus, "pending_verification_queue");
assert.equal(disputed.onboarding.evidencePortalStatus, "open");

const rejected = applyWebhook(structuredClone(base));
adminAction(rejected, "verification_failed");
assert.equal(rejected.membership.managementAccessStatus, "rejected");
assert.equal(rejected.claim.claimLocked, false);
assert.equal(rejected.business.claimStage, "unclaimed");
assert.equal(rejected.fulfillment.fulfillmentStatus, "closed");
assert.ok(rejected.claim.auditHistory.length >= 1);

console.log("founding-claim-reconciliation-tests: ok");
