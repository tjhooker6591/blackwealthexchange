import { ObjectId, type Db } from "mongodb";
import { resolveBlackCardState } from "./black-card-state";
import {
  resolvePersonActivity360,
  type Activity360Summary,
} from "./activity360";
import {
  listPersonBusinessRelationships,
  type ListPersonBusinessRelationshipsResult,
} from "./personBusinessRelationships";
import { type Business360Section } from "./business360";

export type Person360Role =
  | "MEMBER"
  | "PREMIUM_MEMBER"
  | "FOUNDING_MEMBER"
  | "BLACK_CARD_MEMBER"
  | "BUSINESS_OWNER"
  | "VERIFIED_REPRESENTATIVE"
  | "BUSINESS_MANAGER"
  | "SELLER"
  | "AFFILIATE"
  | "CONSULTANT"
  | "CREATOR"
  | "EMPLOYER"
  | "ADMIN";

export type Person360TrustLevel = "AUTHORITATIVE" | "SUPPORTED" | "UNRESOLVED";

export type Person360ProvenanceKind =
  | "USER_RECORD"
  | "PERSON_BUSINESS_RELATIONSHIP"
  | "SELLER_PROFILE"
  | "AFFILIATE_PROFILE"
  | "CONSULTANT_PROFILE"
  | "CREATOR_PROFILE"
  | "BLACK_CARD_MEMBERSHIP"
  | "BLACK_CARD_CARD"
  | "BLACK_CARD_REQUEST"
  | "EMPLOYER_ACTIVITY"
  | "EMAIL_ONLY_REJECTED"
  | "UNKNOWN";

export type Person360Provenance = {
  kind: Person360ProvenanceKind;
  source: string;
  authoritative: boolean;
  note?: string | null;
};

export type Person360Metrics = {
  queryCount: number;
  latencyMs: number;
  businessRelationshipQueryCount: number;
  businessRelationshipsResolved: number;
  unresolvedRelationshipCount: number;
};

export type Person360Identity = {
  personId: string;
  email: string | null;
  accountType: string | null;
  isAdmin: boolean | null;
  fullName: string | null;
};

export type Person360Membership = {
  state: "FREE" | "PREMIUM" | "FOUNDING" | "UNKNOWN";
  currentPlan: string | null;
  premiumStatus: string | null;
  subscriptionStatus: string | null;
  membershipPlanStatus: string | null;
  membershipPlanExpiresAt: string | null;
  isPremiumMember: boolean;
  isFoundingMember: boolean;
  provenance: Person360Provenance[];
};

export type Person360BlackCard = {
  state: ReturnType<typeof resolveBlackCardState>;
  tier: string | null;
  status: string | null;
  memberSince: string | null;
  planExpiresAt: string | null;
  hasPendingRequest: boolean;
  hasActiveCardSignal: boolean;
  activeMembershipId: string | null;
  activeCardId: string | null;
  trustLevel: Person360TrustLevel;
  provenance: Person360Provenance[];
};

export type Person360Seller = {
  state: "ACTIVE" | "INACTIVE" | "NOT_PRESENT";
  sellerIds: string[];
  linkedBusinessIds: string[];
  creatorSubtype: string | null;
  creatorPlanStatus: string | null;
  creatorReady: boolean;
  provenance: Person360Provenance[];
};

export type Person360Affiliate = {
  state: "ACTIVE" | "PENDING" | "INACTIVE" | "NOT_PRESENT";
  affiliateId: string | null;
  status: string | null;
  referralCode: string | null;
  provenance: Person360Provenance[];
};

export type Person360Consultant = {
  state: "ACTIVE" | "NOT_PRESENT";
  profileId: string | null;
  status: string | null;
  completenessScore: number | null;
  provenance: Person360Provenance[];
};

export type Person360Creator = {
  state: "ACTIVE" | "INACTIVE" | "NOT_PRESENT";
  subtype: string | null;
  onboardingStatus: string | null;
  planStatus: string | null;
  ready: boolean;
  sourceCollections: string[];
  provenance: Person360Provenance[];
};

