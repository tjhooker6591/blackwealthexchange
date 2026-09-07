import { ObjectId, type Db, type Document } from "mongodb";

export type ClaimableBusinessSummary = {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  city: string;
  state: string;
  address: string;
  website?: string | null;
  phone?: string | null;
  description: string;
};

export type FoundingMembershipResumeState = {
  selectedBusinessId: string;
  confirmedBusinessId: string;
  resumeCheckoutRequested: boolean;
  resumeBusinessName: string;
  error: string;
};

export type ClaimableBusinessAvailability = {
  publicStatus: string;
  currentClaimState: string | null;
  claimable: boolean;
  unavailableReason:
    | "already_verified"
    | "claim_already_initiated"
    | "ownership_review_pending"
    | "membership_already_active"
    | null;
};

export const FOUNDING_MEMBERSHIP_ITEM_ID =
  "founding-verified-business-growth-membership";
export const FOUNDING_MEMBERSHIP_PRODUCT_KEY =
  "founding_verified_business_growth_membership";
export const FOUNDING_MEMBERSHIP_NAME =
  "Founding Verified Business Growth Membership";
export const FOUNDING_MEMBERSHIP_PRICE_CENTS = 4900;
export const FOUNDING_MEMBERSHIP_CURRENCY = "usd";
export const FOUNDING_MEMBERSHIP_PILOT_LIMIT = 10;

export type FoundingMembershipStatus = "active" | "past_due" | "cancelled";

export type FoundingClaimStatus =
  | "claim_initiated"
  | "ownership_verification_pending"
  | "additional_evidence_required"
  | "ownership_verified"
  | "ownership_verification_failed"
  | "disputed";

export type FoundingOwnershipReviewStatus =
  | "ownership_verification_pending"
  | "additional_evidence_required"
  | "ownership_verified"
  | "ownership_verification_failed"
  | "disputed";

export const FOUNDING_CLAIM_LOCKED_STAGES = [
  "claim_initiated",
  "ownership_verification_pending",
  "additional_evidence_required",
  "ownership_verified",
  "founding_growth_member",
  "disputed",
] as const;

export const FOUNDING_OWNERSHIP_EVIDENCE_TYPES = [
  "website_domain_email",
  "listed_business_phone",
  "formation_document",
  "business_license",
  "official_website_or_social_account",
  "written_owner_or_officer_authorization",
  "other",
] as const;

