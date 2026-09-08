import { ObjectId, type Db } from "mongodb";
import {
  buildObjectIdOrStringFilter,
  listVerifiedBusinessOwnerships,
} from "./directoryOwnership";
import {
  normalizeBusiness360Sections,
  resolveBusiness360,
  type Business360Provenance,
  type Business360Resolved,
  type Business360Section,
} from "./business360";
import { mapDirectoryProfileFromDoc } from "./directoryProfileContract";

export type PersonBusinessRelationshipType =
  | "OWNER"
  | "VERIFIED_REPRESENTATIVE"
  | "MANAGER"
  | "SELLER";

export type PersonBusinessRelationshipState =
  | "LINKED"
  | "PARTIALLY_LINKED"
  | "NOT_LINKED"
  | "UNKNOWN";

export type PersonBusinessTrustLevel =
  | "AUTHORITATIVE"
  | "SUPPORTED"
  | "UNRESOLVED";

export type PersonBusinessProvenanceKind =
  | "VERIFIED_OWNERSHIP"
  | "MANAGED_BUSINESS"
  | "DIRECT_BUSINESS_ID"
  | "SELLER_LINKED"
  | "MEMBERSHIP_LINKED"
  | "EMAIL_ONLY"
  | "UNKNOWN";

export type PersonBusinessProvenance = {
  kind: PersonBusinessProvenanceKind;
  source: string;
  authoritative: boolean;
  note?: string | null;
};

export type PersonBusinessBusinessSummary = {
  businessId: string;
  name: string;
  alias: string | null;
  slug: string | null;
  status: string | null;
  publicRoute: string | null;
  directoryStatus: string | null;
};

export type PersonBusinessRelationship = {
  personId: string;
  businessId: string;
  relationshipTypes: PersonBusinessRelationshipType[];
  primaryRelationshipType: PersonBusinessRelationshipType;
  relationshipState: PersonBusinessRelationshipState;
  trustLevel: PersonBusinessTrustLevel;
  verifiedStatus: boolean;
  provenance: PersonBusinessProvenance[];
  sourceCollections: string[];
  sellerId: string | null;
  membershipId: string | null;
  businessSummary: PersonBusinessBusinessSummary;
  business360: Business360Resolved | null;
};

export type PersonBusinessUnresolvedCandidateType = "SELLER" | "EMPLOYER";

export type PersonBusinessUnresolvedCandidate = {
  personId: string;
  candidateType: PersonBusinessUnresolvedCandidateType;
  relationshipState: "PARTIALLY_LINKED" | "UNKNOWN";
  trustLevel: "UNRESOLVED";
  provenance: PersonBusinessProvenance[];
  sourceCollections: string[];
  sellerId: string | null;
  businessId: string | null;
  note: string;
};

export type PersonBusinessMetrics = {
  queryCount: number;
  latencyMs: number;
  relationshipsResolved: number;
  unresolvedCandidates: number;
  business360Resolutions: number;
  business360QueryCount: number;
};

export type ListPersonBusinessRelationshipsSuccess = {
  ok: true;
  anchor: "users._id" | "userId";
  person: {
    personId: string;
    email: string | null;
    accountType: string | null;
    isAdmin: boolean | null;
  };
  metrics: PersonBusinessMetrics;
  relationships: PersonBusinessRelationship[];
  unresolvedCandidates: PersonBusinessUnresolvedCandidate[];
};

export type PersonBusinessFailureCode = "MISSING_USER_ID";

export type PersonBusinessFailure = {
  ok: false;
  code: PersonBusinessFailureCode;
  message: string;
  metrics: PersonBusinessMetrics;
};

export type ListPersonBusinessRelationshipsResult =
  | ListPersonBusinessRelationshipsSuccess
  | PersonBusinessFailure;

export type ResolvePersonBusinessRelationshipResult =
  | {
      ok: true;
      anchor: "users._id" | "userId";
      person: {
        personId: string;
        email: string | null;
        accountType: string | null;
        isAdmin: boolean | null;
      };
      metrics: PersonBusinessMetrics;
      relationship: PersonBusinessRelationship | null;
      unresolvedCandidates: PersonBusinessUnresolvedCandidate[];
    }
  | PersonBusinessFailure;

export type ListPersonBusinessRelationshipsOptions = {
  userId: string;
  includeBusiness360?: boolean;
  business360Sections?: Business360Section[];
};

