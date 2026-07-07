import { ObjectId, type Db } from "mongodb";

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

export async function getPendingFoundingClaimVerifications(db: Db) {
  const [memberships, claims, reviews, businesses] = await Promise.all([
    db
      .collection("business_memberships")
      .find({ productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray(),
    db
      .collection("business_claims")
      .find({ productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray(),
    db
      .collection("ownership_reviews")
      .find({
        sourceMembershipId: {
          $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:`,
        },
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray(),
    db
      .collection("businesses")
      .find({
        foundingMembershipId: {
          $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:`,
        },
      })
      .project({
        business_name: 1,
        alias: 1,
        slug: 1,
        claimStage: 1,
        claimLocked: 1,
        claimedByUserId: 1,
        claimedByEmail: 1,
        foundingMembershipId: 1,
        ownershipReviewStatus: 1,
      })
      .limit(100)
      .toArray(),
  ]);

  const businessByMembershipId = new Map(
    businesses
      .filter((item) => item?.foundingMembershipId)
      .map((item) => [String(item.foundingMembershipId), item]),
  );
  const membershipById = new Map(
    memberships
      .filter((item) => item?.membershipId)
      .map((item) => [String(item.membershipId), item]),
  );
  const reviewByMembershipId = new Map(
    reviews
      .filter((item) => item?.sourceMembershipId)
      .map((item) => [String(item.sourceMembershipId), item]),
  );

  const normalizedClaimsByMembershipId = new Map<string, any>();

  for (const claim of claims) {
    const membership = membershipById.get(String(claim.membershipId || ""));
    const linkedBusiness =
      businessByMembershipId.get(String(claim.membershipId || "")) ||
      businessByMembershipId.get(String(membership?.membershipId || "")) ||
      null;
    const normalizedReviewStatus = normalizeFoundingClaimStage(
      claim.ownershipReviewStatus,
    );

    if (
      normalizedReviewStatus !== "ownership_verification_pending" &&
      normalizedReviewStatus !== "additional_evidence_required" &&
      normalizedReviewStatus !== "disputed"
    ) {
      continue;
    }

    normalizedClaimsByMembershipId.set(String(claim.membershipId || ""), {
      ...claim,
      claimStatus:
        normalizeFoundingClaimStage(claim.claimStatus) ||
        claim.claimStatus ||
        null,
      ownershipReviewStatus: normalizedReviewStatus,
      businessName: linkedBusiness?.business_name || claim.businessName || null,
      businessSlug: linkedBusiness?.alias || linkedBusiness?.slug || null,
    });
  }

  for (const membership of memberships) {
    const membershipId = String(membership?.membershipId || "");
    if (!membershipId || normalizedClaimsByMembershipId.has(membershipId)) {
      continue;
    }

    const review = reviewByMembershipId.get(membershipId) || null;
    const linkedBusiness = businessByMembershipId.get(membershipId) || null;
    const normalizedReviewStatus = normalizeFoundingClaimStage(
      review?.reviewStatus || membership?.ownershipReviewStatus,
    );
    const isPendingQueueItem =
      membership?.membershipStatus === "active" &&
      (normalizedReviewStatus === "ownership_verification_pending" ||
        normalizedReviewStatus === "additional_evidence_required" ||
        normalizedReviewStatus === "disputed");

    if (!isPendingQueueItem) continue;

    normalizedClaimsByMembershipId.set(membershipId, {
      _id: `synthetic-claim:${membershipId}`,
      membershipId,
      businessId:
        membership?.businessId || linkedBusiness?._id || review?.businessId || null,
      userId: membership?.userId || review?.userId || null,
      email:
        membership?.email ||
        review?.email ||
        linkedBusiness?.claimedByEmail ||
        null,
      claimStatus:
        normalizeFoundingClaimStage(membership?.claimStatus) ||
        "claim_initiated",
      ownershipReviewStatus: normalizedReviewStatus,
      claimLocked: true,
      businessName:
        linkedBusiness?.business_name || membership?.membershipName || null,
      businessSlug: linkedBusiness?.alias || linkedBusiness?.slug || null,
      createdAt:
        review?.createdAt || membership?.createdAt || membership?.updatedAt || null,
      updatedAt:
        review?.updatedAt || membership?.updatedAt || membership?.createdAt || null,
      source: "membership_review_join",
    });
  }

  return Array.from(normalizedClaimsByMembershipId.values()).sort((a, b) => {
    const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
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