function stringOrNull(v: unknown) {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function getFoundingMembershipAvailability(
  row: Record<string, any>,
): ClaimableBusinessAvailability {
  const publicStatus =
    String(row.status || row.trustStatus || "")
      .trim()
      .toLowerCase() || "public";
  const currentClaimState = normalizeFoundingClaimStage(row.claimStage);
  // Verification-field drift fix (2026-09-07): `verified` is canonical;
  // isVerified no longer read independently.
  const alreadyVerified = row.verified === true || publicStatus === "verified";
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

export function normalizeFoundingMembershipResumeState(args: {
  requestedBusinessId: string;
  resumeParam: string;
  business: ClaimableBusinessSummary | null;
}): FoundingMembershipResumeState {
  const requestedBusinessId = String(args.requestedBusinessId || "").trim();
  const resumeParam = String(args.resumeParam || "")
    .trim()
    .toLowerCase();
  const resumeCheckoutRequested = resumeParam === "checkout";

  if (!requestedBusinessId) {
    return {
      selectedBusinessId: "",
      confirmedBusinessId: "",
      resumeCheckoutRequested: false,
      resumeBusinessName: "",
      error: "",
    };
  }

  if (!args.business) {
    return {
      selectedBusinessId: "",
      confirmedBusinessId: "",
      resumeCheckoutRequested: false,
      resumeBusinessName: "",
      error:
        "The requested business could not be confirmed as a current public claimable listing. Please choose one from the list below.",
    };
  }

  return {
    selectedBusinessId: args.business.id,
    confirmedBusinessId: args.business.id,
    resumeCheckoutRequested,
    resumeBusinessName: args.business.businessName,
    error: "",
  };
}

export function shouldAutoResumeFoundingCheckout(args: {
  confirmedBusinessId: string;
  resumeCheckoutRequested: boolean;
  checkoutInFlight: boolean;
  autoResumeConsumed: boolean;
}) {
  return Boolean(
    args.confirmedBusinessId &&
    args.resumeCheckoutRequested &&
    !args.checkoutInFlight &&
    !args.autoResumeConsumed,
  );
}

export function isFoundingMembershipItemId(itemId: string) {
  return itemId.trim().toLowerCase() === FOUNDING_MEMBERSHIP_ITEM_ID;
}

export function isFoundingMembershipProductKey(productKey: string) {
  return productKey.trim().toLowerCase() === FOUNDING_MEMBERSHIP_PRODUCT_KEY;
}

export function normalizeFoundingClaimStage(value: unknown): string | null {
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

export function toCanonicalMongoIdStrings(value: unknown): string[] {
  if (value == null) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  const out = [raw];
  if (ObjectId.isValid(raw)) {
    const objectIdString = new ObjectId(raw).toString();
    if (!out.includes(objectIdString)) out.push(objectIdString);
  }
  return out;
}

export function buildMongoIdOrStringQuery(field: string, value: unknown) {
  const variants = toCanonicalMongoIdStrings(value);
  if (!variants.length) return null;

  const clauses: Record<string, unknown>[] = [];
  for (const variant of variants) {
    clauses.push({ [field]: variant });
    if (ObjectId.isValid(variant)) {
      clauses.push({ [field]: new ObjectId(variant) });
    }
  }

  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

export function normalizeFoundingPaymentStatus(
  row: Record<string, any> | null | undefined,
) {
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

export function formatUsdFromCents(value: unknown) {
  const cents = typeof value === "number" ? value : Number(value || 0);
  if (!Number.isFinite(cents)) return "$0.00 USD";
  return `$${(cents / 100).toFixed(2)} USD`;
}

export type FoundingVerificationAction =
  | "verify"
  | "request_more_evidence"
  | "request_additional_evidence"
  | "verification_failed"
  | "mark_disputed"
  | "reopen_verification"
  | "submit_evidence";

export type FoundingTransitionState = {
  resultingStatus: FoundingOwnershipReviewStatus;
  claimStatus: FoundingClaimStatus;
  claimStage: string;
  claimLocked: boolean;
  managementAccessStatus:
    | "approved"
    | "locked_pending_verification"
    | "rejected";
  ownershipAccessStatus:
    | "approved"
    | "locked_pending_verification"
    | "rejected";
  fulfillmentStatus: "active" | "pending_verification_queue" | "closed";
  evidenceStatus: string;
  evidencePortalStatus: "complete" | "open" | "closed";
  onboardingStatus: "started" | "active" | "closed";
  nextStep: string;
  paymentStatus: "paid" | "pending";
  paymentAmountCents: number;
  paymentDisplayAmount: string;
  paymentCurrency: string;
  publicListingStatus:
    | "ownership_verified"
    | "verification_pending"
    | "unclaimed";
};

export function buildFoundingTransitionState(args: {
  action: FoundingVerificationAction;
  previousStatus?: unknown;
  evidenceStatus?: unknown;
  paymentAmountCents?: unknown;
  paymentCurrency?: unknown;
}): FoundingTransitionState {
  const action = args.action;
  const previousStatus =
    (normalizeFoundingClaimStage(
      args.previousStatus,
    ) as FoundingOwnershipReviewStatus | null) ||
    "ownership_verification_pending";
  const existingEvidenceStatus = String(args.evidenceStatus || "").trim();
  const paymentAmountCents = Number(
    args.paymentAmountCents || FOUNDING_MEMBERSHIP_PRICE_CENTS,
  );
  const paymentCurrency = String(
    args.paymentCurrency || FOUNDING_MEMBERSHIP_CURRENCY,
  ).toLowerCase();
  const paymentDisplayAmount = formatUsdFromCents(paymentAmountCents);

  if (action === "verify") {
    return {
      resultingStatus: "ownership_verified",
      claimStatus: "ownership_verified",
      claimStage: "ownership_verified",
      claimLocked: true,
      managementAccessStatus: "approved",
      ownershipAccessStatus: "approved",
      fulfillmentStatus: "active",
      evidenceStatus: existingEvidenceStatus || "evidence_verified",
      evidencePortalStatus: "complete",
      onboardingStatus: "active",
      nextStep: "ownership verified",
      paymentStatus: "paid",
      paymentAmountCents,
      paymentDisplayAmount,
      paymentCurrency,
      publicListingStatus: "ownership_verified",
    };
  }

  if (
    action === "request_more_evidence" ||
    action === "request_additional_evidence"
  ) {
    return {
      resultingStatus: "additional_evidence_required",
      claimStatus: "additional_evidence_required",
      claimStage: "ownership_verification_pending",
      claimLocked: true,
      managementAccessStatus: "locked_pending_verification",
      ownershipAccessStatus: "locked_pending_verification",
      fulfillmentStatus: "pending_verification_queue",
      evidenceStatus: "awaiting_additional_evidence",
      evidencePortalStatus: "open",
      onboardingStatus: "started",
      nextStep: "submit additional ownership evidence",
      paymentStatus: "paid",
      paymentAmountCents,
      paymentDisplayAmount,
      paymentCurrency,
      publicListingStatus: "verification_pending",
    };
  }

  if (action === "verification_failed") {
    return {
      resultingStatus: "ownership_verification_failed",
      claimStatus: "ownership_verification_failed",
      claimStage: "unclaimed",
      claimLocked: false,
      managementAccessStatus: "rejected",
      ownershipAccessStatus: "rejected",
      fulfillmentStatus: "closed",
      evidenceStatus: existingEvidenceStatus || "reviewed",
      evidencePortalStatus: "closed",
      onboardingStatus: "closed",
      nextStep: "verification closed",
      paymentStatus: "paid",
      paymentAmountCents,
      paymentDisplayAmount,
      paymentCurrency,
      publicListingStatus: "unclaimed",
    };
  }

  if (action === "mark_disputed") {
    return {
      resultingStatus: "disputed",
      claimStatus: "disputed",
      claimStage: "ownership_verification_pending",
      claimLocked: true,
      managementAccessStatus: "locked_pending_verification",
      ownershipAccessStatus: "locked_pending_verification",
      fulfillmentStatus: "pending_verification_queue",
      evidenceStatus: existingEvidenceStatus || "disputed",
      evidencePortalStatus: "open",
      onboardingStatus: "started",
      nextStep: "ownership verification in progress",
      paymentStatus: "paid",
      paymentAmountCents,
      paymentDisplayAmount,
      paymentCurrency,
      publicListingStatus: "verification_pending",
    };
  }

  if (action === "reopen_verification") {
    return {
      resultingStatus: "ownership_verification_pending",
      claimStatus: "claim_initiated",
      claimStage: "ownership_verification_pending",
      claimLocked: true,
      managementAccessStatus: "locked_pending_verification",
      ownershipAccessStatus: "locked_pending_verification",
      fulfillmentStatus: "pending_verification_queue",
      evidenceStatus: existingEvidenceStatus || "awaiting_owner_documents",
      evidencePortalStatus: "open",
      onboardingStatus: "started",
      nextStep: "submit ownership evidence for ownership verification",
      paymentStatus: "paid",
      paymentAmountCents,
      paymentDisplayAmount,
      paymentCurrency,
      publicListingStatus: "verification_pending",
    };
  }

  return {
    resultingStatus: previousStatus,
    claimStatus:
      previousStatus === "ownership_verified"
        ? "ownership_verified"
        : "claim_initiated",
    claimStage:
      previousStatus === "ownership_verified"
        ? "ownership_verified"
        : "ownership_verification_pending",
    claimLocked: true,
    managementAccessStatus:
      previousStatus === "ownership_verified"
        ? "approved"
        : "locked_pending_verification",
    ownershipAccessStatus:
      previousStatus === "ownership_verified"
        ? "approved"
        : "locked_pending_verification",
    fulfillmentStatus:
      previousStatus === "ownership_verified"
        ? "active"
        : "pending_verification_queue",
    evidenceStatus: "evidence_submitted",
    evidencePortalStatus:
      previousStatus === "ownership_verified" ? "complete" : "open",
    onboardingStatus:
      previousStatus === "ownership_verified" ? "active" : "started",
    nextStep:
      previousStatus === "ownership_verified"
        ? "ownership verified"
        : "submit ownership evidence for ownership verification",
    paymentStatus: "paid",
    paymentAmountCents,
    paymentDisplayAmount,
    paymentCurrency,
    publicListingStatus:
      previousStatus === "ownership_verified"
        ? "ownership_verified"
        : "verification_pending",
  };
}

export async function findFoundingSourcePayment(
  db: Db,
  membership: Record<string, any> | null | undefined,
) {
  const membershipId = String(membership?.membershipId || "").trim();
  const sourcePaymentId = String(membership?.sourcePaymentId || "").trim();
  const businessId = String(membership?.businessId || "").trim();
  const email = String(membership?.email || "")
    .trim()
    .toLowerCase();
  const queries: Document[] = [];

  if (sourcePaymentId) queries.push({ _id: sourcePaymentId as any });
  if (membershipId) queries.push({ membershipId });
  if (businessId) queries.push({ businessId });
  if (email) queries.push({ email });
  if (email) queries.push({ customerEmail: email });
  if (email) queries.push({ userEmail: email });

  if (!queries.length) return null;

  const rows = await db
    .collection("payments")
    .find({ $or: queries })
    .sort({ paidAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(20)
    .toArray();

  const exactSource = sourcePaymentId
    ? rows.find((row) => String(row?._id || "") === sourcePaymentId) || null
    : null;
  if (exactSource) return exactSource;

  const exactMembership = membershipId
    ? rows.find((row) => String(row?.membershipId || "") === membershipId) ||
      null
    : null;
  if (exactMembership) return exactMembership;

  return (
    rows.find((row) => normalizeFoundingPaymentStatus(row) === "paid") ||
    rows[0] ||
    null
  );
}

export function isFoundingClaimLockedStage(value: unknown) {
  const normalized = normalizeFoundingClaimStage(value);
  return (
    normalized != null &&
    FOUNDING_CLAIM_LOCKED_STAGES.includes(normalized as any)
  );
}

export function getFoundingClaimStatusLabel(value: unknown) {
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

export async function countActiveFoundingMemberships(db: Db) {
  return db.collection("business_memberships").countDocuments({
    productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
    membershipStatus: "active",
  });
}

export const FOUNDING_QUEUE_PENDING_STATES = [
  "ownership_verification_pending",
  "additional_evidence_required",
  "disputed",
] as const;

export const FOUNDING_QUEUE_HISTORY_STATES = [
  "ownership_verified",
  "ownership_verification_failed",
] as const;

export type FoundingQueueState =
  | (typeof FOUNDING_QUEUE_PENDING_STATES)[number]
  | (typeof FOUNDING_QUEUE_HISTORY_STATES)[number];

export type FoundingCanonicalRecord = {
  membershipId: string;
  businessId: string | null;
  userId: string | null;
  email: string | null;
  businessName: string | null;
  businessSlug: string | null;
  claimId: string | null;
  ownershipReviewId: string | null;
  paymentId: string | null;
  paymentStatus: string;
  paymentAmountCents: number;
  paymentDisplayAmount: string;
  paymentCurrency: string;
  membershipStatus: string | null;
  claimStatus: string | null;
  ownershipReviewStatus: string | null;
  claimStage: string | null;
  claimLocked: boolean;
  managementAccessStatus: string | null;
  ownershipAccessStatus: string | null;
  publicListingStatus: string | null;
  fulfillmentStatus: string | null;
  evidencePortalStatus: string | null;
  evidenceStatus: string | null;
  onboardingStatus: string | null;
  nextStep: string | null;
  claimedByUserId: string | null;
  managedByUserId: string | null;
  ownerUserIds: string[];
  competingClaimMembershipIds: string[];
  competingClaimantUserIds: string[];
  competingClaimantCount: number;
  queueState: FoundingQueueState | null;
  queueBucket: "pending" | "history" | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  auditHistory: any[];
  source: string;
  membership?: Record<string, any> | null;
  claim?: Record<string, any> | null;
  review?: Record<string, any> | null;
  business?: Record<string, any> | null;
  onboarding?: Record<string, any> | null;
  fulfillment?: Record<string, any> | null;
  payment?: Record<string, any> | null;
  user?: Record<string, any> | null;
  normalCheck?: FoundingNormalCheckResult | null;
  verificationDecision?: FoundingVerificationDecision | null;
};

export type FoundingConsistencyClassification =
  | "consistent_verified"
  | "consistent_pending_verification"
  | "conflicting_claimant"
  | "payment_inconsistency"
  | "conflicting_state"
  | "missing_linked_record"
  | "legacy_status_requiring_normalization";

export type FoundingNormalCheckVerdict =
  | "routine_admin_review"
  | "exception_admin_review";

export type FoundingNormalCheckIssue =
  | "missing_membership_id"
  | "missing_business_link"
  | "missing_claimant_user"
  | "missing_review_record"
  | "missing_claim_record"
  | "missing_business_record"
  | "payment_inconsistency"
  | "conflicting_state"
  | "conflicting_claimant"
  | "cross_business_management_access";

export type FoundingNormalCheckResult = {
  consistency: FoundingConsistencyClassification;
  issues: FoundingNormalCheckIssue[];
  verdict: FoundingNormalCheckVerdict;
  verdictReason:
    | "verified_history_consistent"
    | "pending_flow_consistent"
    | "missing_linked_record"
    | "payment_inconsistency"
    | "conflicting_claimant"
    | "conflicting_state"
    | "legacy_status_requiring_normalization";
  needsExceptionReview: boolean;
};

export type FoundingNormalCheckCounts = {
  routineAdminReview: number;
  exceptionAdminReview: number;
};

export type FoundingVerificationDisposition =
  | "AUTO_VERIFY_ELIGIBLE"
  | "ADMIN_REVIEW_REQUIRED"
  | "MORE_EVIDENCE_REQUIRED"
  | "CONFLICT_BLOCKED"
  | "DISPUTED"
  | "VERIFICATION_FAILED";

export type FoundingVerificationSignalStatus =
  | "pass"
  | "fail"
  | "unknown"
  | "not_applicable";

export type FoundingVerificationGroupId =
  | "business_identity"
  | "claimant_authorization"
  | "ownership_control"
  | "risk_exception"
  | "black_owned_status"
  | "payment_integrity";

export type FoundingVerificationSignal = {
  key: string;
  label: string;
  status: FoundingVerificationSignalStatus;
  summary: string;
  dataUsed: string[];
  implementedWithExistingData: boolean;
  requiresFutureExternalData: boolean;
  blocksAutoVerify: boolean;
  requiresAdminReview: boolean;
};

export type FoundingVerificationGroupResult = {
  id: FoundingVerificationGroupId;
  label: string;
  summary: string;
  passCount: number;
  failCount: number;
  unknownCount: number;
  signals: FoundingVerificationSignal[];
};

export type FoundingVerificationDecision = {
  policyVersion: string;
  disposition: FoundingVerificationDisposition;
  autoVerifyEligible: boolean;
  adminReviewRequired: boolean;
  ownershipAutomationPermitted: boolean;
  paymentIntegritySeparateFromOwnership: boolean;
  blackOwnedStatusAutomationImplemented: boolean;
  blackOwnedStatusLabel: "VERIFIED" | "UNVERIFIED" | "NOT_ESTABLISHED";
  automationBoundary: string;
  rationale: string[];
  mandatoryFailures: string[];
  mandatoryUnknowns: string[];
  mandatoryConditions: Array<{
    key: string;
    label: string;
    status: FoundingVerificationSignalStatus;
    reason: string;
  }>;
  groups: FoundingVerificationGroupResult[];
};

export type FoundingVerificationDecisionCounts = Record<
  FoundingVerificationDisposition,
  number
>;

export type FoundingStructuredMatchResult = "MATCH" | "MISMATCH" | "UNKNOWN";

export type FoundingClaimRelationship =
  | "OWNER"
  | "OFFICER"
  | "AUTHORIZED_REPRESENTATIVE"
  | "OTHER";

export type FoundingBusinessIntakeField = {
  currentListingValue: string | null;
  claimantProvidedValue: string | null;
  normalizedMatchResult: FoundingStructuredMatchResult;
};

export type FoundingStructuredEvidenceRecord = {
  evidenceType: string;
  purpose:
    | "ownership_control"
    | "representative_authority"
    | "business_identity";
  businessId: string | null;
  claimantUserId: string | null;
  submittedAt: string;
  source: string;
  validationState:
    | "not_reviewed"
    | "metadata_only"
    | "requires_more_evidence"
    | "admin_review_required";
  reviewState: "submitted" | "needs_followup" | "under_review";
  matchedSignals: string[];
  storageKey: string;
  redactedLabel: string;
  notes: string | null;
};

export type FoundingClaimIntakeRecord = {
  business: {
    businessName: FoundingBusinessIntakeField;
    addressLine1: FoundingBusinessIntakeField;
    city: FoundingBusinessIntakeField;
    state: FoundingBusinessIntakeField;
    postalCode: FoundingBusinessIntakeField;
    phone: FoundingBusinessIntakeField;
    website: FoundingBusinessIntakeField;
    businessEmail: FoundingBusinessIntakeField;
    socialUrls: FoundingBusinessIntakeField[];
  };
  claimant: {
    authenticatedUserId: string | null;
    claimantName: string | null;
    claimantEmail: string | null;
    claimantPhone: string | null;
    relationshipToBusiness: FoundingClaimRelationship | null;
    roleTitle: string | null;
  };
  authority: {
    claimantSaysAuthorized: boolean;
    requiresOwnershipEvidence: boolean;
    requiresRepresentativeAuthorityEvidence: boolean;
    ownershipEvidenceProvided: boolean;
    representativeAuthorityEvidenceProvided: boolean;
    authorizationVerified: boolean;
  };
  evidence: FoundingStructuredEvidenceRecord[];
  blackOwnedStatus: "NOT_ESTABLISHED";
  createdAt: string;
  updatedAt: string;
};

export type FoundingClaimIntakeFieldAudit = {
  field: string;
  currentlyCollected: boolean;
  structured: boolean;
  required: boolean;
  optional: boolean;
  usedByDa13Engine: boolean;
  missingGap: string | null;
};

export type FoundingOwnershipAutomationMode =
  | "DRY_RUN"
  | "AUTO_VERIFY_DISABLED"
  | "AUTO_VERIFY_ENABLED";

export type FoundingShadowValidationExpectedBucket =
  | "AUTO_VERIFY"
  | "ADMIN_REVIEW"
  | "MORE_EVIDENCE"
  | "CONFLICT_DISPUTE";

export type FoundingShadowValidationHistoricalOutcome =
  | "VERIFIED"
  | "REQUESTED_MORE_EVIDENCE"
  | "VERIFICATION_FAILED"
  | "DISPUTED"
  | "EXISTING_OWNER_CONFLICT"
  | "REVOKED"
  | "UNKNOWN";

export type FoundingShadowValidationCase = {
  caseId: string;
  claimId: string | null;
  membershipId: string;
  knownHistoricalOutcome: FoundingShadowValidationHistoricalOutcome;
  expectedBucket: FoundingShadowValidationExpectedBucket;
  engineRecommendation: FoundingVerificationDisposition;
  businessIdentityResult: "PASS" | "FAIL" | "UNKNOWN";
  claimantAuthorizationResult: "PASS" | "FAIL" | "UNKNOWN";
  ownershipControlResult: "PASS" | "FAIL" | "UNKNOWN";
  riskConflictResult: "PASS" | "FAIL" | "UNKNOWN";
  evidenceResult: "PASS" | "FAIL" | "UNKNOWN";
  blackOwnedStatusResult: "VERIFIED" | "UNVERIFIED" | "NOT_ESTABLISHED";
  matchesExpectedOutcome: boolean;
  falsePositiveRisk: "LOW" | "MODERATE" | "HIGH";
  falseNegativeRisk: "LOW" | "MODERATE" | "HIGH";
};

export type FoundingSignalCoverageSummary = {
  key: string;
  label: string;
  available: number;
  missing: number;
  reliableEnoughForAutoVerify: number;
  adminFallbackRequired: number;
};

export type FoundingShadowValidationSummary = {
  totalCasesTested: number;
  expectedAutoVerify: number;
  expectedAdminReview: number;
  expectedMoreEvidence: number;
  expectedConflictDispute: number;
  engineAgreementCount: number;
  engineDisagreementCount: number;
  falseAutoVerifyCount: number;
  mandatoryUnknownBlocksAutoVerify: boolean;
  estimatedHighConfidenceAutoVerifyCount: number;
  estimatedHighConfidenceAutoVerifyPercent: number;
  cases: FoundingShadowValidationCase[];
  signalCoverage: FoundingSignalCoverageSummary[];
};

export type FoundingActivationContractBlueprint = {
  mode: FoundingOwnershipAutomationMode;
  automaticActivationEnabled: boolean;
  policyVersion: string;
  states: FoundingOwnershipAutomationMode[];
  requiredChecks: string[];
  lastSecondConflictRecheck: string[];
  properties: Array<
    "ATOMIC" | "IDEMPOTENT" | "CONFLICT_SAFE" | "AUDITABLE" | "REPLAY_SAFE"
  >;
  auditRecordFields: string[];
};

export type FoundingDecisionAuditRecord = {
  claimId: string | null;
  membershipId: string;
  businessId: string | null;
  claimantUserId: string | null;
  timestamp: string;
  policyVersion: string;
  signals: Array<{
    groupId: FoundingVerificationGroupId;
    key: string;
    label: string;
    status: FoundingVerificationSignalStatus;
    summary: string;
  }>;
  mandatoryConditions: Array<{
    key: string;
    label: string;
    status: FoundingVerificationSignalStatus;
    reason: string;
  }>;
  finalRecommendation: FoundingVerificationDisposition;
  reason: string[];
  activationStatus:
    | "DRY_RUN"
    | "AUTO_VERIFY_DISABLED"
    | "AUTO_VERIFY_ENABLED_NOT_USED";
};

export function getFoundingOwnershipAutomationMode(): FoundingOwnershipAutomationMode {
  const raw = String(
    process.env.FOUNDING_OWNERSHIP_AUTOMATION_MODE || "DRY_RUN",
  )
    .trim()
    .toUpperCase();
  if (raw === "AUTO_VERIFY_ENABLED") return "AUTO_VERIFY_ENABLED";
  if (raw === "AUTO_VERIFY_DISABLED") return "AUTO_VERIFY_DISABLED";
  return "DRY_RUN";
}

function normalizeComparisonText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value: unknown) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return null;
  return digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
}

function normalizeHostname(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const withProtocol = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
    const hostname = new URL(withProtocol).hostname
      .trim()
      .toLowerCase()
      .replace(/^www\./, "");
    return hostname || null;
  } catch {
    return raw.toLowerCase().replace(/^www\./, "") || null;
  }
}

function extractEmailDomain(value: unknown) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw.includes("@")) return null;
  const domain =
    raw
      .split("@")
      .pop()
      ?.trim()
      .replace(/^www\./, "") || "";
  return domain || null;
}

export function normalizeFoundingBusinessName(value: unknown) {
  return normalizeComparisonText(value) || null;
}

export function normalizeFoundingAddress(value: unknown) {
  return normalizeComparisonText(value) || null;
}

export function normalizeFoundingPhoneValue(value: unknown) {
  return normalizePhone(value);
}

export function normalizeFoundingHostname(value: unknown) {
  return normalizeHostname(value);
}

export function normalizeFoundingEmailDomain(value: unknown) {
  return extractEmailDomain(value);
}

function firstMeaningfulString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function uniqueNormalizedValues(
  values: unknown[],
  normalizer: (value: unknown) => string | null,
) {
  return Array.from(
    new Set(values.map((value) => normalizer(value)).filter(Boolean)),
  ) as string[];
}

function countAuditActions(auditHistory: any[], action: string) {
  return auditHistory.filter(
    (item) => String(item?.action || "").trim() === action,
  ).length;
}

function buildSignal(args: {
  key: string;
  label: string;
  status: FoundingVerificationSignalStatus;
  summary: string;
  dataUsed: string[];
  implementedWithExistingData?: boolean;
  requiresFutureExternalData?: boolean;
  blocksAutoVerify?: boolean;
  requiresAdminReview?: boolean;
}): FoundingVerificationSignal {
  return {
    key: args.key,
    label: args.label,
    status: args.status,
    summary: args.summary,
    dataUsed: args.dataUsed,
    implementedWithExistingData: args.implementedWithExistingData !== false,
    requiresFutureExternalData: args.requiresFutureExternalData === true,
    blocksAutoVerify: args.blocksAutoVerify !== false,
    requiresAdminReview: args.requiresAdminReview !== false,
  };
}

function summarizeGroup(signals: FoundingVerificationSignal[]) {
  const passCount = signals.filter((signal) => signal.status === "pass").length;
  const failCount = signals.filter((signal) => signal.status === "fail").length;
  const unknownCount = signals.filter(
    (signal) => signal.status === "unknown",
  ).length;
  const summary =
    failCount > 0
      ? `${failCount} failing signal${failCount === 1 ? "" : "s"}`
      : unknownCount > 0
        ? `${unknownCount} unresolved signal${unknownCount === 1 ? "" : "s"}`
        : `${passCount} passing signal${passCount === 1 ? "" : "s"}`;
  return { passCount, failCount, unknownCount, summary };
}

function buildGroup(
  id: FoundingVerificationGroupId,
  label: string,
  signals: FoundingVerificationSignal[],
): FoundingVerificationGroupResult {
  return {
    id,
    label,
    signals,
    ...summarizeGroup(signals),
  };
}

function compareSignalValues(
  label: string,
  key: string,
  leftValue: unknown,
  rightValue: unknown,
  dataUsed: string[],
  normalizer: (value: unknown) => string | null,
) {
  const left = normalizer(leftValue);
  const right = normalizer(rightValue);
  if (!left || !right) {
    return buildSignal({
      key,
      label,
      status: "unknown",
      summary: "Current BWE records do not contain both values yet.",
      dataUsed,
    });
  }
  if (left === right) {
    return buildSignal({
      key,
      label,
      status: "pass",
      summary: "Current BWE values are consistent.",
      dataUsed,
    });
  }
  return buildSignal({
    key,
    label,
    status: "fail",
    summary: "Current BWE values materially disagree.",
    dataUsed,
  });
}

function hasComparableValue(...values: unknown[]) {
  return values.some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    return value != null;
  });
}

function buildMandatoryCondition(args: {
  key: string;
  label: string;
  status: FoundingVerificationSignalStatus;
  reason: string;
}) {
  return {
    key: args.key,
    label: args.label,
    status: args.status,
    reason: args.reason,
  };
}

function compareBusinessIntakeValues(
  currentValue: unknown,
  claimantValue: unknown,
  normalizer: (value: unknown) => string | null,
): FoundingStructuredMatchResult {
  const current = normalizer(currentValue);
  const claimant = normalizer(claimantValue);
  if (!current || !claimant) return "UNKNOWN";
  return current === claimant ? "MATCH" : "MISMATCH";
}

function ensureStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [] as string[];
}