export type ResolvePersonBusinessRelationshipOptions =
  ListPersonBusinessRelationshipsOptions & {
    businessId: string;
  };

type RelationshipAccumulator = {
  personId: string;
  businessId: string;
  relationshipTypes: Set<PersonBusinessRelationshipType>;
  relationshipState: PersonBusinessRelationshipState;
  trustLevel: PersonBusinessTrustLevel;
  verifiedStatus: boolean;
  provenance: PersonBusinessProvenance[];
  sourceCollections: Set<string>;
  sellerId: string | null;
  membershipId: string | null;
  businessSummary: PersonBusinessBusinessSummary;
  business360: Business360Resolved | null;
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

function buildIdFilter(key: string, id: string) {
  return buildObjectIdOrStringFilter(key, id) || ({ [key]: id } as any);
}

function mergeProvenance(
  current: PersonBusinessProvenance[],
  incoming: PersonBusinessProvenance[],
) {
  const seen = new Set(
    current.map(
      (item) =>
        `${item.kind}|${item.source}|${item.authoritative ? "1" : "0"}|${item.note || ""}`,
    ),
  );

  for (const item of incoming) {
    const key = `${item.kind}|${item.source}|${item.authoritative ? "1" : "0"}|${item.note || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    current.push(item);
  }
}

function elevateTrust(
  current: PersonBusinessTrustLevel,
  incoming: PersonBusinessTrustLevel,
): PersonBusinessTrustLevel {
  const rank: Record<PersonBusinessTrustLevel, number> = {
    AUTHORITATIVE: 3,
    SUPPORTED: 2,
    UNRESOLVED: 1,
  };
  return rank[incoming] > rank[current] ? incoming : current;
}

function pickPrimaryRelationshipType(
  types: PersonBusinessRelationshipType[],
): PersonBusinessRelationshipType {
  if (types.includes("OWNER")) return "OWNER";
  if (types.includes("VERIFIED_REPRESENTATIVE"))
    return "VERIFIED_REPRESENTATIVE";
  if (types.includes("MANAGER")) return "MANAGER";
  return "SELLER";
}

function mapBusinessSummary(business360: Business360Resolved) {
  return {
    businessId: business360.identity.data.businessId,
    name: business360.identity.data.name,
    alias: business360.identity.data.alias,
    slug: business360.identity.data.slug,
    status: business360.identity.data.status,
    publicRoute: business360.identity.data.publicRoute,
    directoryStatus: business360.identity.data.directoryStatus,
  } satisfies PersonBusinessBusinessSummary;
}

function buildDefaultMetrics(): PersonBusinessMetrics {
  return {
    queryCount: 0,
    latencyMs: 0,
    relationshipsResolved: 0,
    unresolvedCandidates: 0,
    business360Resolutions: 0,
    business360QueryCount: 0,
  };
}

function supportsApprovedManagement(value: unknown) {
  const normalized = s(value).toLowerCase();
  return ["approved", "enabled", "active"].includes(normalized);
}

function supportsVerifiedStatus(value: unknown) {
  const normalized = s(value).toLowerCase();
  return ["ownership_verified", "verified"].includes(normalized);
}

async function findOneTracked(
  db: Db,
  metrics: PersonBusinessMetrics,
  collectionName: string,
  filter: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  metrics.queryCount += 1;
  return db.collection(collectionName).findOne(filter as any, options as any);
}

async function findManyTracked(
  db: Db,
  metrics: PersonBusinessMetrics,
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

function mergeBusiness360Provenance(
  items: Business360Provenance[],
  overrides?: Partial<PersonBusinessProvenance>,
): PersonBusinessProvenance[] {
  return items.map((item) => ({
    kind:
      item.kind === "MEMBERSHIP_LINKED"
        ? "MEMBERSHIP_LINKED"
        : item.kind === "SELLER_LINKED"
          ? "SELLER_LINKED"
          : item.kind === "DIRECT_BUSINESS_ID"
            ? "DIRECT_BUSINESS_ID"
            : item.kind === "UNKNOWN"
              ? "UNKNOWN"
              : "UNKNOWN",
    source: item.source,
    authoritative: item.authoritative,
    note: item.note || null,
    ...overrides,
  }));
}

export async function listPersonBusinessRelationships(
  db: Db,
  input: ListPersonBusinessRelationshipsOptions,
): Promise<ListPersonBusinessRelationshipsResult> {
  const startedAt = Date.now();
  const metrics = buildDefaultMetrics();
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

  const normalizedBusiness360Sections = normalizeBusiness360Sections(
    input.includeBusiness360
      ? input.business360Sections || ["identity"]
      : ["identity"],
  );

  const user = await findOneTracked(
    db,
    metrics,
    "users",
    buildIdFilter("_id", personId),
    {
      projection: {
        _id: 1,
        email: 1,
        accountType: 1,
        isAdmin: 1,
      },
    },
  );

  const personEmail = s((user as any)?.email).toLowerCase() || null;
  const anchor: "users._id" | "userId" = user?._id ? "users._id" : "userId";
  const relationshipsByBusinessId = new Map<string, RelationshipAccumulator>();
  const unresolvedCandidates: PersonBusinessUnresolvedCandidate[] = [];
  const unresolvedKeys = new Set<string>();
  const business360Cache = new Map<
    string,
    Promise<Business360Resolved | null>
  >();

  const memberships = await findManyTracked(
    db,
    metrics,
    "business_memberships",
    { userId: personId },
    {
      sort: { updatedAt: -1, createdAt: -1 },
      limit: 100,
      projection: {
        _id: 1,
        membershipId: 1,
        userId: 1,
        businessId: 1,
        ownershipReviewStatus: 1,
        managementAccessStatus: 1,
        membershipStatus: 1,
      },
    },
  );
  const membershipsByBusinessId = new Map<string, any[]>();
  for (const membership of memberships) {
    const businessId = toId((membership as any).businessId);
    if (!businessId) continue;
    const list = membershipsByBusinessId.get(businessId) || [];
    list.push(membership);
    membershipsByBusinessId.set(businessId, list);
  }

  async function resolveBusinessContext(businessId: string) {
    const key = s(businessId);
    if (!key) return null;
    if (!business360Cache.has(key)) {
      business360Cache.set(
        key,
        (async () => {
          const result = await resolveBusiness360(db, {
            businessId: key,
            sections: normalizedBusiness360Sections,
          });
          metrics.business360Resolutions += 1;
          metrics.business360QueryCount += result.metrics.queryCount;
          return result.ok ? result : null;
        })(),
      );
    }
    return business360Cache.get(key)!;
  }

  function addUnresolvedCandidate(
    candidate: PersonBusinessUnresolvedCandidate,
  ) {
    const key = [
      candidate.candidateType,
      candidate.sellerId || "",
      candidate.businessId || "",
      candidate.note,
    ].join("|");
    if (unresolvedKeys.has(key)) return;
    unresolvedKeys.add(key);
    unresolvedCandidates.push(candidate);
  }

  function ensureRelationship(
    businessId: string,
    business360: Business360Resolved,
  ) {
    if (relationshipsByBusinessId.has(businessId)) {
      return relationshipsByBusinessId.get(businessId)!;
    }

    const seeded: RelationshipAccumulator = {
      personId,
      businessId,
      relationshipTypes: new Set<PersonBusinessRelationshipType>(),
      relationshipState: "LINKED",
      trustLevel: "SUPPORTED",
      verifiedStatus: false,
      provenance: [],
      sourceCollections: new Set<string>(),
      sellerId: null,
      membershipId: null,
      businessSummary: mapBusinessSummary(business360),
      business360: input.includeBusiness360 ? business360 : null,
    };
    relationshipsByBusinessId.set(businessId, seeded);
    return seeded;
  }

  const verifiedOwnerships = await listVerifiedBusinessOwnerships(db, personId);
  const verifiedBusinessIds = uniq(
    verifiedOwnerships.map((ownership) => s(ownership.entityId)),
  );
  const verifiedBusinesses = verifiedBusinessIds.length
    ? await findManyTracked(
        db,
        metrics,
        "businesses",
        {
          $or: verifiedBusinessIds.map((businessId) =>
            buildIdFilter("_id", businessId),
          ),
        },
        {
          limit: verifiedBusinessIds.length,
          projection: {
            _id: 1,
            claimedByUserId: 1,
            managedByUserId: 1,
            ownerUserIds: 1,
          },
        },
      )
    : [];
  const verifiedBusinessById = new Map(
    verifiedBusinesses.map(
      (business) => [toId((business as any)._id), business] as const,
    ),
  );

  for (const ownership of verifiedOwnerships) {
    const businessId = s(ownership.entityId);
    if (!businessId) continue;
    const business360 = await resolveBusinessContext(businessId);
    if (!business360) continue;
    const businessDoc = verifiedBusinessById.get(businessId) || null;

    const relationship = ensureRelationship(businessId, business360);
    relationship.relationshipTypes.add("VERIFIED_REPRESENTATIVE");
    relationship.verifiedStatus = true;
    relationship.trustLevel = elevateTrust(
      relationship.trustLevel,
      "AUTHORITATIVE",
    );
    relationship.sourceCollections.add("business_claims");
    relationship.sourceCollections.add("ownership_reviews");
    relationship.sourceCollections.add("businesses");
    mergeProvenance(relationship.provenance, [
      {
        kind: "VERIFIED_OWNERSHIP",
        source: ownership.source || "verified_business_claim",
        authoritative: true,
      },
    ]);

    if (
      toId((businessDoc as any)?.claimedByUserId) === personId ||
      (Array.isArray((businessDoc as any)?.ownerUserIds) &&
        (businessDoc as any).ownerUserIds.some(
          (ownerId: unknown) => toId(ownerId) === personId,
        ))
    ) {
      relationship.relationshipTypes.add("OWNER");
      mergeProvenance(relationship.provenance, [
        {
          kind: "DIRECT_BUSINESS_ID",
          source: "businesses.claimedByUserId|ownerUserIds",
          authoritative: true,
        },
      ]);
    }

    const membershipRows = membershipsByBusinessId.get(businessId) || [];
    if (membershipRows.length) {
      relationship.membershipId =
        relationship.membershipId ||
        s((membershipRows[0] as any).membershipId) ||
        null;
      relationship.sourceCollections.add("business_memberships");
      mergeProvenance(relationship.provenance, [
        {
          kind: "MEMBERSHIP_LINKED",
          source:
            "business_memberships.userId + business_memberships.businessId",
          authoritative: supportsVerifiedStatus(
            (membershipRows[0] as any).ownershipReviewStatus,
          ),
        },
      ]);
    }

    const latestMembership = membershipRows[0] || null;
    if (
      toId((businessDoc as any)?.managedByUserId) === personId &&
      supportsApprovedManagement(
        (latestMembership as any)?.managementAccessStatus,
      )
    ) {
      relationship.relationshipTypes.add("MANAGER");
      mergeProvenance(relationship.provenance, [
        {
          kind: "MANAGED_BUSINESS",
          source:
            "businesses.managedByUserId + business_memberships.managementAccessStatus",
          authoritative: true,
        },
      ]);
    }
  }

  const sellers = await findManyTracked(
    db,
    metrics,
    "sellers",
    { userId: personId },
    {
      sort: { updatedAt: -1, createdAt: -1 },
      limit: 100,
      projection: {
        _id: 1,
        userId: 1,
        email: 1,
        businessId: 1,
        business_id: 1,
        stripeAccountId: 1,
      },
    },
  );

  for (const seller of sellers) {
    const sellerId = toId((seller as any)._id);
    const businessId =
      toId((seller as any).businessId) || toId((seller as any).business_id);

    if (!businessId) {
      addUnresolvedCandidate({
        personId,
        candidateType: "SELLER",
        relationshipState: "PARTIALLY_LINKED",
        trustLevel: "UNRESOLVED",
        provenance: [
          {
            kind: "UNKNOWN",
            source: "sellers.userId",
            authoritative: false,
            note: "Seller profile exists, but no direct businessId is stored.",
          },
        ],
        sourceCollections: ["sellers"],
        sellerId: sellerId || null,
        businessId: null,
        note: "Seller without businessId does not create an authoritative business relationship.",
      });
      continue;
    }

    const business360 = await resolveBusinessContext(businessId);
    if (!business360) {
      addUnresolvedCandidate({
        personId,
        candidateType: "SELLER",
        relationshipState: "PARTIALLY_LINKED",
        trustLevel: "UNRESOLVED",
        provenance: [
          {
            kind: "DIRECT_BUSINESS_ID",
            source: "sellers.businessId",
            authoritative: false,
            note: "Seller points to a businessId that does not resolve in businesses.",
          },
        ],
        sourceCollections: ["sellers", "businesses"],
        sellerId: sellerId || null,
        businessId,
        note: "Seller-business link is present but the canonical business anchor is missing.",
      });
      continue;
    }

    const relationship = ensureRelationship(businessId, business360);
    relationship.relationshipTypes.add("SELLER");
    relationship.sellerId = relationship.sellerId || sellerId || null;
    relationship.sourceCollections.add("sellers");
    relationship.trustLevel = elevateTrust(
      relationship.trustLevel,
      "SUPPORTED",
    );
    mergeProvenance(relationship.provenance, [
      {
        kind: "SELLER_LINKED",
        source: "sellers.userId + sellers.businessId",
        authoritative: false,
      },
      ...mergeBusiness360Provenance(business360.seller.provenance),
    ]);
  }

  if (personEmail) {
    const [sellerEmailOnly, employersByEmail, jobsByEmail] = await Promise.all([
      findManyTracked(
        db,
        metrics,
        "sellers",
        { email: personEmail, userId: { $ne: personId } } as any,
        {
          limit: 25,
          projection: { _id: 1, email: 1, businessId: 1, business_id: 1 },
        },
      ),
      findManyTracked(
        db,
        metrics,
        "employers",
        { email: personEmail },
        {
          limit: 25,
          projection: {
            _id: 1,
            email: 1,
            companyName: 1,
            businessId: 1,
            business_id: 1,
          },
        },
      ),
      findManyTracked(
        db,
        metrics,
        "jobs",
        {
          $or: [{ email: personEmail }, { employerEmail: personEmail }],
        },
        {
          limit: 50,
          projection: {
            _id: 1,
            email: 1,
            employerEmail: 1,
            company: 1,
            businessId: 1,
            business_id: 1,
          },
        },
      ),
    ]);

    if (sellerEmailOnly.length) {
      addUnresolvedCandidate({
        personId,
        candidateType: "SELLER",
        relationshipState: "UNKNOWN",
        trustLevel: "UNRESOLVED",
        provenance: [
          {
            kind: "EMAIL_ONLY",
            source: "sellers.email",
            authoritative: false,
            note: "Email-only seller overlays do not become authoritative person-business links.",
          },
        ],
        sourceCollections: ["sellers"],
        sellerId: toId((sellerEmailOnly[0] as any)._id) || null,
        businessId: null,
        note: "Email-only seller match remains unresolved.",
      });
    }

    if (employersByEmail.length || jobsByEmail.length) {
      addUnresolvedCandidate({
        personId,
        candidateType: "EMPLOYER",
        relationshipState: "UNKNOWN",
        trustLevel: "UNRESOLVED",
        provenance: [
          {
            kind: "EMAIL_ONLY",
            source: "employers.email + jobs.email|employerEmail",
            authoritative: false,
            note: "Employer and job email matches do not become authoritative business relationships.",
          },
        ],
        sourceCollections: [
          ...(employersByEmail.length ? ["employers"] : []),
          ...(jobsByEmail.length ? ["jobs"] : []),
        ],
        sellerId: null,
        businessId: null,
        note: "Email-only employer/job linkage remains unresolved until a direct business link exists.",
      });
    }
  }

  const relationships = Array.from(relationshipsByBusinessId.values())
    .map((relationship) => {
      const relationshipTypes = Array.from(relationship.relationshipTypes);
      if (
        relationshipTypes.includes("VERIFIED_REPRESENTATIVE") &&
        !relationshipTypes.includes("OWNER") &&
        relationship.provenance.some((item) => item.kind === "MANAGED_BUSINESS")
      ) {
        relationshipTypes.push("MANAGER");
      }

      const uniqueCollections = Array.from(relationship.sourceCollections);
      const sortedTypes = uniq(
        relationshipTypes,
      ) as PersonBusinessRelationshipType[];

      return {
        personId: relationship.personId,
        businessId: relationship.businessId,
        relationshipTypes: sortedTypes,
        primaryRelationshipType: pickPrimaryRelationshipType(sortedTypes),
        relationshipState: relationship.relationshipState,
        trustLevel: relationship.trustLevel,
        verifiedStatus: relationship.verifiedStatus,
        provenance: relationship.provenance,
        sourceCollections: uniqueCollections,
        sellerId: relationship.sellerId,
        membershipId: relationship.membershipId,
        businessSummary: relationship.businessSummary,
        business360: relationship.business360,
      } satisfies PersonBusinessRelationship;
    })
    .sort((left, right) => {
      const trustRank: Record<PersonBusinessTrustLevel, number> = {
        AUTHORITATIVE: 3,
        SUPPORTED: 2,
        UNRESOLVED: 1,
      };
      if (trustRank[right.trustLevel] !== trustRank[left.trustLevel]) {
        return trustRank[right.trustLevel] - trustRank[left.trustLevel];
      }
      return left.businessSummary.name.localeCompare(
        right.businessSummary.name,
      );
    });

  metrics.relationshipsResolved = relationships.length;
  metrics.unresolvedCandidates = unresolvedCandidates.length;
  metrics.latencyMs = Date.now() - startedAt;

  return {
    ok: true,
    anchor,
    person: {
      personId,
      email: personEmail,
      accountType: s((user as any)?.accountType) || null,
      isAdmin:
        typeof (user as any)?.isAdmin === "boolean"
          ? Boolean((user as any).isAdmin)
          : null,
    },
    metrics,
    relationships,
    unresolvedCandidates,
  };
}

export async function resolvePersonBusinessRelationship(
  db: Db,
  input: ResolvePersonBusinessRelationshipOptions,
): Promise<ResolvePersonBusinessRelationshipResult> {
  const businessId = s(input.businessId);
  const list = await listPersonBusinessRelationships(db, input);
  if (!list.ok) return list;

  return {
    ok: true,
    anchor: list.anchor,
    person: list.person,
    metrics: list.metrics,
    relationship:
      list.relationships.find(
        (relationship) => relationship.businessId === businessId,
      ) || null,
    unresolvedCandidates: list.unresolvedCandidates.filter(
      (candidate) =>
        !businessId ||
        candidate.businessId === businessId ||
        !candidate.businessId,
    ),
  };
}

export async function listVerifiedManagedBusinessSummaries(
  db: Db,
  userId: string,
) {
  const relationships = await listPersonBusinessRelationships(db, {
    userId,
    includeBusiness360: false,
  });

  if (!relationships.ok) return [];

  const verifiedBusinessIds = relationships.relationships
    .filter(
      (relationship) =>
        relationship.verifiedStatus &&
        relationship.relationshipTypes.includes("VERIFIED_REPRESENTATIVE"),
    )
    .map((relationship) => relationship.businessId);

  const results = [];
  for (const businessId of verifiedBusinessIds) {
    const doc = await db
      .collection("businesses")
      .findOne(buildIdFilter("_id", businessId), {
        projection: {
          _id: 1,
          alias: 1,
          slug: 1,
          businessName: 1,
          business_name: 1,
          name: 1,
          shortSummary: 1,
          summary: 1,
          description: 1,
          email: 1,
          publicEmail: 1,
          phone: 1,
          businessPhone: 1,
          website: 1,
          address: 1,
          streetAddress: 1,
          businessAddress: 1,
          addressLine1: 1,
          addressLine2: 1,
          suite: 1,
          unit: 1,
          city: 1,
          state: 1,
          zip: 1,
          postalCode: 1,
          zipCode: 1,
          serviceArea: 1,
          category: 1,
          primaryCategory: 1,
          categories: 1,
          secondaryCategories: 1,
          image: 1,
          coverImage: 1,
          logo: 1,
          images: 1,
          galleryImages: 1,
        },
      });

    if (!doc) continue;
    const profile = mapDirectoryProfileFromDoc(doc);
    results.push({
      id: String(doc._id),
      alias:
        String((doc as any).alias || (doc as any).slug || "").trim() || null,
      displayName: profile.displayName || "Business",
      shortSummary: profile.shortSummary || "",
      primaryCategory: profile.primaryCategory || "",
      city: profile.city || "",
      state: profile.state || "",
      editHref: `/edit-business?businessId=${encodeURIComponent(String(doc._id))}`,
      profileHref: `/business/profile?businessId=${encodeURIComponent(String(doc._id))}`,
      publicHref:
        (doc as any).alias || (doc as any).slug
          ? `/business/${encodeURIComponent(String((doc as any).alias || (doc as any).slug))}`
          : null,
    });
  }

  return results;
}
