import assert from "node:assert/strict";
import {
  buildFoundingDecisionAuditRecord,
  deriveFoundingVerificationDecision,
  getFoundingActivationContractBlueprint,
  getFoundingShadowValidationSummary,
} from "../../founding-membership.ts";

function buildRow(overrides = {}) {
  return {
    membershipId: "membership-1",
    businessId: "business-1",
    userId: "user-1",
    email: "owner@example.com",
    businessName: "Example Business LLC",
    businessSlug: "example-business-llc",
    claimId: "claim-1",
    ownershipReviewId: "review-1",
    paymentId: "payment-1",
    paymentStatus: "paid",
    paymentAmountCents: 4900,
    paymentDisplayAmount: "$49.00",
    paymentCurrency: "usd",
    membershipStatus: "active",
    claimStatus: "ownership_verification_pending",
    ownershipReviewStatus: "ownership_verification_pending",
    claimStage: "ownership_verification_pending",
    claimLocked: true,
    managementAccessStatus: "pending",
    ownershipAccessStatus: "pending",
    publicListingStatus: "approved",
    fulfillmentStatus: "pending",
    evidencePortalStatus: "submitted",
    evidenceStatus: "submitted",
    onboardingStatus: "ownership_verification_pending",
    nextStep: "claim_verification",
    claimedByUserId: null,
    managedByUserId: null,
    ownerUserIds: [],
    competingClaimMembershipIds: [],
    competingClaimantUserIds: [],
    competingClaimantCount: 1,
    queueState: "ownership_verification_pending",
    queueBucket: "pending",
    createdAt: new Date("2026-08-10T18:00:00.000Z"),
    updatedAt: new Date("2026-08-10T18:05:00.000Z"),
    auditHistory: [],
    source: "fixture",
    normalCheck: {
      consistency: "consistent_pending_verification",
      issues: [],
      verdict: "routine_admin_review",
      verdictReason: "pending_flow_consistent",
      needsExceptionReview: false,
    },
    membership: {
      membershipId: "membership-1",
      membershipName: "Example Business LLC",
      email: "owner@example.com",
      phone: "4045551111",
      website: "example.com",
      userId: "user-1",
      businessId: "business-1",
    },
    claim: {
      membershipId: "membership-1",
      businessId: "business-1",
      businessName: "Example Business LLC",
      businessAddress: "123 Auburn Ave Atlanta GA 30303",
      phone: "4045551111",
      website: "example.com",
      email: "owner@example.com",
    },
    review: {
      sourceMembershipId: "membership-1",
      reviewStatus: "ownership_verification_pending",
      evidenceStatus: "submitted",
      evidenceValidationStatus: "auto_validated",
      evidenceSubmissions: [
        {
          type: "written_owner_or_officer_authorization",
          storageKey: "doc-1",
        },
      ],
    },
    business: {
      _id: "business-1",
      business_name: "Example Business LLC",
      address: "123 Auburn Ave Atlanta GA 30303",
      phone: "(404) 555-1111",
      website: "https://example.com",
      email: "owner@example.com",
    },
    onboarding: {
      onboardingStatus: "ownership_verification_pending",
      nextStep: "claim_verification",
      evidencePortalStatus: "submitted",
    },
    fulfillment: {
      ownershipAccessStatus: "pending",
      fulfillmentStatus: "pending",
    },
    payment: { _id: "payment-1" },
    user: { _id: "user-1", email: "owner@example.com" },
    ...overrides,
  };
}

const verifiedAutoEligible = buildRow({
  queueState: "ownership_verified",
  claimStatus: "ownership_verified",
  ownershipReviewStatus: "ownership_verified",
  claimStage: "ownership_verified",
  claimedByUserId: "user-1",
});

const missingEvidence = buildRow({
  membershipId: "membership-2",
  claimId: "claim-2",
  queueState: "additional_evidence_required",
  claimStatus: "additional_evidence_required",
  ownershipReviewStatus: "additional_evidence_required",
  review: {
    sourceMembershipId: "membership-2",
    reviewStatus: "additional_evidence_required",
    evidenceStatus: "missing",
    evidenceSubmissions: [],
  },
});