function buildBusinessIntakeField(args: {
  currentListingValue: unknown;
  claimantProvidedValue: unknown;
  normalizer: (value: unknown) => string | null;
}): FoundingBusinessIntakeField {
  return {
    currentListingValue: stringOrNull(args.currentListingValue),
    claimantProvidedValue: stringOrNull(args.claimantProvidedValue),
    normalizedMatchResult: compareBusinessIntakeValues(
      args.currentListingValue,
      args.claimantProvidedValue,
      args.normalizer,
    ),
  };
}

function normalizeEvidencePurpose(
  relationshipToBusiness: FoundingClaimRelationship | null,
  evidenceType: string,
): "ownership_control" | "representative_authority" | "business_identity" {
  if (
    evidenceType === "listed_business_phone" ||
    evidenceType === "official_website_or_social_account" ||
    evidenceType === "website_domain_email"
  ) {
    return "business_identity";
  }
  if (relationshipToBusiness === "AUTHORIZED_REPRESENTATIVE") {
    return "representative_authority";
  }
  return "ownership_control";
}

export function isLegacyVerifiedFoundingRecord(
  row: Pick<
    FoundingCanonicalRecord,
    "queueState" | "claimStatus" | "ownershipReviewStatus" | "review"
  >,
) {
  const verified =
    row.queueState === "ownership_verified" ||
    normalizeFoundingClaimStage(row.claimStatus) === "ownership_verified" ||
    normalizeFoundingClaimStage(row.ownershipReviewStatus) ===
      "ownership_verified";
  if (!verified) return false;
  const review = row.review || {};
  const claimIntake = (review as any)?.claimIntake;
  const evidence = Array.isArray((review as any)?.structuredEvidenceSubmissions)
    ? (review as any).structuredEvidenceSubmissions
    : Array.isArray((review as any)?.evidenceSubmissions)
      ? (review as any).evidenceSubmissions
      : [];
  return !claimIntake || evidence.length === 0;
}

export function buildFoundingClaimIntakeRecord(args: {
  business: Record<string, any> | null | undefined;
  claimantValues: Record<string, any>;
  claimantUserId: string | null;
  evidence: Array<Record<string, any>>;
  existingRecord?: Record<string, any> | null;
}) {
  const business = args.business || {};
  const claimantValues = args.claimantValues || {};
  const existingRecord = args.existingRecord || {};
  const relationshipToBusiness = (stringOrNull(
    claimantValues.relationshipToBusiness,
  ) ||
    stringOrNull(existingRecord?.claimant?.relationshipToBusiness) ||
    null) as FoundingClaimRelationship | null;
  const currentTimestamp = new Date().toISOString();
  const evidence = (args.evidence || []).map((item) => {
    const evidenceType =
      stringOrNull(item.evidenceType) || stringOrNull(item.type) || "other";
    const purpose =
      item.purpose ||
      normalizeEvidencePurpose(relationshipToBusiness, evidenceType);
    return {
      evidenceType,
      purpose,
      businessId: stringOrNull(item.businessId) || stringOrNull(business._id),
      claimantUserId: stringOrNull(item.claimantUserId) || args.claimantUserId,
      submittedAt: stringOrNull(item.submittedAt) || currentTimestamp,
      source: stringOrNull(item.source) || "claimant_portal",
      validationState:
        (stringOrNull(item.validationState) as
          | "not_reviewed"
          | "metadata_only"
          | "requires_more_evidence"
          | "admin_review_required"
          | null) || "metadata_only",
      reviewState:
        (stringOrNull(item.reviewState) as
          | "submitted"
          | "needs_followup"
          | "under_review"
          | null) || "submitted",
      matchedSignals: ensureStringArray(item.matchedSignals),
      storageKey: stringOrNull(item.storageKey) || "",
      redactedLabel: stringOrNull(item.redactedLabel) || "Evidence submitted",
      notes: stringOrNull(item.notes),
    } satisfies FoundingStructuredEvidenceRecord;
  });
  const ownershipEvidenceProvided = evidence.some(
    (item) => item.purpose === "ownership_control",
  );
  const representativeAuthorityEvidenceProvided = evidence.some(
    (item) => item.purpose === "representative_authority",
  );

  return {
    business: {
      businessName: buildBusinessIntakeField({
        currentListingValue: business.business_name,
        claimantProvidedValue: claimantValues.businessName,
        normalizer: normalizeFoundingBusinessName,
      }),
      addressLine1: buildBusinessIntakeField({
        currentListingValue:
          business.streetAddress || business.address1 || business.address,
        claimantProvidedValue: claimantValues.addressLine1,
        normalizer: normalizeFoundingAddress,
      }),
      city: buildBusinessIntakeField({
        currentListingValue: business.city,
        claimantProvidedValue: claimantValues.city,
        normalizer: normalizeFoundingBusinessName,
      }),
      state: buildBusinessIntakeField({
        currentListingValue: business.state,
        claimantProvidedValue: claimantValues.state,
        normalizer: normalizeFoundingBusinessName,
      }),
      postalCode: buildBusinessIntakeField({
        currentListingValue: business.zip || business.postalCode,
        claimantProvidedValue: claimantValues.postalCode,
        normalizer: normalizeFoundingBusinessName,
      }),
      phone: buildBusinessIntakeField({
        currentListingValue: business.phone || business.contactPhone,
        claimantProvidedValue: claimantValues.phone,
        normalizer: normalizeFoundingPhoneValue,
      }),
      website: buildBusinessIntakeField({
        currentListingValue: business.website || business.siteUrl,
        claimantProvidedValue: claimantValues.website,
        normalizer: normalizeFoundingHostname,
      }),
      businessEmail: buildBusinessIntakeField({
        currentListingValue: business.email || business.contactEmail,
        claimantProvidedValue: claimantValues.businessEmail,
        normalizer: (value) =>
          normalizeFoundingEmailDomain(value) ||
          normalizeFoundingHostname(value),
      }),
      socialUrls: ensureStringArray(claimantValues.socialUrls).map((value) =>
        buildBusinessIntakeField({
          currentListingValue:
            ensureStringArray(
              business.socialUrls || [
                business.instagram,
                business.facebook,
                business.linkedin,
                business.twitter,
              ],
            )[0] || null,
          claimantProvidedValue: value,
          normalizer: normalizeFoundingHostname,
        }),
      ),
    },
    claimant: {
      authenticatedUserId: args.claimantUserId,
      claimantName:
        stringOrNull(claimantValues.claimantName) ||
        stringOrNull(existingRecord?.claimant?.claimantName),
      claimantEmail:
        stringOrNull(claimantValues.claimantEmail) ||
        stringOrNull(existingRecord?.claimant?.claimantEmail),
      claimantPhone:
        stringOrNull(claimantValues.claimantPhone) ||
        stringOrNull(existingRecord?.claimant?.claimantPhone),
      relationshipToBusiness,
      roleTitle:
        stringOrNull(claimantValues.roleTitle) ||
        stringOrNull(existingRecord?.claimant?.roleTitle),
    },
    authority: {
      claimantSaysAuthorized: Boolean(relationshipToBusiness),
      requiresOwnershipEvidence:
        relationshipToBusiness === "OWNER" ||
        relationshipToBusiness === "OFFICER",
      requiresRepresentativeAuthorityEvidence:
        relationshipToBusiness === "AUTHORIZED_REPRESENTATIVE",
      ownershipEvidenceProvided,
      representativeAuthorityEvidenceProvided,
      authorizationVerified: false,
    },
    evidence,
    blackOwnedStatus: "NOT_ESTABLISHED",
    createdAt: stringOrNull(existingRecord?.createdAt) || currentTimestamp,
    updatedAt: currentTimestamp,
  } satisfies FoundingClaimIntakeRecord;
}