export type Person360Employer = {
  state: "ACTIVE" | "NOT_PRESENT";
  postedJobCount: number;
  latestJobId: string | null;
  companyNames: string[];
  directEmployerIds: string[];
  provenance: Person360Provenance[];
};

export type Person360Activity = Activity360Summary;

export type Person360Resolved = {
  ok: true;
  anchor: "users._id";
  identity: Person360Identity;
  roles: Person360Role[];
  membership: Person360Membership;
  blackCard: Person360BlackCard;
  seller: Person360Seller;
  affiliate: Person360Affiliate;
  consultant: Person360Consultant;
  creator: Person360Creator;
  employer: Person360Employer;
  activity: Person360Activity;
  businessRelationships: Extract<
    ListPersonBusinessRelationshipsResult,
    { ok: true }
  >["relationships"];
  unresolvedRelationships: Extract<
    ListPersonBusinessRelationshipsResult,
    { ok: true }
  >["unresolvedCandidates"];
  overlays: string[];
  metrics: Person360Metrics;
};

export type Person360FailureCode = "MISSING_USER_ID" | "USER_NOT_FOUND";

export type Person360Failure = {
  ok: false;
  code: Person360FailureCode;
  message: string;
  metrics: Person360Metrics;
};

export type Person360Result = Person360Resolved | Person360Failure;

export type ResolvePerson360Options = {
  userId: string;
  includeBusiness360?: boolean;
  business360Sections?: Business360Section[];
};

type BlackCardStateInput = {
  loggedIn: boolean;
  currentPlan: string;
  premiumStatus: string;
  hasPendingRequest: boolean;
  cardStatus: string;
  hasActiveCardSignal: boolean;
};

