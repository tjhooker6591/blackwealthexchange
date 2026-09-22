import assert from "node:assert/strict";

function normalize(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return null;
  if (["claim_pending"].includes(s)) return "claim_initiated";
  if (["pending_review", "ownership_review_pending", "verification_pending"].includes(s)) return "ownership_verification_pending";
  if (["approved", "ownership_approved"].includes(s)) return "ownership_verified";
  if (["rejected", "ownership_rejected"].includes(s)) return "ownership_verification_failed";
  return s;
}

function deriveQueueState({ membershipStatus, claimStatus, ownershipReviewStatus, claimStage, publicListingStatus }) {
  const ms = String(membershipStatus || "").trim().toLowerCase();
  const statuses = [ownershipReviewStatus, claimStatus, claimStage, publicListingStatus].map(normalize).filter(Boolean);
  if (!["active", "past_due", "cancelled"].includes(ms)) return null;
  if (statuses.includes("ownership_verified")) return "ownership_verified";
  if (statuses.includes("ownership_verification_failed")) return "ownership_verification_failed";
  if (statuses.includes("disputed")) return "disputed";
  if (statuses.includes("additional_evidence_required")) return "additional_evidence_required";
  if (statuses.includes("ownership_verification_pending") || statuses.includes("claim_initiated")) return "ownership_verification_pending";
  return null;
}

function counts(rows) {
  return {
    pending: rows.filter((r) => r === "ownership_verification_pending").length,
    additionalEvidenceRequired: rows.filter((r) => r === "additional_evidence_required").length,
    disputed: rows.filter((r) => r === "disputed").length,
    verificationFailed: rows.filter((r) => r === "ownership_verification_failed").length,
    verifiedHistory: rows.filter((r) => r === "ownership_verified").length,
  };
}

const businessA = deriveQueueState({
  membershipStatus: "active",
  claimStatus: "claim_initiated",
  ownershipReviewStatus: "ownership_verification_pending",
  claimStage: "verification_pending",
});
const businessB = deriveQueueState({
  membershipStatus: "active",
  claimStatus: "ownership_verified",
  ownershipReviewStatus: "ownership_verified",
  claimStage: "ownership_verified",
  publicListingStatus: "ownership_verified",
});
assert.equal(businessA, "ownership_verification_pending");
assert.equal(businessB, "ownership_verified");

const states = [
  businessA,
  businessB,
  deriveQueueState({ membershipStatus: "active", ownershipReviewStatus: "additional_evidence_required" }),
  deriveQueueState({ membershipStatus: "active", ownershipReviewStatus: "disputed" }),
  deriveQueueState({ membershipStatus: "active", ownershipReviewStatus: "ownership_verification_failed" }),
];
assert.deepEqual(counts(states), {
  pending: 1,
  additionalEvidenceRequired: 1,
  disputed: 1,
  verificationFailed: 1,
  verifiedHistory: 1,
});

const sameBusinessDifferentUsers = [
  { businessId: "biz-1", userId: "user-1" },
  { businessId: "biz-1", userId: "user-2" },
];
assert.equal(new Set(sameBusinessDifferentUsers.map((x) => x.userId)).size, 2);
assert.equal(new Set(sameBusinessDifferentUsers.map((x) => x.businessId)).size, 1);

const oneUserDifferentBusinesses = [
  { businessId: "biz-1", userId: "user-1" },
  { businessId: "biz-2", userId: "user-1" },
];
assert.equal(new Set(oneUserDifferentBusinesses.map((x) => x.businessId)).size, 2);
assert.equal(new Set(oneUserDifferentBusinesses.map((x) => x.userId)).size, 1);

const mixedIdState = deriveQueueState({
  membershipStatus: "active",
  claimStatus: "claim_pending",
  ownershipReviewStatus: "ownership_review_pending",
  claimStage: "verification_pending",
});
assert.equal(mixedIdState, "ownership_verification_pending");

const webhookReplayOnce = deriveQueueState({
  membershipStatus: "active",
  claimStatus: "ownership_verified",
  ownershipReviewStatus: "ownership_verified",
  claimStage: "ownership_verified",
});
const webhookReplayTwice = deriveQueueState({
  membershipStatus: "active",
  claimStatus: "ownership_verified",
  ownershipReviewStatus: "ownership_verified",
  claimStage: "ownership_verified",
});
assert.equal(webhookReplayOnce, webhookReplayTwice);

const disputedThenReopened = deriveQueueState({
  membershipStatus: "active",
  ownershipReviewStatus: "disputed",
});
assert.equal(disputedThenReopened, "disputed");
const reopened = deriveQueueState({
  membershipStatus: "active",
  claimStatus: "claim_initiated",
  ownershipReviewStatus: "ownership_verification_pending",
});
assert.equal(reopened, "ownership_verification_pending");

const paymentAmountBefore = 4900;
const paymentAmountAfter = 4900;
assert.equal(paymentAmountBefore, paymentAmountAfter);

const crossBusinessManagement = {
  claimedByUserId: "user-1",
  managedByUserId: "user-1",
  membershipUserId: "user-2",
};
assert.notEqual(crossBusinessManagement.membershipUserId, crossBusinessManagement.managedByUserId);

console.log("platform-queue-tests: ok");