export function getFoundingClaimIntakeFieldAudit(): FoundingClaimIntakeFieldAudit[] {
  return [
    {
      field: "business.businessName",
      currentlyCollected: false,
      structured: true,
      required: true,
      optional: false,
      usedByDa13Engine: true,
      missingGap:
        "Current claim flow does not store a claimant-confirmed business-name field separately from the listing.",
    },
    {
      field: "business.addressLine1 / city / state / postalCode",
      currentlyCollected: false,
      structured: true,
      required: true,
      optional: false,
      usedByDa13Engine: true,
      missingGap:
        "Current claim flow lacks structured address confirmation and normalized comparison storage.",
    },
    {
      field: "business.phone",
      currentlyCollected: false,
      structured: true,
      required: false,
      optional: true,
      usedByDa13Engine: true,
      missingGap:
        "Phone comparison was previously inferred only from sparse claim data.",
    },
    {
      field: "business.website / domain",
      currentlyCollected: false,
      structured: true,
      required: false,
      optional: true,
      usedByDa13Engine: true,
      missingGap:
        "Website/domain confirmation was not previously collected from the claimant intake flow.",
    },
    {
      field: "business.businessEmail",
      currentlyCollected: false,
      structured: true,
      required: false,
      optional: true,
      usedByDa13Engine: true,
      missingGap:
        "Business email/domain relationship was not explicitly captured at intake.",
    },
    {
      field: "business.socialUrls",
      currentlyCollected: false,
      structured: true,
      required: false,
      optional: true,
      usedByDa13Engine: false,
      missingGap:
        "Social URLs were not captured as structured claimant-provided values.",
    },
    {
      field: "claimant.authenticatedUserId",
      currentlyCollected: true,
      structured: true,
      required: true,
      optional: false,
      usedByDa13Engine: true,
      missingGap: null,
    },
    {
      field: "claimant.claimantName",
      currentlyCollected: false,
      structured: true,
      required: true,
      optional: false,
      usedByDa13Engine: false,
      missingGap:
        "Claimant name was not being collected in the dedicated claim-intake flow.",
    },
    {
      field: "claimant.claimantEmail / claimantPhone",
      currentlyCollected: true,
      structured: true,
      required: true,
      optional: false,
      usedByDa13Engine: true,
      missingGap:
        "Email existed implicitly, but claimant-confirmed contact fields were not persisted as structured intake data.",
    },
    {
      field: "claimant.relationshipToBusiness / roleTitle",
      currentlyCollected: false,
      structured: true,
      required: true,
      optional: false,
      usedByDa13Engine: true,
      missingGap:
        "The claim flow lacked a structured relationship/authority declaration.",
    },
    {
      field:
        "authority.ownershipEvidence / representativeAuthorityEvidence metadata",
      currentlyCollected: false,
      structured: true,
      required: true,
      optional: false,
      usedByDa13Engine: true,
      missingGap:
        "Evidence previously existed only as loose submission references without purpose/validation metadata.",
    },
  ];
}

function summarizeGroupOutcome(
  group: FoundingVerificationGroupResult | null | undefined,
): "PASS" | "FAIL" | "UNKNOWN" {
  if (!group) return "UNKNOWN";
  if (group.failCount > 0) return "FAIL";
  if (group.unknownCount > 0) return "UNKNOWN";
  return "PASS";
}

function getMandatoryConditionStatus(
  decision: FoundingVerificationDecision | null | undefined,
  key: string,
) {
  return (
    decision?.mandatoryConditions.find((condition) => condition.key === key)
      ?.status || "unknown"
  );
}

function inferHistoricalOutcome(
  row: FoundingCanonicalRecord,
  decision: FoundingVerificationDecision,
): FoundingShadowValidationHistoricalOutcome {
  const auditHistory = Array.isArray(row.auditHistory) ? row.auditHistory : [];
  const review = row.review || {};
  const claim = row.claim || {};
  const business = row.business || {};

  if (
    Boolean((review as any)?.revokedAt) ||
    Boolean((claim as any)?.revokedAt) ||
    Boolean((business as any)?.revokedAt)
  ) {
    return "REVOKED";
  }
  if (
    row.queueState === "disputed" ||
    countAuditActions(auditHistory, "mark_disputed") > 0 ||
    row.competingClaimantCount > 1
  ) {
    return "DISPUTED";
  }
  if (
    getMandatoryConditionStatus(decision, "no_conflicting_verified_owner") ===
    "fail"
  ) {
    return "EXISTING_OWNER_CONFLICT";
  }
  if (
    row.queueState === "ownership_verification_failed" ||
    countAuditActions(auditHistory, "verification_failed") > 0
  ) {
    return "VERIFICATION_FAILED";
  }
  if (row.queueState === "additional_evidence_required") {
    return "REQUESTED_MORE_EVIDENCE";
  }
  if (row.queueState === "ownership_verified") {
    return "VERIFIED";
  }
  return "UNKNOWN";
}

function mapHistoricalOutcomeToExpectedBucket(
  outcome: FoundingShadowValidationHistoricalOutcome,
): FoundingShadowValidationExpectedBucket {
  if (outcome === "VERIFIED") return "AUTO_VERIFY";
  if (outcome === "REQUESTED_MORE_EVIDENCE") return "MORE_EVIDENCE";
  if (outcome === "DISPUTED" || outcome === "EXISTING_OWNER_CONFLICT") {
    return "CONFLICT_DISPUTE";
  }
  return "ADMIN_REVIEW";
}

function mapDispositionToExpectedBucket(
  disposition: FoundingVerificationDisposition,
): FoundingShadowValidationExpectedBucket {
  if (disposition === "AUTO_VERIFY_ELIGIBLE") return "AUTO_VERIFY";
  if (disposition === "MORE_EVIDENCE_REQUIRED") return "MORE_EVIDENCE";
  if (disposition === "CONFLICT_BLOCKED" || disposition === "DISPUTED") {
    return "CONFLICT_DISPUTE";
  }
  return "ADMIN_REVIEW";
}

function getSignalCoverageSummary(
  rows: Array<
    FoundingCanonicalRecord & {
      verificationDecision?: FoundingVerificationDecision | null;
    }
  >,
): FoundingSignalCoverageSummary[] {
  const signalKeys = [
    "business_name_match",
    "address_match_if_available",
    "website_domain_match_if_available",
    "phone_match_if_available",
    "claimant_account_linkage",
    "claimant_domain_relationship_if_available",
    "representative_authority_evidence",
    "required_evidence_present",
  ] as const;
  const labels: Record<(typeof signalKeys)[number], string> = {
    business_name_match: "Business name consistency",
    address_match_if_available: "Address consistency",
    website_domain_match_if_available: "Website/domain consistency",
    phone_match_if_available: "Phone/contact consistency",
    claimant_account_linkage: "Claimant/account linkage",
    claimant_domain_relationship_if_available:
      "Business-contact/domain relationship",
    representative_authority_evidence: "Representative authority evidence",
    required_evidence_present: "Required ownership/control evidence present",
  };

  return signalKeys.map((key) => {
    let available = 0;
    let missing = 0;
    let reliableEnoughForAutoVerify = 0;
    let adminFallbackRequired = 0;

    for (const row of rows) {
      const status = getMandatoryConditionStatus(row.verificationDecision, key);
      if (status === "unknown" || status === "not_applicable") {
        missing += 1;
        adminFallbackRequired += 1;
        continue;
      }
      available += 1;
      if (status === "pass") {
        reliableEnoughForAutoVerify += 1;
      } else {
        adminFallbackRequired += 1;
      }
    }

    return {
      key,
      label: labels[key],
      available,
      missing,
      reliableEnoughForAutoVerify,
      adminFallbackRequired,
    };
  });
}

export function buildFoundingDecisionAuditRecord(
  row: FoundingCanonicalRecord,
  decision: FoundingVerificationDecision,
): FoundingDecisionAuditRecord {
  const mode = getFoundingOwnershipAutomationMode();
  return {
    claimId: row.claimId,
    membershipId: row.membershipId,
    businessId: row.businessId,
    claimantUserId: row.userId,
    timestamp: new Date().toISOString(),
    policyVersion: decision.policyVersion,
    signals: decision.groups.flatMap((group) =>
      group.signals.map((signal) => ({
        groupId: group.id,
        key: signal.key,
        label: signal.label,
        status: signal.status,
        summary: signal.summary,
      })),
    ),
    mandatoryConditions: decision.mandatoryConditions.map((condition) => ({
      key: condition.key,
      label: condition.label,
      status: condition.status,
      reason: condition.reason,
    })),
    finalRecommendation: decision.disposition,
    reason: decision.rationale,
    activationStatus:
      mode === "AUTO_VERIFY_ENABLED"
        ? "AUTO_VERIFY_ENABLED_NOT_USED"
        : mode === "AUTO_VERIFY_DISABLED"
          ? "AUTO_VERIFY_DISABLED"
          : "DRY_RUN",
  };
}

export function getFoundingActivationContractBlueprint(): FoundingActivationContractBlueprint {
  const mode = getFoundingOwnershipAutomationMode();
  return {
    mode,
    automaticActivationEnabled: mode === "AUTO_VERIFY_ENABLED",
    policyVersion: "da13-v1",
    states: ["DRY_RUN", "AUTO_VERIFY_DISABLED", "AUTO_VERIFY_ENABLED"],
    requiredChecks: [
      "decision = AUTO_VERIFY_ELIGIBLE",
      "all mandatory conditions = PASS",
      "no conflict/dispute/revocation",
      "decision policy version current",
      "claim state unchanged since evaluation",
      "ownership state unchanged since evaluation",
      "claimant still authenticated/eligible",
      "no verified owner has appeared since evaluation",
    ],
    lastSecondConflictRecheck: [
      "claim state unchanged since evaluation",
      "ownership state unchanged since evaluation",
      "claimant still authenticated/eligible",
      "no verified owner has appeared since evaluation",
    ],
    properties: [
      "ATOMIC",
      "IDEMPOTENT",
      "CONFLICT_SAFE",
      "AUDITABLE",
      "REPLAY_SAFE",
    ],
    auditRecordFields: [
      "CLAIM",
      "BUSINESS",
      "CLAIMANT",
      "TIMESTAMP",
      "POLICY VERSION",
      "SIGNALS",
      "PASS/FAIL/UNKNOWN",
      "FINAL RECOMMENDATION",
      "REASON",
      "ACTIVATION STATUS",
      "OWNERSHIP RECORD CREATED",
      "MANAGEMENT RIGHTS GRANTED",
      "ACTIVATION TIMESTAMP",
      "ACTIVATION POLICY VERSION",
    ],
  };
}

export function getFoundingShadowValidationSummary(
  rows: Array<
    FoundingCanonicalRecord & {
      verificationDecision?: FoundingVerificationDecision | null;
    }
  >,
): FoundingShadowValidationSummary {
  const cases = rows.map((row) => {
    const decision =
      row.verificationDecision || deriveFoundingVerificationDecision(row);
    const historicalOutcome = inferHistoricalOutcome(row, decision);
    const expectedBucket =
      mapHistoricalOutcomeToExpectedBucket(historicalOutcome);
    const engineBucket = mapDispositionToExpectedBucket(decision.disposition);
    const matchesExpectedOutcome = expectedBucket === engineBucket;
    const evidenceStatus = getMandatoryConditionStatus(
      decision,
      "required_evidence_present",
    );

    return {
      caseId: row.claimId || row.membershipId,
      claimId: row.claimId,
      membershipId: row.membershipId,
      knownHistoricalOutcome: historicalOutcome,
      expectedBucket,
      engineRecommendation: decision.disposition,
      businessIdentityResult: summarizeGroupOutcome(
        decision.groups.find((group) => group.id === "business_identity"),
      ),
      claimantAuthorizationResult: summarizeGroupOutcome(
        decision.groups.find((group) => group.id === "claimant_authorization"),
      ),
      ownershipControlResult: summarizeGroupOutcome(
        decision.groups.find((group) => group.id === "ownership_control"),
      ),
      riskConflictResult: summarizeGroupOutcome(
        decision.groups.find((group) => group.id === "risk_exception"),
      ),
      evidenceResult:
        evidenceStatus === "pass"
          ? "PASS"
          : evidenceStatus === "fail"
            ? "FAIL"
            : "UNKNOWN",
      blackOwnedStatusResult: decision.blackOwnedStatusLabel,
      matchesExpectedOutcome,
      falsePositiveRisk:
        decision.disposition === "AUTO_VERIFY_ELIGIBLE" &&
        expectedBucket !== "AUTO_VERIFY"
          ? "HIGH"
          : decision.disposition === "AUTO_VERIFY_ELIGIBLE"
            ? "LOW"
            : "LOW",
      falseNegativeRisk:
        expectedBucket === "AUTO_VERIFY" &&
        decision.disposition !== "AUTO_VERIFY_ELIGIBLE"
          ? "MODERATE"
          : "LOW",
    } satisfies FoundingShadowValidationCase;
  });

  const totalCasesTested = cases.length;
  const expectedAutoVerify = cases.filter(
    (item) => item.expectedBucket === "AUTO_VERIFY",
  ).length;
  const expectedAdminReview = cases.filter(
    (item) => item.expectedBucket === "ADMIN_REVIEW",
  ).length;
  const expectedMoreEvidence = cases.filter(
    (item) => item.expectedBucket === "MORE_EVIDENCE",
  ).length;
  const expectedConflictDispute = cases.filter(
    (item) => item.expectedBucket === "CONFLICT_DISPUTE",
  ).length;
  const engineAgreementCount = cases.filter(
    (item) => item.matchesExpectedOutcome,
  ).length;
  const engineDisagreementCount = totalCasesTested - engineAgreementCount;
  const falseAutoVerifyCount = cases.filter(
    (item) =>
      item.engineRecommendation === "AUTO_VERIFY_ELIGIBLE" &&
      item.expectedBucket !== "AUTO_VERIFY",
  ).length;
  const mandatoryUnknownBlocksAutoVerify = rows.every((row) => {
    const decision =
      row.verificationDecision || deriveFoundingVerificationDecision(row);
    return !(
      decision.disposition === "AUTO_VERIFY_ELIGIBLE" &&
      decision.mandatoryConditions.some(
        (condition) => condition.status === "unknown",
      )
    );
  });
  const estimatedHighConfidenceAutoVerifyCount = rows.filter((row) => {
    const decision =
      row.verificationDecision || deriveFoundingVerificationDecision(row);
    return (
      decision.disposition === "AUTO_VERIFY_ELIGIBLE" &&
      decision.mandatoryConditions.every(
        (condition) => condition.status === "pass",
      )
    );
  }).length;
  const estimatedHighConfidenceAutoVerifyPercent = totalCasesTested
    ? Number(
        (
          (estimatedHighConfidenceAutoVerifyCount / totalCasesTested) *
          100
        ).toFixed(1),
      )
    : 0;

  return {
    totalCasesTested,
    expectedAutoVerify,
    expectedAdminReview,
    expectedMoreEvidence,
    expectedConflictDispute,
    engineAgreementCount,
    engineDisagreementCount,
    falseAutoVerifyCount,
    mandatoryUnknownBlocksAutoVerify,
    estimatedHighConfidenceAutoVerifyCount,
    estimatedHighConfidenceAutoVerifyPercent,
    cases,
    signalCoverage: getSignalCoverageSummary(rows),
  };
}