const ownerConflict = buildRow({
  membershipId: "membership-3",
  claimId: "claim-3",
  ownerUserIds: ["another-user"],
  claimedByUserId: "another-user",
});

const competingClaimants = buildRow({
  membershipId: "membership-4",
  claimId: "claim-4",
  competingClaimMembershipIds: ["membership-5"],
  competingClaimantUserIds: ["user-1", "user-2"],
  competingClaimantCount: 2,
});

const revokedHistory = buildRow({
  membershipId: "membership-5",
  claimId: "claim-5",
  auditHistory: [{ action: "mark_disputed" }],
  review: {
    sourceMembershipId: "membership-5",
    reviewStatus: "ownership_verification_pending",
    evidenceStatus: "submitted",
    evidenceValidationStatus: "auto_validated",
    evidenceSubmissions: [
      {
        type: "written_owner_or_officer_authorization",
        storageKey: "doc-5",
      },
    ],
    revokedAt: "2026-08-09T18:00:00.000Z",
  },
});

const unknownAuthorization = buildRow({
  membershipId: "membership-6",
  claimId: "claim-6",
  email: "",
  membership: {
    membershipId: "membership-6",
    membershipName: "Example Business LLC",
    email: "",
    phone: "4045551111",
    website: "example.com",
    userId: "user-1",
    businessId: "business-1",
  },
  claim: {
    membershipId: "membership-6",
    businessId: "business-1",
    businessName: "Example Business LLC",
    businessAddress: "123 Auburn Ave Atlanta GA 30303",
    phone: "4045551111",
    website: "example.com",
    email: "",
  },
  user: { _id: "user-1", email: "" },
});

const rows = [
  verifiedAutoEligible,
  missingEvidence,
  ownerConflict,
  competingClaimants,
  revokedHistory,
  unknownAuthorization,
].map((row) => ({
  ...row,
  verificationDecision: deriveFoundingVerificationDecision(row),
}));

const summary = getFoundingShadowValidationSummary(rows);

assert.equal(summary.totalCasesTested, 6);
assert.equal(summary.falseAutoVerifyCount, 0);
assert.equal(summary.mandatoryUnknownBlocksAutoVerify, true);
assert.equal(summary.expectedAutoVerify, 1);
assert.equal(summary.expectedMoreEvidence, 1);
assert.equal(summary.expectedConflictDispute, 2);
assert.equal(summary.expectedAdminReview, 2);
assert.equal(summary.engineAgreementCount, 6);
assert.equal(summary.engineDisagreementCount, 0);

const coverageByKey = Object.fromEntries(
  summary.signalCoverage.map((item) => [item.key, item]),
);
assert.equal(coverageByKey.business_name_match.available, 6);
assert.equal(coverageByKey.required_evidence_present.adminFallbackRequired, 1);
assert.equal(
  coverageByKey.claimant_domain_relationship_if_available.adminFallbackRequired,
  1,
);

const blueprint = getFoundingActivationContractBlueprint();
assert.equal(blueprint.mode, "DRY_RUN");
assert.equal(blueprint.automaticActivationEnabled, false);
assert.ok(
  blueprint.requiredChecks.includes(
    "claim state unchanged since evaluation",
  ),
);
assert.ok(
  blueprint.properties.includes("ATOMIC") &&
    blueprint.properties.includes("IDEMPOTENT"),
);

const auditRecord = buildFoundingDecisionAuditRecord(
  rows[0],
  rows[0].verificationDecision,
);
assert.equal(auditRecord.activationStatus, "DRY_RUN");
assert.equal(auditRecord.finalRecommendation, "AUTO_VERIFY_ELIGIBLE");
assert.ok(
  auditRecord.mandatoryConditions.every(
    (condition) => condition.status === "pass",
  ),
);

console.log("shadow-validation-tests: ok");
