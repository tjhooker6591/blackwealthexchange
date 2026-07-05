const now = new Date("2026-07-02T22:14:00.000Z");
const payment = {
  _id: "6a46deda6bdf••••",
  userId: "680c1e52770a••••",
  businessId: "6a45de2d3278••••",
  stripeSessionId: "cs_live_a1bS••••",
  itemId: "founding-verified-business-growth-membership",
  status: "paid",
};
const membershipId = `founding_verified_business_growth_membership:${payment.businessId}`;
const dryRun = {
  ok: true,
  mode: "dry-run",
  target: "pamfa_founding_membership_reconciliation",
  payment,
  wouldCreateOrUpdate: [
    {
      collection: "business_memberships",
      key: { membershipId },
      operation: "upsert",
      set: {
        productKey: "founding_verified_business_growth_membership",
        membershipStatus: "active",
        ownershipReviewStatus: "ownership_verification_pending",
        userId: payment.userId,
        businessId: payment.businessId,
        stripeSessionId: payment.stripeSessionId,
      },
      rollback: { deleteIfCreated: true, previous: null },
    },
    {
      collection: "business_claims",
      key: { membershipId },
      operation: "upsert",
      set: {
        claimStatus: "claim_initiated",
        ownershipReviewStatus: "ownership_verification_pending",
        claimLocked: true,
        paymentId: payment._id,
      },
      rollback: { deleteIfCreated: true, previous: null },
    },
    {
      collection: "ownership_reviews",
      key: { sourceMembershipId: membershipId },
      operation: "upsert",
      set: {
        reviewStatus: "ownership_verification_pending",
        evidenceStatus: "awaiting_owner_documents",
        paymentId: payment._id,
      },
      rollback: { deleteIfCreated: true, previous: null },
    },
    {
      collection: "membership_onboarding",
      key: { membershipId },
      operation: "upsert",
      set: {
        onboardingStatus: "started",
        evidencePortalStatus: "open",
        nextStep: "submit ownership evidence for ownership verification",
      },
      rollback: { deleteIfCreated: true, previous: null },
    },
    {
      collection: "membership_fulfillment",
      key: { membershipId },
      operation: "upsert",
      set: {
        fulfillmentStatus: "pending_verification_queue",
        ownershipAccessStatus: "locked_pending_review",
      },
      rollback: { deleteIfCreated: true, previous: null },
    },
    {
      collection: "businesses",
      key: { _id: payment.businessId },
      operation: "update",
      set: {
        claimStage: "verification_pending",
        claimLocked: true,
        pendingClaimMembershipId: membershipId,
        pendingClaimUserId: payment.userId,
        pendingClaimPaymentId: payment._id,
      },
      rollback: {
        previous: {
          claimStage: "unclaimed",
          claimLocked: false,
          pendingClaimMembershipId: null,
          pendingClaimUserId: null,
          pendingClaimPaymentId: null,
        },
      },
    },
    {
      collection: "payments",
      key: { stripeSessionId: payment.stripeSessionId },
      operation: "update",
      set: {
        membershipId,
        productKey: "founding_verified_business_growth_membership",
        status: "paid",
      },
      rollback: { previous: { membershipId: null } },
    },
  ],
  idempotency: {
    rerunBehavior:
      "upserts reuse membershipId/sourceMembershipId and do not create duplicates",
  },
  generatedAt: now.toISOString(),
};
console.log(JSON.stringify(dryRun, null, 2));