export function deriveFoundingVerificationDecision(
  row: FoundingCanonicalRecord,
): FoundingVerificationDecision {
  const business = row.business || {};
  const claim = row.claim || {};
  const review = row.review || {};
  const claimIntake = ((review as any)?.claimIntake ||
    {}) as Partial<FoundingClaimIntakeRecord>;
  const membership = row.membership || {};
  const user = row.user || {};
  const normalCheck = row.normalCheck || null;
  const auditHistory = Array.isArray(row.auditHistory) ? row.auditHistory : [];
  const evidenceSubmissions = Array.isArray(
    (review as any)?.structuredEvidenceSubmissions,
  )
    ? (review as any).structuredEvidenceSubmissions
    : Array.isArray(review?.evidenceSubmissions)
      ? review.evidenceSubmissions
      : [];

  const businessWebsite = firstMeaningfulString(
    business.website,
    business.siteUrl,
    business.domain,
  );
  const claimWebsite = firstMeaningfulString(
    claimIntake?.business?.website?.claimantProvidedValue,
    claim.website,
    membership.website,
    review.website,
  );
  const businessEmail = firstMeaningfulString(
    business.email,
    business.contactEmail,
  );
  const claimantEmail = firstMeaningfulString(
    claimIntake?.claimant?.claimantEmail,
    row.email,
    claim.email,
    membership.email,
    user.email,
  );
  const claimantEmails = [
    claimIntake?.claimant?.claimantEmail,
    claim.email,
    membership.email,
    user.email,
    row.email,
  ];
  const businessAddress = firstMeaningfulString(
    business.address,
    business.streetAddress,
    business.address1,
    business.fullAddress,
  );
  const claimAddress = firstMeaningfulString(
    claimIntake?.business?.addressLine1?.claimantProvidedValue,
    claim.address,
    claim.businessAddress,
    membership.address,
    user.address,
  );
  const claimCity = firstMeaningfulString(
    claimIntake?.business?.city?.claimantProvidedValue,
    claim.city,
    membership.city,
  );
  const claimState = firstMeaningfulString(
    claimIntake?.business?.state?.claimantProvidedValue,
    claim.state,
    membership.state,
  );
  const claimPostalCode = firstMeaningfulString(
    claimIntake?.business?.postalCode?.claimantProvidedValue,
    claim.postalCode,
    claim.zip,
    membership.postalCode,
  );
  const businessPhone = firstMeaningfulString(
    business.phone,
    business.contactPhone,
  );
  const claimantPhone = firstMeaningfulString(
    claimIntake?.claimant?.claimantPhone,
    claimIntake?.business?.phone?.claimantProvidedValue,
    claim.phone,
    membership.phone,
    user.phone,
  );
  const businessSocial = firstMeaningfulString(
    business.instagram,
    business.facebook,
    business.linkedin,
    business.twitter,
  );
  const claimSocial = firstMeaningfulString(
    ...(Array.isArray(claimIntake?.business?.socialUrls)
      ? claimIntake.business.socialUrls.map(
          (item) => item.claimantProvidedValue,
        )
      : []),
    claim.instagram,
    claim.facebook,
    claim.linkedin,
    claim.twitter,
  );
  const businessNameSignal = compareSignalValues(
    "Business name match",
    "business_name_match",
    row.businessName,
    firstMeaningfulString(
      claimIntake?.business?.businessName?.claimantProvidedValue,
      claim.businessName,
      membership.membershipName,
    ),
    [
      "business.business_name",
      "ownership_reviews.claimIntake.business.businessName",
      "claim.businessName",
      "membership.membershipName",
    ],
    (value) => normalizeComparisonText(value) || null,
  );
  const addressSignal = compareSignalValues(
    "Address match",
    "address_match",
    firstMeaningfulString(
      businessAddress,
      [business.city, business.state, business.zip]
        .filter(Boolean)
        .join(" ")
        .trim(),
    ),
    firstMeaningfulString(
      claimAddress,
      [claimCity, claimState, claimPostalCode].filter(Boolean).join(" ").trim(),
    ),
    [
      "business.address",
      "business.city",
      "business.state",
      "ownership_reviews.claimIntake.business.addressLine1",
      "ownership_reviews.claimIntake.business.city",
      "ownership_reviews.claimIntake.business.state",
      "ownership_reviews.claimIntake.business.postalCode",
      "claim.businessAddress",
    ],
    (value) => normalizeComparisonText(value) || null,
  );
  const phoneSignal = compareSignalValues(
    "Listed phone match",
    "phone_match",
    businessPhone,
    claimantPhone,
    ["business.phone", "claim.phone", "membership.phone", "user.phone"],
    normalizePhone,
  );
  const websiteSignal = compareSignalValues(
    "Website / domain match",
    "website_domain_match",
    businessWebsite,
    claimWebsite,
    ["business.website", "claim.website", "membership.website"],
    normalizeHostname,
  );
  const businessEmailDomainSignal = compareSignalValues(
    "Business email / domain match",
    "business_email_domain_match",
    businessEmail || businessWebsite,
    claimantEmail || claimWebsite,
    ["business.email", "business.website", "claim.email", "membership.email"],
    (value) => extractEmailDomain(value) || normalizeHostname(value),
  );
  const socialSignal = compareSignalValues(
    "Social profile consistency",
    "social_profile_consistency",
    businessSocial,
    claimSocial,
    ["business.social", "claim.social"],
    normalizeHostname,
  );
  const businessListingSignal = buildSignal({
    key: "existing_bwe_listing_history",
    label: "Existing BWE listing history",
    status: row.business ? "pass" : "fail",
    summary: row.business
      ? "A current BWE business listing exists for this claim."
      : "No current BWE business listing was joined to the claim.",
    dataUsed: ["businesses.foundingMembershipId", "membership.businessId"],
  });
  const publicRegistrationSignal = buildSignal({
    key: "public_business_registration_verification",
    label: "Public business-registration verification",
    status: "unknown",
    summary:
      "Current BWE records do not include a live state/jurisdiction registration lookup.",
    dataUsed: ["businesses.*", "claims.*"],
    implementedWithExistingData: false,
    requiresFutureExternalData: true,
  });
  const duplicateListingSignal = buildSignal({
    key: "duplicate_business_listing_detection",
    label: "Duplicate business/listing detection",
    status:
      row.normalCheck?.consistency === "missing_linked_record"
        ? "fail"
        : "pass",
    summary:
      row.normalCheck?.consistency === "missing_linked_record"
        ? "Current BWE joins indicate a missing linked record that needs review."
        : "No duplicate/missing-link listing conflict was detected in current BWE joins.",
    dataUsed: [
      "normalCheck.consistency",
      "membership.businessId",
      "businesses",
    ],
  });
  const addressSignalRequired = hasComparableValue(
    businessAddress,
    claimAddress,
  );
  const websiteSignalRequired = hasComparableValue(
    businessWebsite,
    claimWebsite,
  );
  const phoneSignalRequired = hasComparableValue(businessPhone, claimantPhone);
  const claimantDomainSignalRequired = hasComparableValue(
    claimantEmail,
    businessEmail,
    businessWebsite,
  );

  const businessIdentityGroup = buildGroup(
    "business_identity",
    "Business identity / legitimacy",
    [
      businessListingSignal,
      businessNameSignal,
      addressSignal,
      phoneSignal,
      websiteSignal,
      businessEmailDomainSignal,
      socialSignal,
      publicRegistrationSignal,
      duplicateListingSignal,
    ],
  );

  const claimantIdentitySignal = buildSignal({
    key: "authenticated_account_identity",
    label: "Authenticated account identity",
    status: row.userId && row.user ? "pass" : "fail",
    summary:
      row.userId && row.user
        ? "A claimant account record is linked to this membership."
        : "The claim is missing a joined authenticated claimant account.",
    dataUsed: ["membership.userId", "users.foundingMembershipId"],
  });
  const claimantEmailValues = uniqueNormalizedValues(
    claimantEmails,
    (value) =>
      String(value || "")
        .trim()
        .toLowerCase() || null,
  );
  const claimantContactSignal = buildSignal({
    key: "claimant_contact_consistency",
    label: "Claimant contact consistency",
    status:
      claimantEmailValues.length === 0
        ? "unknown"
        : claimantEmailValues.length === 1
          ? "pass"
          : "fail",
    summary:
      claimantEmailValues.length === 0
        ? "Current BWE records do not yet contain claimant contact details from multiple sources."
        : claimantEmailValues.length === 1
          ? "Claim, membership, and user claimant contact values are consistent."
          : "Claim, membership, and user claimant contact values disagree.",
    dataUsed: ["claim.email", "membership.email", "user.email"],
  });
  const claimantDomainSignal = compareSignalValues(
    "Claimant email / business-domain relationship",
    "claimant_domain_relationship",
    claimantEmail,
    businessEmail || businessWebsite,
    ["claimantEmail", "business.email", "business.website"],
    (value) => extractEmailDomain(value) || normalizeHostname(value),
  );
  const claimantRelationship =
    (stringOrNull(
      claimIntake?.claimant?.relationshipToBusiness,
    ) as FoundingClaimRelationship | null) || null;
  const structuredEvidence = evidenceSubmissions as Array<Record<string, any>>;
  const representativeAuthorityEvidence = structuredEvidence.filter((item) => {
    const purpose = String(item?.purpose || "")
      .trim()
      .toLowerCase();
    return (
      purpose === "representative_authority" ||
      String(item?.evidenceType || item?.type || "")
        .trim()
        .toLowerCase() === "written_owner_or_officer_authorization"
    );
  });
  const ownershipControlEvidence = structuredEvidence.filter((item) => {
    const purpose = String(item?.purpose || "")
      .trim()
      .toLowerCase();
    return purpose === "ownership_control" || !purpose;
  });
  const authorityEvidenceSignal = buildSignal({
    key: "representative_authority_evidence",
    label: "Representative authority evidence",
    status:
      claimantRelationship === "AUTHORIZED_REPRESENTATIVE"
        ? representativeAuthorityEvidence.length
          ? "pass"
          : "fail"
        : claimantRelationship === "OWNER" || claimantRelationship === "OFFICER"
          ? ownershipControlEvidence.length
            ? "pass"
            : "fail"
          : evidenceSubmissions.length
            ? "pass"
            : "fail",
    summary:
      claimantRelationship === "AUTHORIZED_REPRESENTATIVE"
        ? representativeAuthorityEvidence.length
          ? "Representative-authority evidence was submitted."
          : "The claimant selected authorized representative, but no representative-authority evidence was submitted."
        : claimantRelationship === "OWNER" || claimantRelationship === "OFFICER"
          ? ownershipControlEvidence.length
            ? "Ownership/control evidence was submitted for the declared relationship."
            : "The claimant declared owner/officer status, but ownership/control evidence is missing."
          : evidenceSubmissions.length
            ? "Authority/ownership evidence was submitted and can be reviewed."
            : "No submitted authority evidence is attached to the current review record.",
    dataUsed: [
      "ownership_reviews.claimIntake.claimant.relationshipToBusiness",
      "ownership_reviews.structuredEvidenceSubmissions",
      "ownership_reviews.evidenceSubmissions",
      "ownership_reviews.evidenceStatus",
    ],
  });
  const claimantHistorySignal = buildSignal({
    key: "existing_verified_representative_history",
    label: "Existing verified representative history",
    status:
      row.queueState === "ownership_verified" &&
      row.claimedByUserId &&
      row.claimedByUserId === row.userId
        ? "pass"
        : "unknown",
    summary:
      row.queueState === "ownership_verified" &&
      row.claimedByUserId &&
      row.claimedByUserId === row.userId
        ? "The same claimant already appears in verified ownership history."
        : "Current BWE history does not establish verified representative history automatically.",
    dataUsed: ["businesses.claimedByUserId", "users._id", "auditHistory"],
  });
  const conflictingClaimantSignal = buildSignal({
    key: "conflicting_claimant_detection",
    label: "Conflicting claimant detection",
    status:
      row.normalCheck?.issues?.includes("conflicting_claimant") === true
        ? "fail"
        : "pass",
    summary:
      row.normalCheck?.issues?.includes("conflicting_claimant") === true
        ? "A different claimant is already linked to this business state."
        : "No direct conflicting claimant mismatch was detected.",
    dataUsed: [
      "businesses.claimedByUserId",
      "membership.userId",
      "normalCheck.issues",
    ],
  });
  const conflictingOwnerSignal = buildSignal({
    key: "conflicting_verified_owner_detection",
    label: "Conflicting verified-owner detection",
    status:
      row.ownerUserIds.some((ownerId) => ownerId && ownerId !== row.userId) ||
      (row.claimedByUserId != null && row.claimedByUserId !== row.userId)
        ? "fail"
        : "pass",
    summary:
      row.ownerUserIds.some((ownerId) => ownerId && ownerId !== row.userId) ||
      (row.claimedByUserId != null && row.claimedByUserId !== row.userId)
        ? "A different verified or claimed owner is already present."
        : "No conflicting verified owner was detected in current BWE ownership fields.",
    dataUsed: [
      "businesses.ownerUserIds",
      "businesses.claimedByUserId",
      "membership.userId",
    ],
  });
  const competingClaimantsSignal = buildSignal({
    key: "competing_claimants_detected",
    label: "Competing claimant detection",
    status: row.competingClaimantCount > 1 ? "fail" : "pass",
    summary:
      row.competingClaimantCount > 1
        ? `${row.competingClaimantCount} claimant records are linked to the same business identity.`
        : "No competing claimant set was detected in current BWE claim records.",
    dataUsed: [
      "business_claims.businessId",
      "business_claims.userId",
      "business_memberships.businessId",
      "business_memberships.userId",
    ],
  });

  const claimantAuthorizationGroup = buildGroup(
    "claimant_authorization",
    "Claimant authorization",
    [
      claimantIdentitySignal,
      claimantContactSignal,
      claimantDomainSignal,
      authorityEvidenceSignal,
      claimantHistorySignal,
      conflictingClaimantSignal,
      conflictingOwnerSignal,
      competingClaimantsSignal,
    ],
  );

  const evidenceExistsSignal = buildSignal({
    key: "submitted_ownership_control_evidence",
    label: "Submitted ownership/control evidence",
    status: ownershipControlEvidence.length ? "pass" : "fail",
    summary: ownershipControlEvidence.length
      ? `${ownershipControlEvidence.length} ownership/control evidence submission(s) are attached to the review record.`
      : "No ownership/control evidence has been submitted yet.",
    dataUsed: [
      "ownership_reviews.structuredEvidenceSubmissions",
      "ownership_reviews.evidenceSubmissions",
    ],
  });
  const evidenceValidationSignal = buildSignal({
    key: "evidence_validation_boundary",
    label: "Evidence validation boundary",
    status:
      String(review?.evidenceValidationStatus || "").trim() === "auto_validated"
        ? "pass"
        : evidenceSubmissions.length
          ? "unknown"
          : "fail",
    summary:
      String(review?.evidenceValidationStatus || "").trim() === "auto_validated"
        ? "Evidence was marked auto-validatable by the policy contract."
        : evidenceSubmissions.length
          ? "BWE can confirm evidence presence and basic linkage, but not document-content validity automatically."
          : "Evidence content cannot be validated because required submissions are missing.",
    dataUsed: [
      "ownership_reviews.evidenceSubmissions",
      "ownership_reviews.evidenceStatus",
    ],
  });
  const verifiedOwnershipSignal = buildSignal({
    key: "current_verified_ownership_records",
    label: "Current verified ownership records",
    status:
      row.queueState === "ownership_verified" &&
      row.claimedByUserId === row.userId
        ? "pass"
        : conflictingOwnerSignal.status === "fail"
          ? "fail"
          : "unknown",
    summary:
      row.queueState === "ownership_verified" &&
      row.claimedByUserId === row.userId
        ? "Current BWE records already show this claimant as the verified owner."
        : conflictingOwnerSignal.status === "fail"
          ? "A different verified owner record blocks automatic ownership activation."
          : "Current BWE ownership records require verification review before activation.",
    dataUsed: [
      "businesses.claimedByUserId",
      "businesses.ownerUserIds",
      "queueState",
    ],
  });
  const previousVerificationSignal = buildSignal({
    key: "previous_bwe_verification_history",
    label: "Previous BWE verification history",
    status:
      row.queueState === "ownership_verified" ||
      countAuditActions(auditHistory, "verify") > 0
        ? "pass"
        : "unknown",
    summary:
      row.queueState === "ownership_verified" ||
      countAuditActions(auditHistory, "verify") > 0
        ? "Verification history exists in the audit trail."
        : "No prior verified-ownership history is established for automatic reuse.",
    dataUsed: ["auditHistory", "queueState"],
  });
  const disputeStateSignal = buildSignal({
    key: "conflict_or_dispute_state",
    label: "Conflict / dispute state",
    status:
      row.queueState === "disputed"
        ? "fail"
        : row.queueState === "ownership_verification_failed"
          ? "fail"
          : "pass",
    summary:
      row.queueState === "disputed"
        ? "This claim is currently disputed."
        : row.queueState === "ownership_verification_failed"
          ? "This claim already carries a verification-failed state."
          : "No current dispute or failure state blocks ordinary verification flow.",
    dataUsed: ["queueState", "claimStatus", "ownershipReviewStatus"],
  });
  const historicalDisputeOrRevocationSignal = buildSignal({
    key: "historical_dispute_or_revocation",
    label: "Historical dispute / revocation state",
    status:
      countAuditActions(auditHistory, "mark_disputed") > 0 ||
      countAuditActions(auditHistory, "verification_failed") > 0 ||
      Boolean((review as any)?.revokedAt) ||
      Boolean((claim as any)?.revokedAt) ||
      Boolean((business as any)?.revokedAt) ||
      String((review as any)?.disputeState || "").trim().length > 0 ||
      String((claim as any)?.disputeState || "").trim().length > 0
        ? "fail"
        : "pass",
    summary:
      countAuditActions(auditHistory, "mark_disputed") > 0 ||
      countAuditActions(auditHistory, "verification_failed") > 0 ||
      Boolean((review as any)?.revokedAt) ||
      Boolean((claim as any)?.revokedAt) ||
      Boolean((business as any)?.revokedAt) ||
      String((review as any)?.disputeState || "").trim().length > 0 ||
      String((claim as any)?.disputeState || "").trim().length > 0
        ? "A prior dispute, revocation, or verification failure exists and blocks dry-run auto-verify."
        : "No prior dispute or revocation history was detected in current BWE records.",
    dataUsed: [
      "auditHistory",
      "ownership_reviews.revokedAt",
      "business_claims.revokedAt",
      "businesses.revokedAt",
      "ownership_reviews.disputeState",
      "business_claims.disputeState",
    ],
  });

  const ownershipControlGroup = buildGroup(
    "ownership_control",
    "Ownership / control",
    [
      evidenceExistsSignal,
      evidenceValidationSignal,
      verifiedOwnershipSignal,
      previousVerificationSignal,
      disputeStateSignal,
      historicalDisputeOrRevocationSignal,
    ],
  );

  const materialMismatchSignal = buildSignal({
    key: "material_business_data_disagreement",
    label: "Material business-data disagreement",
    status: [
      businessNameSignal,
      addressSignal,
      phoneSignal,
      websiteSignal,
    ].some((signal) => signal.status === "fail")
      ? "fail"
      : "pass",
    summary: [
      businessNameSignal,
      addressSignal,
      phoneSignal,
      websiteSignal,
    ].some((signal) => signal.status === "fail")
      ? "At least one identity signal materially disagrees."
      : "No material disagreement was detected in the compared identity signals.",
    dataUsed: [
      "business.business_name",
      "claim.businessName",
      "business.address",
      "claim.businessAddress",
      "business.phone",
      "claim.phone",
      "business.website",
      "claim.website",
    ],
  });
  const evidenceMissingSignal = buildSignal({
    key: "evidence_missing",
    label: "Evidence missing",
    status: evidenceSubmissions.length ? "pass" : "fail",
    summary: evidenceSubmissions.length
      ? "At least one evidence submission is present."
      : "Required ownership/control evidence is missing.",
    dataUsed: ["ownership_reviews.evidenceSubmissions"],
  });
  const evidenceInconsistentSignal = buildSignal({
    key: "evidence_inconsistent",
    label: "Evidence inconsistent",
    status:
      claimantDomainSignal.status === "fail" ||
      materialMismatchSignal.status === "fail"
        ? "fail"
        : evidenceSubmissions.length
          ? "unknown"
          : "pass",
    summary:
      claimantDomainSignal.status === "fail" ||
      materialMismatchSignal.status === "fail"
        ? "Submitted claim details conflict with current business/contact signals."
        : evidenceSubmissions.length
          ? "Evidence exists, but document content is not auto-validated yet."
          : "No conflicting evidence pattern is detectable because no evidence is present.",
    dataUsed: [
      "ownership_reviews.evidenceSubmissions",
      "business/contact comparisons",
    ],
  });
  const stateTransitionSignal = buildSignal({
    key: "suspicious_state_transitions",
    label: "Suspicious state transitions",
    status:
      countAuditActions(auditHistory, "reopen_verification") > 0 &&
      countAuditActions(auditHistory, "verify") > 0
        ? "fail"
        : "pass",
    summary:
      countAuditActions(auditHistory, "reopen_verification") > 0 &&
      countAuditActions(auditHistory, "verify") > 0
        ? "Verification was reopened after prior verification and needs admin review."
        : "No suspicious reopen-after-verify transition was detected in the audit trail.",
    dataUsed: ["auditHistory"],
  });
  const repeatedFailureSignal = buildSignal({
    key: "repeated_failed_verification_attempts",
    label: "Repeated failed verification attempts",
    status:
      countAuditActions(auditHistory, "verification_failed") > 0 ||
      row.queueState === "ownership_verification_failed"
        ? "fail"
        : "pass",
    summary:
      countAuditActions(auditHistory, "verification_failed") > 0 ||
      row.queueState === "ownership_verification_failed"
        ? "A prior verification failure exists and should stay in admin review."
        : "No prior verification-failed history was detected.",
    dataUsed: ["auditHistory", "queueState"],
  });
  const conflictingRecordsSignal = buildSignal({
    key: "conflicting_bwe_records",
    label: "Conflicting BWE records",
    status: normalCheck?.verdict === "exception_admin_review" ? "fail" : "pass",
    summary:
      normalCheck?.verdict === "exception_admin_review"
        ? "The DA-12 normal check already detected a record-level exception."
        : "The DA-12 normal check did not detect a record-level exception.",
    dataUsed: ["normalCheck.verdict", "normalCheck.issues"],
  });

  const riskExceptionGroup = buildGroup("risk_exception", "Risk / exception", [
    conflictingOwnerSignal,
    conflictingClaimantSignal,
    competingClaimantsSignal,
    materialMismatchSignal,
    evidenceMissingSignal,
    evidenceInconsistentSignal,
    stateTransitionSignal,
    repeatedFailureSignal,
    historicalDisputeOrRevocationSignal,
    conflictingRecordsSignal,
  ]);

  const blackOwnedPolicySignal = buildSignal({
    key: "black_owned_status_policy_boundary",
    label: "Black-owned status policy boundary",
    status: "pass",
    summary:
      "BWE must rely on attestation, permitted supporting documentation, or recognized certification sources instead of proxy inference.",
    dataUsed: ["policy.da13.black_owned_status"],
    blocksAutoVerify: false,
    requiresAdminReview: false,
  });
  const blackOwnedEvidenceSignal = buildSignal({
    key: "black_owned_status_evidence",
    label: "Black-owned status evidence",
    status: "unknown",
    summary:
      "Current BWE records do not auto-verify Black-owned status from proxies or document-content inference.",
    dataUsed: ["ownership_reviews.evidenceSubmissions", "businesses.*"],
    blocksAutoVerify: false,
  });
  const blackOwnedAutomationSignal = buildSignal({
    key: "black_owned_status_automation",
    label: "Black-owned status automation",
    status: "unknown",
    summary:
      "DA-13 defines the policy boundary only; automated Black-owned-status verification is not implemented in this phase.",
    dataUsed: ["policy.da13.black_owned_status"],
    implementedWithExistingData: false,
    requiresFutureExternalData: true,
    blocksAutoVerify: false,
  });
  const blackOwnedStatusGroup = buildGroup(
    "black_owned_status",
    "Black-owned status",
    [
      blackOwnedPolicySignal,
      blackOwnedEvidenceSignal,
      blackOwnedAutomationSignal,
    ],
  );

  const paymentConsistencySignal = buildSignal({
    key: "payment_entitlement_integrity",
    label: "Payment / entitlement integrity",
    status:
      row.paymentStatus === "paid" && row.payment != null ? "pass" : "fail",
    summary:
      row.paymentStatus === "paid" && row.payment != null
        ? "Payment linkage is internally consistent."
        : "Payment linkage is incomplete or inconsistent.",
    dataUsed: ["payments", "membership.paymentStatus", "normalCheck.issues"],
    blocksAutoVerify: false,
  });
  const paymentNotOwnershipSignal = buildSignal({
    key: "payment_not_ownership_evidence",
    label: "Payment is not ownership evidence",
    status: "pass",
    summary:
      "Payment integrity is tracked separately and cannot by itself verify ownership or representative authority.",
    dataUsed: ["policy.da13.payment_boundary"],
    blocksAutoVerify: false,
    requiresAdminReview: false,
  });
  const paymentIntegrityGroup = buildGroup(
    "payment_integrity",
    "Payment / entitlement integrity",
    [paymentConsistencySignal, paymentNotOwnershipSignal],
  );

  const groups = [
    businessIdentityGroup,
    claimantAuthorizationGroup,
    ownershipControlGroup,
    riskExceptionGroup,
    blackOwnedStatusGroup,
    paymentIntegrityGroup,
  ];
  const mandatoryFailures: string[] = [];
  const mandatoryUnknowns: string[] = [];
  const blackOwnedStatusLabel: "VERIFIED" | "UNVERIFIED" | "NOT_ESTABLISHED" =
    "NOT_ESTABLISHED";
  const requiresEvidence = evidenceExistsSignal.status === "fail";
  const ownerConflict =
    conflictingOwnerSignal.status === "fail" ||
    conflictingClaimantSignal.status === "fail";
  const disputed =
    row.queueState === "disputed" || competingClaimantsSignal.status === "fail";
  const failedVerification =
    row.queueState === "ownership_verification_failed" ||
    repeatedFailureSignal.status === "fail";
  const materialConflict =
    materialMismatchSignal.status === "fail" ||
    conflictingRecordsSignal.status === "fail" ||
    stateTransitionSignal.status === "fail" ||
    historicalDisputeOrRevocationSignal.status === "fail";
  const mandatoryConditions = [
    buildMandatoryCondition({
      key: "business_listing_history",
      label: "Existing BWE business identity/history",
      status: businessListingSignal.status,
      reason: businessListingSignal.summary,
    }),
    buildMandatoryCondition({
      key: "business_name_match",
      label: "Business name consistency",
      status: businessNameSignal.status,
      reason: businessNameSignal.summary,
    }),
    buildMandatoryCondition({
      key: "address_match_if_available",
      label: "Address consistency where available",
      status: addressSignalRequired ? addressSignal.status : "not_applicable",
      reason: addressSignalRequired
        ? addressSignal.summary
        : "Address comparison is not required because current BWE records do not provide both sides.",
    }),
    buildMandatoryCondition({
      key: "website_domain_match_if_available",
      label: "Website/domain consistency where available",
      status: websiteSignalRequired ? websiteSignal.status : "not_applicable",
      reason: websiteSignalRequired
        ? websiteSignal.summary
        : "Website/domain comparison is not required because current BWE records do not provide both sides.",
    }),
    buildMandatoryCondition({
      key: "phone_match_if_available",
      label: "Phone/contact consistency where available",
      status: phoneSignalRequired ? phoneSignal.status : "not_applicable",
      reason: phoneSignalRequired
        ? phoneSignal.summary
        : "Phone comparison is not required because current BWE records do not provide both sides.",
    }),
    buildMandatoryCondition({
      key: "authenticated_claimant",
      label: "Authenticated claimant",
      status: claimantIdentitySignal.status,
      reason: claimantIdentitySignal.summary,
    }),
    buildMandatoryCondition({
      key: "claimant_account_linkage",
      label: "Claimant/account linkage",
      status: claimantContactSignal.status,
      reason: claimantContactSignal.summary,
    }),
    buildMandatoryCondition({
      key: "claimant_domain_relationship_if_available",
      label: "Business-contact/domain relationship where available",
      status: claimantDomainSignalRequired
        ? claimantDomainSignal.status
        : "not_applicable",
      reason: claimantDomainSignalRequired
        ? claimantDomainSignal.summary
        : "Domain relationship is not required because current BWE records do not provide both sides.",
    }),
    buildMandatoryCondition({
      key: "representative_authority_evidence",
      label: "Submitted authority evidence where required",
      status: authorityEvidenceSignal.status,
      reason: authorityEvidenceSignal.summary,
    }),
    buildMandatoryCondition({
      key: "required_evidence_present",
      label: "Required ownership/control evidence present",
      status: evidenceExistsSignal.status,
      reason: evidenceExistsSignal.summary,
    }),
    buildMandatoryCondition({
      key: "evidence_validation_boundary",
      label: "Evidence validation boundary",
      status: evidenceValidationSignal.status,
      reason: evidenceValidationSignal.summary,
    }),
    buildMandatoryCondition({
      key: "no_conflicting_verified_owner",
      label: "No conflicting verified owner",
      status: conflictingOwnerSignal.status === "pass" ? "pass" : "fail",
      reason: conflictingOwnerSignal.summary,
    }),
    buildMandatoryCondition({
      key: "no_competing_claimant",
      label: "No competing claimant",
      status:
        conflictingClaimantSignal.status === "fail" ||
        competingClaimantsSignal.status === "fail"
          ? "fail"
          : "pass",
      reason:
        competingClaimantsSignal.status === "fail"
          ? competingClaimantsSignal.summary
          : conflictingClaimantSignal.summary,
    }),
    buildMandatoryCondition({
      key: "no_disputed_or_revoked_state",
      label: "No disputed/revoked state",
      status:
        disputeStateSignal.status === "fail" ||
        historicalDisputeOrRevocationSignal.status === "fail"
          ? "fail"
          : "pass",
      reason:
        historicalDisputeOrRevocationSignal.status === "fail"
          ? historicalDisputeOrRevocationSignal.summary
          : disputeStateSignal.summary,
    }),
    buildMandatoryCondition({
      key: "no_material_identity_mismatch",
      label: "No material identity mismatch",
      status: materialMismatchSignal.status,
      reason: materialMismatchSignal.summary,
    }),
    buildMandatoryCondition({
      key: "no_conflicting_business_records",
      label: "No conflicting business records",
      status: conflictingRecordsSignal.status,
      reason: conflictingRecordsSignal.summary,
    }),
    buildMandatoryCondition({
      key: "no_suspicious_state_contradiction",
      label: "No suspicious state contradiction",
      status: stateTransitionSignal.status,
      reason: stateTransitionSignal.summary,
    }),
  ];

  for (const condition of mandatoryConditions) {
    if (condition.status === "fail") {
      mandatoryFailures.push(condition.label);
    } else if (condition.status === "unknown") {
      mandatoryUnknowns.push(condition.label);
    }
  }

  let disposition: FoundingVerificationDisposition = "ADMIN_REVIEW_REQUIRED";
  if (disputed) {
    disposition = "DISPUTED";
  } else if (ownerConflict) {
    disposition = "CONFLICT_BLOCKED";
  } else if (requiresEvidence) {
    disposition = "MORE_EVIDENCE_REQUIRED";
  } else if (failedVerification) {
    disposition = "VERIFICATION_FAILED";
  } else if (
    mandatoryFailures.length === 0 &&
    mandatoryUnknowns.length === 0 &&
    materialConflict === false &&
    evidenceValidationSignal.status === "pass"
  ) {
    disposition = "AUTO_VERIFY_ELIGIBLE";
  }

  const rationale = [
    "DA-13 separates payment/entitlement integrity from Claim Verification and Ownership Verification.",
    "Current BWE data can compare internal record consistency, claimant linkage, and basic contact/domain signals.",
    "Current BWE data cannot automatically validate document contents, public registration records, or Black-owned-status evidence.",
  ];
  if (disposition !== "AUTO_VERIFY_ELIGIBLE") {
    rationale.push(
      "This case stays out of auto-verify because at least one mandatory signal is failing, unresolved, or still requires administrator evidence review.",
    );
  }

  return {
    policyVersion: "da13-v1",
    disposition,
    autoVerifyEligible: disposition === "AUTO_VERIFY_ELIGIBLE",
    adminReviewRequired: disposition !== "AUTO_VERIFY_ELIGIBLE",
    ownershipAutomationPermitted: false,
    paymentIntegritySeparateFromOwnership: true,
    blackOwnedStatusAutomationImplemented: false,
    blackOwnedStatusLabel,
    automationBoundary:
      "Current BWE automation can classify ordinary versus exception claim-verification work from existing internal records, but document-content validation, public registration checks, and Black-owned-status evidence remain outside automatic ownership activation.",
    rationale,
    mandatoryFailures,
    mandatoryUnknowns,
    mandatoryConditions,
    groups,
  };
}

