import { ObjectId, type Db, type Document } from "mongodb";
import {
  normalizeFoundingClaimStage,
} from "./founding-membership-state";

export {
  normalizeFoundingClaimStage,
  resolveFoundingOwnershipState,
} from "./founding-membership-state";

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

  if (action === "request_additional_evidence") {
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
  const userId = String(membership?.userId || "").trim();
  const email = String(membership?.email || "")
    .trim()
    .toLowerCase();
  const queries: Document[] = [];

  const sourcePaymentQuery = sourcePaymentId
    ? buildMongoIdOrStringQuery("_id", sourcePaymentId)
    : null;
  if (sourcePaymentQuery) queries.push(sourcePaymentQuery);
  if (membershipId) queries.push({ membershipId });
  if (businessId) queries.push({ businessId });
  if (businessId) queries.push({ "metadata.businessId": businessId });
  if (userId) queries.push({ userId });
  if (userId) queries.push({ "metadata.userId": userId });
  if (email) queries.push({ email });
  if (email) queries.push({ customerEmail: email });
  if (email) queries.push({ userEmail: email });

  if (!queries.length) return null;

  const rows = await db
    .collection("payments")
    .find({ $or: queries })
    .sort({ paidAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(50)
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

  const exactBusinessPaid = businessId
    ? rows.find(
        (row) =>
          String(row?.businessId || row?.metadata?.businessId || "") ===
            businessId && normalizeFoundingPaymentStatus(row) === "paid",
      ) || null
    : null;
  if (exactBusinessPaid) return exactBusinessPaid;

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
};

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

export function classifyFoundingConsistency(row: FoundingCanonicalRecord) {
  const issues: string[] = [];
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