function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function toId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === "object" && (value as any)?._bsontype === "ObjectId") {
    return String(value);
  }
  return s(value);
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function asIsoDate(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  const text = s(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

function defaultMetrics(): Person360Metrics {
  return {
    queryCount: 0,
    latencyMs: 0,
    businessRelationshipQueryCount: 0,
    businessRelationshipsResolved: 0,
    unresolvedRelationshipCount: 0,
  };
}

function normalizeMembershipState(user: Record<string, unknown>) {
  const currentPlan = s(user.currentPlan).toLowerCase();
  const premiumStatus = s(user.premiumStatus).toLowerCase();

  if (currentPlan === "founding") return "FOUNDING" as const;
  if (currentPlan === "premium" || premiumStatus === "active") {
    return "PREMIUM" as const;
  }
  if (currentPlan === "free" || premiumStatus === "inactive") {
    return "FREE" as const;
  }
  return "UNKNOWN" as const;
}

async function findOneTracked(
  db: Db,
  metrics: Person360Metrics,
  collectionName: string,
  filter: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  metrics.queryCount += 1;
  return db.collection(collectionName).findOne(filter as any, options as any);
}

async function findManyTracked(
  db: Db,
  metrics: Person360Metrics,
  collectionName: string,
  filter: Record<string, unknown>,
  options?: {
    sort?: Record<string, 1 | -1>;
    limit?: number;
    projection?: Record<string, unknown>;
  },
) {
  metrics.queryCount += 1;
  let cursor = db.collection(collectionName).find(filter as any, {
    projection: options?.projection as any,
  });
  if (options?.sort) cursor = cursor.sort(options.sort as any);
  if (typeof options?.limit === "number") cursor = cursor.limit(options.limit);
  return cursor.toArray();
}

function addRole(target: Set<Person360Role>, role: Person360Role, when = true) {
  if (when) target.add(role);
}

export async function resolvePerson360(
  db: Db,
  input: ResolvePerson360Options,
): Promise<Person360Result> {
  const startedAt = Date.now();
  const metrics = defaultMetrics();
  const personId = s(input.userId);

  if (!personId) {
    metrics.latencyMs = Date.now() - startedAt;
    return {
      ok: false,
      code: "MISSING_USER_ID",
      message: "User identifier is required.",
      metrics,
    };
  }

  const user = await findOneTracked(
    db,
    metrics,
    "users",
    { _id: ObjectId.isValid(personId) ? new ObjectId(personId) : personId },
    {
      projection: {
        _id: 1,
        email: 1,
        accountType: 1,
        isAdmin: 1,
        fullName: 1,
        currentPlan: 1,
        premiumStatus: 1,
        subscriptionStatus: 1,
        membershipPlanStatus: 1,
        membershipPlanExpiresAt: 1,
        blackCardTier: 1,
        blackCardStatus: 1,
        blackCardMemberSince: 1,
        blackCardPlanExpiresAt: 1,
        creatorSubtype: 1,
        creatorOnboardingStatus: 1,
        creatorPlanId: 1,
        creatorPlanStatus: 1,
        creatorReady: 1,
      },
    },
  );

  if (!user) {
    metrics.latencyMs = Date.now() - startedAt;
    return {
      ok: false,
      code: "USER_NOT_FOUND",
      message: "User not found.",
      metrics,
    };
  }

  const relationshipsResult = await listPersonBusinessRelationships(db, {
    userId: personId,
    includeBusiness360: Boolean(input.includeBusiness360),
    business360Sections: input.business360Sections,
  });

  metrics.businessRelationshipQueryCount =
    relationshipsResult.metrics.queryCount;

  if (!relationshipsResult.ok) {
    metrics.latencyMs = Date.now() - startedAt;
    return {
      ok: false,
      code: relationshipsResult.code,
      message: relationshipsResult.message,
      metrics,
    };
  }

  metrics.businessRelationshipsResolved =
    relationshipsResult.relationships.length;
  metrics.unresolvedRelationshipCount =
    relationshipsResult.unresolvedCandidates.length;

  const [
    sellerProfiles,
    affiliate,
    consultantProfile,
    blackCardMemberships,
    blackCardCards,
    blackCardRequests,
    jobsByUser,
    employersByUser,
  ] = await Promise.all([
    findManyTracked(
      db,
      metrics,
      "sellers",
      { userId: personId },
      {
        sort: { updatedAt: -1, createdAt: -1 },
        limit: 25,
        projection: {
          _id: 1,
          userId: 1,
          businessId: 1,
          business_id: 1,
          creatorSubtype: 1,
          creatorPlanStatus: 1,
          creatorReady: 1,
          creatorOnboardingStatus: 1,
        },
      },
    ),
    findOneTracked(
      db,
      metrics,
      "affiliates",
      { userId: personId },
      {
        projection: {
          _id: 1,
          userId: 1,
          status: 1,
          referralCode: 1,
        },
      },
    ),
    findOneTracked(
      db,
      metrics,
      "consultant_profiles",
      { userId: personId },
      {
        projection: {
          _id: 1,
          userId: 1,
          status: 1,
          completenessScore: 1,
        },
      },
    ),
    findManyTracked(
      db,
      metrics,
      "black_card_memberships",
      { userId: personId },
      {
        sort: { updatedAt: -1, createdAt: -1 },
        limit: 10,
        projection: {
          _id: 1,
          userId: 1,
          status: 1,
          membershipStatus: 1,
          tier: 1,
          memberSince: 1,
          planExpiresAt: 1,
        },
      },
    ),
    findManyTracked(
      db,
      metrics,
      "black_card_cards",
      { userId: personId },
      {
        sort: { updatedAt: -1, createdAt: -1 },
        limit: 10,
        projection: {
          _id: 1,
          userId: 1,
          status: 1,
          issuedAt: 1,
        },
      },
    ),
    findManyTracked(
      db,
      metrics,
      "black_card_digital_requests",
      { userId: personId },
      {
        sort: { updatedAt: -1, createdAt: -1 },
        limit: 10,
        projection: {
          _id: 1,
          userId: 1,
          status: 1,
          createdAt: 1,
        },
      },
    ),
    findManyTracked(
      db,
      metrics,
      "jobs",
      { userId: personId },
      {
        sort: { createdAt: -1 },
        limit: 50,
        projection: {
          _id: 1,
          userId: 1,
          company: 1,
        },
      },
    ),
    findManyTracked(
      db,
      metrics,
      "employers",
      { userId: personId },
      {
        sort: { updatedAt: -1, createdAt: -1 },
        limit: 25,
        projection: {
          _id: 1,
          userId: 1,
          companyName: 1,
        },
      },
    ),
  ]);

  const roles = new Set<Person360Role>(["MEMBER"]);
  addRole(roles, "ADMIN", user.isAdmin === true);
  addRole(
    roles,
    "PREMIUM_MEMBER",
    normalizeMembershipState(user) === "PREMIUM",
  );
  addRole(
    roles,
    "FOUNDING_MEMBER",
    normalizeMembershipState(user) === "FOUNDING",
  );

  for (const relationship of relationshipsResult.relationships) {
    addRole(
      roles,
      "BUSINESS_OWNER",
      relationship.relationshipTypes.includes("OWNER"),
    );
    addRole(
      roles,
      "VERIFIED_REPRESENTATIVE",
      relationship.relationshipTypes.includes("VERIFIED_REPRESENTATIVE"),
    );
    addRole(
      roles,
      "BUSINESS_MANAGER",
      relationship.relationshipTypes.includes("MANAGER"),
    );
    addRole(roles, "SELLER", relationship.relationshipTypes.includes("SELLER"));
  }

  const membershipState = normalizeMembershipState(user);
  const membership: Person360Membership = {
    state: membershipState,
    currentPlan: s(user.currentPlan) || null,
    premiumStatus: s(user.premiumStatus) || null,
    subscriptionStatus: s(user.subscriptionStatus) || null,
    membershipPlanStatus: s(user.membershipPlanStatus) || null,
    membershipPlanExpiresAt: asIsoDate(user.membershipPlanExpiresAt),
    isPremiumMember:
      membershipState === "PREMIUM" || membershipState === "FOUNDING",
    isFoundingMember: membershipState === "FOUNDING",
    provenance: [
      {
        kind: "USER_RECORD",
        source:
          "users.currentPlan|premiumStatus|subscriptionStatus|membershipPlanStatus",
        authoritative: true,
      },
    ],
  };

  const latestMembership = blackCardMemberships[0] || null;
  const activeMembership =
    blackCardMemberships.find((entry) =>
      ["active", "approved"].includes(
        s(
          (entry as any).membershipStatus || (entry as any).status,
        ).toLowerCase(),
      ),
    ) || latestMembership;
  const latestCard = blackCardCards[0] || null;
  const activeCard =
    blackCardCards.find((entry) =>
      ["active", "approved"].includes(s((entry as any).status).toLowerCase()),
    ) || latestCard;
  const hasPendingRequest = blackCardRequests.some((entry) =>
    ["pending", "submitted", "requested", "in_review"].includes(
      s((entry as any).status).toLowerCase(),
    ),
  );
  const hasActiveCardSignal =
    Boolean(activeMembership) ||
    blackCardCards.some((entry) =>
      ["active", "approved"].includes(s((entry as any).status).toLowerCase()),
    );

  const blackCardInput: BlackCardStateInput = {
    loggedIn: true,
    currentPlan: s(user.currentPlan) || "free",
    premiumStatus: s(user.premiumStatus) || "inactive",
    hasPendingRequest,
    cardStatus:
      s(user.blackCardStatus) ||
      s((activeCard as any)?.status) ||
      s((activeMembership as any)?.status) ||
      "inactive",
    hasActiveCardSignal,
  };

  const blackCard: Person360BlackCard = {
    state: resolveBlackCardState(blackCardInput),
    tier: s(user.blackCardTier) || s((activeMembership as any)?.tier) || null,
    status:
      s(user.blackCardStatus) ||
      s((activeCard as any)?.status) ||
      s((activeMembership as any)?.status) ||
      null,
    memberSince:
      asIsoDate(user.blackCardMemberSince) ||
      asIsoDate((activeMembership as any)?.memberSince),
    planExpiresAt:
      asIsoDate(user.blackCardPlanExpiresAt) ||
      asIsoDate((activeMembership as any)?.planExpiresAt),
    hasPendingRequest,
    hasActiveCardSignal,
    activeMembershipId: toId((activeMembership as any)?._id) || null,
    activeCardId: toId((activeCard as any)?._id) || null,
    trustLevel:
      activeMembership || activeCard || s(user.blackCardStatus)
        ? "SUPPORTED"
        : hasPendingRequest
          ? "SUPPORTED"
          : "UNRESOLVED",
    provenance: [
      {
        kind: "USER_RECORD",
        source:
          "users.blackCardTier|blackCardStatus|blackCardMemberSince|blackCardPlanExpiresAt",
        authoritative: true,
      },
      ...(activeMembership
        ? [
            {
              kind: "BLACK_CARD_MEMBERSHIP" as const,
              source: "black_card_memberships.userId",
              authoritative: true,
            },
          ]
        : []),
      ...(activeCard
        ? [
            {
              kind: "BLACK_CARD_CARD" as const,
              source: "black_card_cards.userId",
              authoritative: true,
            },
          ]
        : []),
      ...(hasPendingRequest
        ? [
            {
              kind: "BLACK_CARD_REQUEST" as const,
              source: "black_card_digital_requests.userId",
              authoritative: true,
            },
          ]
        : []),
    ],
  };
  addRole(
    roles,
    "BLACK_CARD_MEMBER",
    blackCard.state === "PREMIUM_ACTIVE_CARD" ||
      blackCard.state === "FOUNDING_ACTIVE_CARD" ||
      blackCard.state === "ACTIVE_CARD_BUT_PLAN_UNKNOWN",
  );

  const sellerIds = uniq(
    sellerProfiles.map((seller) => toId((seller as any)._id)),
  );
  const sellerBusinessIds = uniq(
    sellerProfiles.flatMap((seller) => [
      toId((seller as any).businessId),
      toId((seller as any).business_id),
    ]),
  );
  const userCreatorReady = Boolean(user.creatorReady);
  const sellerCreatorReady = sellerProfiles.some(
    (seller) => (seller as any).creatorReady === true,
  );

  const seller: Person360Seller = {
    state: sellerProfiles.length ? "ACTIVE" : "NOT_PRESENT",
    sellerIds,
    linkedBusinessIds: sellerBusinessIds,
    creatorSubtype:
      s(user.creatorSubtype) ||
      s((sellerProfiles[0] as any)?.creatorSubtype) ||
      null,
    creatorPlanStatus:
      s(user.creatorPlanStatus) ||
      s((sellerProfiles[0] as any)?.creatorPlanStatus) ||
      null,
    creatorReady: userCreatorReady || sellerCreatorReady,
    provenance: sellerProfiles.length
      ? [
          {
            kind: "SELLER_PROFILE",
            source: "sellers.userId",
            authoritative: true,
          },
        ]
      : [],
  };
  addRole(roles, "SELLER", sellerProfiles.length > 0);

  const affiliateStatus = s((affiliate as any)?.status).toLowerCase();
  const affiliateState = !affiliate
    ? "NOT_PRESENT"
    : affiliateStatus === "active"
      ? "ACTIVE"
      : affiliateStatus === "pending"
        ? "PENDING"
        : "INACTIVE";
  const affiliateOverlay: Person360Affiliate = {
    state: affiliateState,
    affiliateId: toId((affiliate as any)?._id) || null,
    status: s((affiliate as any)?.status) || null,
    referralCode: s((affiliate as any)?.referralCode) || null,
    provenance: affiliate
      ? [
          {
            kind: "AFFILIATE_PROFILE",
            source: "affiliates.userId",
            authoritative: true,
          },
        ]
      : [],
  };
  addRole(roles, "AFFILIATE", Boolean(affiliate));

  const consultant: Person360Consultant = {
    state: consultantProfile ? "ACTIVE" : "NOT_PRESENT",
    profileId: toId((consultantProfile as any)?._id) || null,
    status: s((consultantProfile as any)?.status) || null,
    completenessScore:
      typeof (consultantProfile as any)?.completenessScore === "number"
        ? Number((consultantProfile as any).completenessScore)
        : null,
    provenance: consultantProfile
      ? [
          {
            kind: "CONSULTANT_PROFILE",
            source: "consultant_profiles.userId",
            authoritative: true,
          },
        ]
      : [],
  };
  addRole(roles, "CONSULTANT", Boolean(consultantProfile));

  const creatorSources = uniq([
    ...(s(user.creatorSubtype) ||
    s(user.creatorOnboardingStatus) ||
    s(user.creatorPlanStatus) ||
    userCreatorReady
      ? ["users"]
      : []),
    ...(sellerProfiles.some(
      (seller) =>
        s((seller as any).creatorSubtype) ||
        s((seller as any).creatorPlanStatus) ||
        s((seller as any).creatorOnboardingStatus) ||
        (seller as any).creatorReady === true,
    )
      ? ["sellers"]
      : []),
  ]);
  const creator: Person360Creator = {
    state: creatorSources.length
      ? userCreatorReady || sellerCreatorReady
        ? "ACTIVE"
        : "INACTIVE"
      : "NOT_PRESENT",
    subtype:
      s(user.creatorSubtype) ||
      s((sellerProfiles[0] as any)?.creatorSubtype) ||
      null,
    onboardingStatus:
      s(user.creatorOnboardingStatus) ||
      s((sellerProfiles[0] as any)?.creatorOnboardingStatus) ||
      null,
    planStatus:
      s(user.creatorPlanStatus) ||
      s((sellerProfiles[0] as any)?.creatorPlanStatus) ||
      null,
    ready: userCreatorReady || sellerCreatorReady,
    sourceCollections: creatorSources,
    provenance: creatorSources.length
      ? [
          {
            kind: "CREATOR_PROFILE",
            source: creatorSources.join(" + "),
            authoritative: true,
          },
        ]
      : [],
  };
  addRole(roles, "CREATOR", creatorSources.length > 0);

  const employer: Person360Employer = {
    state:
      jobsByUser.length || employersByUser.length ? "ACTIVE" : "NOT_PRESENT",
    postedJobCount: jobsByUser.length,
    latestJobId: toId((jobsByUser[0] as any)?._id) || null,
    companyNames: uniq([
      ...jobsByUser.map((job) => s((job as any).company)),
      ...employersByUser.map((entry) => s((entry as any).companyName)),
    ]),
    directEmployerIds: uniq(
      employersByUser.map((entry) => toId((entry as any)._id)),
    ),
    provenance: [
      ...(jobsByUser.length
        ? [
            {
              kind: "EMPLOYER_ACTIVITY" as const,
              source: "jobs.userId",
              authoritative: true,
            },
          ]
        : []),
      ...(employersByUser.length
        ? [
            {
              kind: "EMPLOYER_ACTIVITY" as const,
              source: "employers.userId",
              authoritative: true,
            },
          ]
        : []),
      ...relationshipsResult.unresolvedCandidates
        .filter((candidate) => candidate.candidateType === "EMPLOYER")
        .map(() => ({
          kind: "EMAIL_ONLY_REJECTED" as const,
          source: "personBusinessRelationships.unresolvedCandidates",
          authoritative: false,
          note: "Email-only employer links remain non-authoritative.",
        })),
    ],
  };
  addRole(
    roles,
    "EMPLOYER",
    employer.state === "ACTIVE" ||
      s(user.accountType).toLowerCase() === "employer",
  );

  const activity = await resolvePersonActivity360(db, metrics, {
    userId: personId,
  });

  const overlays = uniq([
    "business_relationships",
    "membership",
    "black_card",
    ...(sellerProfiles.length ? ["seller"] : []),
    ...(affiliate ? ["affiliate"] : []),
    ...(consultantProfile ? ["consultant"] : []),
    ...(creatorSources.length ? ["creator"] : []),
    ...(jobsByUser.length || employersByUser.length ? ["employer"] : []),
    ...(activity.state === "LINKED" ? ["activity"] : []),
  ]);

  metrics.latencyMs = Date.now() - startedAt;

  return {
    ok: true,
    anchor: "users._id",
    identity: {
      personId,
      email: s(user.email).toLowerCase() || null,
      accountType: s(user.accountType) || null,
      isAdmin: typeof user.isAdmin === "boolean" ? Boolean(user.isAdmin) : null,
      fullName: s(user.fullName) || null,
    },
    roles: Array.from(roles),
    membership,
    blackCard,
    seller,
    affiliate: affiliateOverlay,
    consultant,
    creator,
    employer,
    activity,
    businessRelationships: relationshipsResult.relationships,
    unresolvedRelationships: relationshipsResult.unresolvedCandidates,
    overlays,
    metrics,
  };
}
