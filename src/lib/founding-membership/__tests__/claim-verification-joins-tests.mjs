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

function normalizeFoundingPaymentStatus(row) {
  const status = String(row?.status || "")
    .trim()
    .toLowerCase();
  const paymentStatus = String(row?.paymentStatus || "")
    .trim()
    .toLowerCase();
  const paid = row?.paid === true;
  const paidAt =
    row?.paidAt || row?.activatedAt || row?.paymentCompletedAt || null;

  if (paymentStatus === "paid" || status === "paid" || paid || paidAt) {
    return "paid";
  }
  if (paymentStatus) return paymentStatus;
  if (status) return status;
  return "pending";
}

function buildMongoIdOrStringVariants(value) {
  if (value == null) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  return [raw];
}

function findBusinessByStoredId(rows, businessId) {
  const variants = new Set(buildMongoIdOrStringVariants(businessId));
  return (
    rows.find((row) => variants.has(String(row?._id || "").trim())) || null
  );
}

function canPubliclyClaim(args) {
  const stage = normalizeFoundingClaimStage(args.claimStage);
  const locked = args.claimLocked === true;
  const verified =
    args.verified === true ||
    String(args.status || "").toLowerCase() === "verified";
  return (
    !verified &&
    !locked &&
    ![
      "claim_initiated",
      "ownership_verification_pending",
      "additional_evidence_required",
      "disputed",
      "founding_growth_member",
      "ownership_verified",
    ].includes(stage || "")
  );
}

const objectIdLike = "507f1f77bcf86cd799439011";
assert.equal(
  findBusinessByStoredId([{ _id: objectIdLike }], objectIdLike)?._id,
  objectIdLike,
);
assert.equal(
  findBusinessByStoredId([{ _id: objectIdLike }], " 680c1e52770af2064fe4c7ad ")
    ?._id,
  objectIdLike,
);
assert.equal(
  findBusinessByStoredId([{ _id: "string-id" }], "string-id")?._id,
  "string-id",
);
assert.equal(
  findBusinessByStoredId([{ _id: objectIdLike }], "not-an-object-id"),
  null,
);
assert.equal(findBusinessByStoredId([], objectIdLike), null);

assert.equal(
  normalizeFoundingClaimStage("verification_pending"),
  "ownership_verification_pending",
);
assert.equal(
  normalizeFoundingPaymentStatus({
    status: "paid",
    paid: true,
    paymentStatus: "pending",
  }),
  "paid",
);
assert.equal(
  normalizeFoundingPaymentStatus({ paymentStatus: "pending" }),
  "pending",
);

assert.equal(
  canPubliclyClaim({
    claimStage: "verification_pending",
    claimLocked: true,
    status: "approved",
  }),
  false,
);
assert.equal(
  canPubliclyClaim({
    claimStage: null,
    claimLocked: false,
    status: "approved",
  }),
  true,
);

const claim = {
  membershipId:
    "founding_verified_business_growth_membership:biz-001",
  businessId: "biz-001",
  email: "owner@example.com",
  claimStatus: "claim_initiated",
};
const membership = {
  membershipId: claim.membershipId,
  amountCents: 4900,
  status: "paid",
  paid: true,
  paymentStatus: "pending",
};
const business = {
  foundingMembershipId: claim.membershipId,
  business_name: "Example Business One",
  alias: "example-business-one",
};
assert.equal(normalizeFoundingPaymentStatus(membership), "paid");
assert.equal(business.foundingMembershipId, claim.membershipId);
assert.equal(claim.email, "owner@example.com");

const syntheticMembership = {
  membershipId: claim.membershipId,
  membershipStatus: "active",
  ownershipReviewStatus: "ownership_verification_pending",
  claimStatus: null,
  email: "owner@example.com",
  userId: objectIdLike,
  businessId: "biz-001",
};
const syntheticReview = {
  sourceMembershipId: claim.membershipId,
  reviewStatus: "ownership_verification_pending",
};
const normalizedReviewStatus = normalizeFoundingClaimStage(
  syntheticReview.reviewStatus || syntheticMembership.ownershipReviewStatus,
);
const isPendingQueueItem =
  syntheticMembership.membershipStatus === "active" &&
  (normalizedReviewStatus === "ownership_verification_pending" ||
    normalizedReviewStatus === "additional_evidence_required" ||
    normalizedReviewStatus === "disputed");
assert.equal(isPendingQueueItem, true);

console.log("claim-verification-joins-tests: ok");