export function getFoundingVerificationDecisionCounts(
  rows: Array<
    FoundingCanonicalRecord & {
      verificationDecision?: FoundingVerificationDecision | null;
    }
  >,
): FoundingVerificationDecisionCounts {
  return {
    AUTO_VERIFY_ELIGIBLE: rows.filter(
      (row) => row.verificationDecision?.disposition === "AUTO_VERIFY_ELIGIBLE",
    ).length,
    ADMIN_REVIEW_REQUIRED: rows.filter(
      (row) =>
        row.verificationDecision?.disposition === "ADMIN_REVIEW_REQUIRED",
    ).length,
    MORE_EVIDENCE_REQUIRED: rows.filter(
      (row) =>
        row.verificationDecision?.disposition === "MORE_EVIDENCE_REQUIRED",
    ).length,
    CONFLICT_BLOCKED: rows.filter(
      (row) => row.verificationDecision?.disposition === "CONFLICT_BLOCKED",
    ).length,
    DISPUTED: rows.filter(
      (row) => row.verificationDecision?.disposition === "DISPUTED",
    ).length,
    VERIFICATION_FAILED: rows.filter(
      (row) => row.verificationDecision?.disposition === "VERIFICATION_FAILED",
    ).length,
  };
}

export function deriveFoundingQueueState(args: {
  membershipStatus?: unknown;
  claimStatus?: unknown;
  ownershipReviewStatus?: unknown;
  claimStage?: unknown;
  publicListingStatus?: unknown;
}): FoundingQueueState | null {
  const membershipStatus = String(args.membershipStatus || "")
    .trim()
    .toLowerCase();
  const statuses = [
    normalizeFoundingClaimStage(args.ownershipReviewStatus),
    normalizeFoundingClaimStage(args.claimStatus),
    normalizeFoundingClaimStage(args.claimStage),
    normalizeFoundingClaimStage(args.publicListingStatus),
  ].filter(Boolean) as string[];

  if (
    !membershipStatus ||
    !["active", "past_due", "cancelled"].includes(membershipStatus)
  ) {
    return null;
  }

  if (statuses.includes("ownership_verified")) return "ownership_verified";
  if (statuses.includes("ownership_verification_failed"))
    return "ownership_verification_failed";
  if (statuses.includes("disputed")) return "disputed";
  if (statuses.includes("additional_evidence_required"))
    return "additional_evidence_required";
  if (statuses.includes("ownership_verification_pending"))
    return "ownership_verification_pending";
  if (statuses.includes("claim_initiated"))
    return "ownership_verification_pending";
  return null;
}

export function collectFoundingConsistencyIssues(
  row: FoundingCanonicalRecord,
): FoundingNormalCheckIssue[] {
  const issues: FoundingNormalCheckIssue[] = [];
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
  if (!row.payment || row.paymentStatus !== "paid")
    issues.push("payment_inconsistency");
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

  return issues;
}

export function classifyFoundingConsistency(
  row: FoundingCanonicalRecord,
): FoundingConsistencyClassification {
  const issues = collectFoundingConsistencyIssues(row);

  if (!issues.length && row.queueState === "ownership_verified")
    return "consistent_verified";
  if (
    !issues.length &&
    FOUNDING_QUEUE_PENDING_STATES.includes(row.queueState as any)
  ) {
    return "consistent_pending_verification";
  }
  if (issues.includes("conflicting_claimant")) return "conflicting_claimant";
  if (issues.includes("payment_inconsistency")) return "payment_inconsistency";
  if (
    issues.includes("conflicting_state") ||
    issues.includes("cross_business_management_access")
  ) {
    return "conflicting_state";
  }
  if (issues.some((issue) => issue.startsWith("missing_")))
    return "missing_linked_record";
  return "legacy_status_requiring_normalization";
}

export function deriveFoundingNormalCheckResult(
  row: FoundingCanonicalRecord,
): FoundingNormalCheckResult {
  const issues = collectFoundingConsistencyIssues(row);
  const consistency = classifyFoundingConsistency(row);

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

export async function getFoundingClaimVerificationRecords(db: Db) {
  const [
    memberships,
    claims,
    reviews,
    fulfillment,
    onboarding,
    businesses,
    users,
  ] = await Promise.all([
    db
      .collection("business_memberships")
      .find({ productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray(),
    db
      .collection("business_claims")
      .find({ productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray(),
    db
      .collection("ownership_reviews")
      .find({
        sourceMembershipId: {
          $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:`,
        },
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray(),
    db
      .collection("membership_fulfillment")
      .find({
        membershipId: { $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:` },
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray(),
    db
      .collection("membership_onboarding")
      .find({
        membershipId: { $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:` },
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray(),
    db
      .collection("businesses")
      .find({
        $or: [
          {
            foundingMembershipId: {
              $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:`,
            },
          },
          {
            claimStage: {
              $in: [
                ...FOUNDING_QUEUE_PENDING_STATES,
                ...FOUNDING_QUEUE_HISTORY_STATES,
              ],
            },
          },
          {
            ownershipReviewStatus: {
              $in: [
                ...FOUNDING_QUEUE_PENDING_STATES,
                ...FOUNDING_QUEUE_HISTORY_STATES,
              ],
            },
          },
        ],
      })
      .toArray(),
    db
      .collection("users")
      .find({
        foundingMembershipId: {
          $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:`,
        },
      })
      .toArray(),
  ]);

  const membershipById = new Map(
    memberships
      .filter((item) => item?.membershipId)
      .map((item) => [String(item.membershipId), item]),
  );
  const claimByMembershipId = new Map(
    claims
      .filter((item) => item?.membershipId)
      .map((item) => [String(item.membershipId), item]),
  );
  const reviewByMembershipId = new Map(
    reviews
      .filter((item) => item?.sourceMembershipId)
      .map((item) => [String(item.sourceMembershipId), item]),
  );
  const fulfillmentByMembershipId = new Map(
    fulfillment
      .filter((item) => item?.membershipId)
      .map((item) => [String(item.membershipId), item]),
  );
  const onboardingByMembershipId = new Map(
    onboarding
      .filter((item) => item?.membershipId)
      .map((item) => [String(item.membershipId), item]),
  );
  const businessByMembershipId = new Map(
    businesses
      .filter((item) => item?.foundingMembershipId)
      .map((item) => [String(item.foundingMembershipId), item]),
  );
  const userByMembershipId = new Map(
    users
      .filter((item) => item?.foundingMembershipId)
      .map((item) => [String(item.foundingMembershipId), item]),
  );

  const membershipIds = new Set<string>();
  for (const membership of memberships)
    membershipIds.add(String(membership.membershipId || ""));
  for (const claim of claims)
    if (claim?.membershipId) membershipIds.add(String(claim.membershipId));
  for (const review of reviews)
    if (review?.sourceMembershipId)
      membershipIds.add(String(review.sourceMembershipId));
  for (const business of businesses)
    if (business?.foundingMembershipId)
      membershipIds.add(String(business.foundingMembershipId));
  for (const user of users)
    if (user?.foundingMembershipId)
      membershipIds.add(String(user.foundingMembershipId));

  const rows: FoundingCanonicalRecord[] = [];
  for (const membershipId of membershipIds) {
    if (!membershipId) continue;
    const membership = membershipById.get(membershipId) || null;
    const claim = claimByMembershipId.get(membershipId) || null;
    const review = reviewByMembershipId.get(membershipId) || null;
    const fulfillmentRow = fulfillmentByMembershipId.get(membershipId) || null;
    const onboardingRow = onboardingByMembershipId.get(membershipId) || null;
    const business = businessByMembershipId.get(membershipId) || null;
    const user = userByMembershipId.get(membershipId) || null;
    const sourcePayment = await findFoundingSourcePayment(
      db,
      membership || claim || review || user || business,
    );
    const paymentAmountCents = Number(
      sourcePayment?.amountCents ||
        sourcePayment?.grossAmountCents ||
        membership?.paymentAmountCents ||
        membership?.amountCents ||
        claim?.paymentAmountCents ||
        0,
    );
    const paymentDisplayAmount = formatUsdFromCents(paymentAmountCents);
    const queueState = deriveFoundingQueueState({
      membershipStatus: membership?.membershipStatus,
      claimStatus: claim?.claimStatus,
      ownershipReviewStatus:
        review?.reviewStatus ||
        claim?.ownershipReviewStatus ||
        membership?.ownershipReviewStatus ||
        business?.ownershipReviewStatus,
      claimStage: business?.claimStage,
      publicListingStatus: business?.publicListingStatus,
    });

    rows.push({
      membershipId,
      businessId:
        String(
          membership?.businessId ||
            claim?.businessId ||
            review?.businessId ||
            business?._id ||
            user?.claimedBusinessId ||
            "",
        ) || null,
      userId:
        String(
          membership?.userId ||
            claim?.userId ||
            review?.userId ||
            user?._id ||
            "",
        ) || null,
      email:
        String(
          membership?.email ||
            claim?.email ||
            review?.email ||
            user?.email ||
            business?.claimedByEmail ||
            "",
        ) || null,
      businessName:
        String(
          business?.business_name ||
            business?.name ||
            claim?.businessName ||
            membership?.membershipName ||
            "",
        ) || null,
      businessSlug: String(business?.alias || business?.slug || "") || null,
      claimId: claim?._id ? String(claim._id) : null,
      ownershipReviewId: review?._id ? String(review._id) : null,
      paymentId: sourcePayment?._id ? String(sourcePayment._id) : null,
      paymentStatus: normalizeFoundingPaymentStatus(
        sourcePayment || membership,
      ),
      paymentAmountCents,
      paymentDisplayAmount,
      paymentCurrency: String(
        sourcePayment?.currency ||
          membership?.paymentCurrency ||
          membership?.currency ||
          "usd",
      ).toLowerCase(),
      membershipStatus: membership?.membershipStatus || null,
      claimStatus: normalizeFoundingClaimStage(claim?.claimStatus || null),
      ownershipReviewStatus: normalizeFoundingClaimStage(
        review?.reviewStatus ||
          claim?.ownershipReviewStatus ||
          membership?.ownershipReviewStatus ||
          business?.ownershipReviewStatus ||
          null,
      ),
      claimStage: normalizeFoundingClaimStage(business?.claimStage || null),
      claimLocked:
        business?.claimLocked === true || claim?.claimLocked === true,
      managementAccessStatus:
        String(membership?.managementAccessStatus || "") || null,
      ownershipAccessStatus:
        String(fulfillmentRow?.ownershipAccessStatus || "") || null,
      publicListingStatus: String(business?.publicListingStatus || "") || null,
      fulfillmentStatus:
        String(fulfillmentRow?.fulfillmentStatus || "") || null,
      evidencePortalStatus:
        String(onboardingRow?.evidencePortalStatus || "") || null,
      evidenceStatus: String(review?.evidenceStatus || "") || null,
      onboardingStatus: String(onboardingRow?.onboardingStatus || "") || null,
      nextStep: String(onboardingRow?.nextStep || "") || null,
      claimedByUserId: String(business?.claimedByUserId || "") || null,
      managedByUserId: String(business?.managedByUserId || "") || null,
      ownerUserIds: Array.isArray(business?.ownerUserIds)
        ? business.ownerUserIds.map((id: any) => String(id))
        : [],
      competingClaimMembershipIds: [],
      competingClaimantUserIds: [],
      competingClaimantCount: 0,
      queueState,
      queueBucket: queueState
        ? FOUNDING_QUEUE_PENDING_STATES.includes(queueState as any)
          ? "pending"
          : "history"
        : null,
      createdAt:
        claim?.createdAt ||
        review?.createdAt ||
        membership?.createdAt ||
        business?.createdAt ||
        null,
      updatedAt:
        review?.updatedAt ||
        claim?.updatedAt ||
        membership?.updatedAt ||
        business?.updatedAt ||
        null,
      auditHistory: Array.isArray(review?.auditHistory)
        ? review.auditHistory
        : Array.isArray(claim?.auditHistory)
          ? claim.auditHistory
          : [],
      source: claim
        ? "claim_record"
        : review
          ? "membership_review_join"
          : "membership_only",
      membership,
      claim,
      review,
      business,
      onboarding: onboardingRow,
      fulfillment: fulfillmentRow,
      payment: sourcePayment,
      user,
    });

    const currentRow = rows[rows.length - 1];
    const normalCheck = deriveFoundingNormalCheckResult(currentRow);
    Object.assign(currentRow, { normalCheck });
    const verificationDecision = deriveFoundingVerificationDecision(currentRow);
    Object.assign(currentRow, { verificationDecision });
  }

  const competingClaimantsByBusinessId = new Map<
    string,
    { membershipIds: string[]; userIds: string[] }
  >();
  for (const row of rows) {
    const businessId = String(row.businessId || "").trim();
    if (!businessId) continue;
    const current = competingClaimantsByBusinessId.get(businessId) || {
      membershipIds: [],
      userIds: [],
    };
    if (row.membershipId && !current.membershipIds.includes(row.membershipId)) {
      current.membershipIds.push(row.membershipId);
    }
    if (row.userId && !current.userIds.includes(row.userId)) {
      current.userIds.push(row.userId);
    }
    competingClaimantsByBusinessId.set(businessId, current);
  }

  for (const row of rows) {
    const businessId = String(row.businessId || "").trim();
    if (!businessId) continue;
    const competing = competingClaimantsByBusinessId.get(businessId);
    if (!competing) continue;
    Object.assign(row, {
      competingClaimMembershipIds: competing.membershipIds.filter(
        (membershipId) => membershipId !== row.membershipId,
      ),
      competingClaimantUserIds: competing.userIds.filter(
        (userId) => userId !== row.userId,
      ),
      competingClaimantCount: competing.userIds.length,
    });
    const verificationDecision = deriveFoundingVerificationDecision(row);
    Object.assign(row, { verificationDecision });
  }

  rows.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime(),
  );
  return rows;
}

export async function getPendingFoundingClaimVerifications(db: Db) {
  const rows = await getFoundingClaimVerificationRecords(db);
  return rows.filter((row) => row.queueBucket === "pending");
}

export async function getFoundingClaimVerificationCounts(db: Db) {
  const rows = await getFoundingClaimVerificationRecords(db);
  return {
    pending: rows.filter(
      (row) => row.queueState === "ownership_verification_pending",
    ).length,
    additionalEvidenceRequired: rows.filter(
      (row) => row.queueState === "additional_evidence_required",
    ).length,
    disputed: rows.filter((row) => row.queueState === "disputed").length,
    verificationFailed: rows.filter(
      (row) => row.queueState === "ownership_verification_failed",
    ).length,
    verifiedHistory: rows.filter(
      (row) => row.queueState === "ownership_verified",
    ).length,
  };
}

export function getFoundingNormalCheckCounts(
  rows: Array<
    FoundingCanonicalRecord & { normalCheck?: FoundingNormalCheckResult | null }
  >,
): FoundingNormalCheckCounts {
  return {
    routineAdminReview: rows.filter(
      (row) => row.normalCheck?.verdict === "routine_admin_review",
    ).length,
    exceptionAdminReview: rows.filter(
      (row) => row.normalCheck?.verdict === "exception_admin_review",
    ).length,
  };
}

export async function getClaimablePublicBusinesses(db: Db, limit = 25) {
  const rows = await db
    .collection("businesses")
    .find(
      {
        $and: [
          {
            $or: [
              { status: "approved" },
              { status: "verified" },
              { status: "active" },
            ],
          },
          {
            $or: [
              { alias: { $exists: true, $type: "string", $ne: "" } },
              { slug: { $exists: true, $type: "string", $ne: "" } },
            ],
          },
          {
            $or: [
              { directoryVisibilityApproved: true },
              { isComplete: true },
              { completenessScore: { $gte: 70 } },
              { qualityScore: { $gte: 70 } },
            ],
          },
          {
            $nor: [
              { isTest: true },
              { auditTag: { $exists: true } },
              { email: /@local\.test$/i },
            ],
          },
        ],
      },
      {
        projection: {
          _id: 1,
          business_name: 1,
          name: 1,
          alias: 1,
          slug: 1,
          category: 1,
          categories: 1,
          display_categories: 1,
          city: 1,
          state: 1,
          address: 1,
          website: 1,
          phone: 1,
          description: 1,
          status: 1,
          claimStage: 1,
          trustStatus: 1,
          isVerified: 1,
          verified: 1,
        },
      },
    )
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return rows.map((row: any) => {
    const availability = getFoundingMembershipAvailability(row);

    return {
      id: String(row._id),
      businessName: String(row.business_name || row.name || "").trim(),
      slug: String(row.alias || row.slug || row._id),
      category: String(
        row.display_categories || row.category || row.categories || "",
      ).trim(),
      city: String(row.city || "").trim(),
      state: String(row.state || "").trim(),
      address: String(row.address || "").trim(),
      website: stringOrNull(row.website),
      phone: stringOrNull(row.phone),
      description: String(row.description || "").trim(),
      publicStatus: availability.publicStatus,
      claimable: availability.claimable,
      currentClaimState: availability.currentClaimState,
      unavailableReason: availability.unavailableReason,
    };
  });
}

export async function getClaimableBusinessById(
  db: Db,
  businessId: string,
): Promise<ClaimableBusinessSummary | null> {
  if (!businessId) return null;

  const row = await db.collection("businesses").findOne(
    {
      _id: ObjectId.isValid(businessId)
        ? new ObjectId(businessId)
        : (businessId as any),
    },
    {
      projection: {
        _id: 1,
        business_name: 1,
        name: 1,
        alias: 1,
        slug: 1,
        category: 1,
        categories: 1,
        display_categories: 1,
        city: 1,
        state: 1,
        address: 1,
        website: 1,
        phone: 1,
        description: 1,
        status: 1,
        directoryVisibilityApproved: 1,
        isComplete: 1,
        completenessScore: 1,
        qualityScore: 1,
        claimStage: 1,
        trustStatus: 1,
        isVerified: 1,
        verified: 1,
      },
    },
  );
  if (!row) return null;

  const status = String((row as any).status || (row as any).trustStatus || "")
    .trim()
    .toLowerCase();
  const availability = getFoundingMembershipAvailability(row as any);
  const publicish =
    status === "approved" || status === "verified" || status === "active";
  const claimableVisibility =
    Boolean((row as any).directoryVisibilityApproved) ||
    Boolean((row as any).isComplete) ||
    Number((row as any).completenessScore || 0) >= 70 ||
    Number((row as any).qualityScore || 0) >= 70;

  if (!publicish || !claimableVisibility || !availability.claimable) {
    return null;
  }

  return {
    id: String((row as any)._id),
    businessName: String(
      (row as any).business_name || (row as any).name || "",
    ).trim(),
    slug: String((row as any).alias || (row as any).slug || (row as any)._id),
    category: String(
      (row as any).display_categories ||
        (row as any).category ||
        (row as any).categories ||
        "",
    ).trim(),
    city: String((row as any).city || "").trim(),
    state: String((row as any).state || "").trim(),
    address: String((row as any).address || "").trim(),
    website: stringOrNull((row as any).website),
    phone: stringOrNull((row as any).phone),
    description: String((row as any).description || "").trim(),
  };
}
