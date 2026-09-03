import { ObjectId, type Db } from "mongodb";
import { buildObjectIdOrStringFilter } from "./directoryOwnership";
import { resolveCanonicalMarketplaceBusinessId } from "./marketplace/businessAttribution";
import { resolveBusinessActivity360 } from "./activity360";

export type Business360Section =
  | "identity"
  | "directory"
  | "ownership"
  | "membership"
  | "seller"
  | "commerce"
  | "advertising"
  | "jobs"
  | "support"
  | "activity"
  | "organization";

export type Business360RelationshipState =
  | "LINKED"
  | "PARTIALLY_LINKED"
  | "NOT_LINKED"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export type Business360ProvenanceKind =
  | "VERIFIED"
  | "MEMBERSHIP_LINKED"
  | "SELLER_LINKED"
  | "PAYMENT_LINKED"
  | "DIRECT_BUSINESS_ID"
  | "EMAIL_ONLY"
  | "TEXT_MATCH_ONLY"
  | "UNKNOWN";

export type Business360Provenance = {
  kind: Business360ProvenanceKind;
  source: string;
  authoritative: boolean;
  note?: string | null;
};

export type Business360Lane<T> = {
  state: Business360RelationshipState;
  provenance: Business360Provenance[];
  data: T;
};

export type Business360Metrics = {
  queryCount: number;
  latencyMs: number;
  sectionsRequested: Business360Section[];
  sectionsResolved: Business360Section[];
  sectionQueryCount: Partial<Record<Business360Section, number>>;
};

export type Business360IdentityData = {
  businessId: string;
  name: string;
  alias: string | null;
  slug: string | null;
  status: string | null;
  publicRoute: string | null;
  directoryStatus: string | null;
};

export type Business360DirectoryData = {
  anchorCollection: "businesses";
  paidListingCount: number;
  latestListingId: string | null;
  latestListingStatus: string | null;
  listingTier: string | null;
};

export type Business360OwnershipData = {
  representativeUserIds: string[];
  representativeEmails: string[];
  verifiedRepresentativeUserIds: string[];
  claimState: string | null;
  ownershipReviewState: string | null;
  claimCount: number;
  reviewCount: number;
  claimIds: string[];
  reviewIds: string[];
};

export type Business360MembershipData = {
  membershipIds: string[];
  latestMembershipId: string | null;
  membershipStatus: string | null;
  ownershipReviewStatus: string | null;
  managementAccessStatus: string | null;
  fulfillmentStatus: string | null;
  onboardingStatus: string | null;
};

export type Business360SellerData = {
  directSellerIds: string[];
  productLinkedSellerIds: string[];
  stripeAccountIds: string[];
  publishedProductCount: number;
  totalProductCount: number;
  payoutReadySellerCount: number;
  linkageSource:
    | "seller.businessId"
    | "product.businessId"
    | "seller_and_product"
    | "none";
};

export type Business360CommerceData = {
  linkedProductCount: number;
  linkedOrderCount: number;
  linkedPaymentCount: number;
  productLinkedOrderCount: number;
  productLinkedPaymentCount: number;
  paymentSessionIds: string[];
  orderIds: string[];
  sellerIds: string[];
};

export type Business360AdvertisingData = {
  advertisingRequestCount: number;
  adPurchaseCount: number;
  sponsorScheduleCount: number;
  directoryListingCount: number;
  campaignIds: string[];
};

export type Business360JobsData = {
  linkedJobCount: number;
  linkedEmployerCount: number;
  unresolvedReason: string | null;
};

export type Business360SupportData = {
  ticketCount: number;
  openTicketCount: number;
  ticketIds: string[];
  categories: string[];
};

export type Business360ActivityData = {
  flowEventCount: number;
  searchEventCount: number;
  recentEventTypes: string[];
};

export type Business360OrganizationData = {
  relationship: "NONE" | "UNRESOLVED" | "PROVEN";
  organizationId: string | null;
  organizationSlug: string | null;
};

export type Business360Resolved = {
  ok: true;
  anchor: "businesses._id";
  metrics: Business360Metrics;
  identity: Business360Lane<Business360IdentityData>;
  directory: Business360Lane<Business360DirectoryData>;
  ownership: Business360Lane<Business360OwnershipData>;
  membership: Business360Lane<Business360MembershipData>;
  seller: Business360Lane<Business360SellerData>;
  commerce: Business360Lane<Business360CommerceData>;
  advertising: Business360Lane<Business360AdvertisingData>;
  jobs: Business360Lane<Business360JobsData>;
  support: Business360Lane<Business360SupportData>;
  activity: Business360Lane<Business360ActivityData>;
  organization: Business360Lane<Business360OrganizationData>;
};

export type Business360FailureCode =
  | "MISSING_BUSINESS_ID"
  | "BUSINESS_NOT_FOUND";

export type Business360Failure = {
  ok: false;
  code: Business360FailureCode;
  message: string;
  metrics: Business360Metrics;
};

export type Business360Result = Business360Resolved | Business360Failure;

export type ResolveBusiness360Options = {
  businessId: string;
  sections?: Business360Section[];
};

const ALL_BUSINESS360_SECTIONS: Business360Section[] = [
  "identity",
  "directory",
  "ownership",
  "membership",
  "seller",
  "commerce",
  "advertising",
  "jobs",
  "support",
  "activity",
  "organization",
];

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

function isOpenSupportStatus(status: string) {
  return ["new", "in review", "waiting on user", "escalated"].includes(
    status.trim().toLowerCase(),
  );
}

function defaultMetrics(
  sectionsRequested: Business360Section[],
): Business360Metrics {
  return {
    queryCount: 0,
    latencyMs: 0,
    sectionsRequested,
    sectionsResolved: [],
    sectionQueryCount: {},
  };
}

function unresolvedLane<T>(data: T): Business360Lane<T> {
  return {
    state: "UNKNOWN",
    provenance: [
      { kind: "UNKNOWN", source: "not_requested", authoritative: false },
    ],
    data,
  };
}

function shouldResolve(
  requested: Set<Business360Section>,
  section: Business360Section,
) {
  return requested.has(section);
}

function recordQuery(metrics: Business360Metrics, section: Business360Section) {
  metrics.queryCount += 1;
  metrics.sectionQueryCount[section] =
    Number(metrics.sectionQueryCount[section] || 0) + 1;
}

async function findOneTracked(
  db: Db,
  metrics: Business360Metrics,
  section: Business360Section,
  collectionName: string,
  filter: Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  recordQuery(metrics, section);
  return db.collection(collectionName).findOne(filter as any, options as any);
}

async function findManyTracked(
  db: Db,
  metrics: Business360Metrics,
  section: Business360Section,
  collectionName: string,
  filter: Record<string, unknown>,
  options?: {
    sort?: Record<string, 1 | -1>;
    limit?: number;
    projection?: Record<string, unknown>;
  },
) {
  recordQuery(metrics, section);
  let cursor = db.collection(collectionName).find(filter as any, {
    projection: options?.projection as any,
  });
  if (options?.sort) cursor = cursor.sort(options.sort as any);
  if (typeof options?.limit === "number") cursor = cursor.limit(options.limit);
  return cursor.toArray();
}

function businessIdFilter(field: string, businessId: string) {
  return (
    buildObjectIdOrStringFilter(field, businessId) ||
    ({ [field]: businessId } as any)
  );
}

function productIdFilter(productIds: string[]) {
  const validProductIds = uniq(productIds);
  const objectIds = validProductIds
    .filter((id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id)
    .map((id) => new ObjectId(id));

  if (!validProductIds.length && !objectIds.length) {
    return { _id: { $in: [] } };
  }

  return {
    $or: [
      { productId: { $in: validProductIds } },
      { productId: { $in: objectIds } },
      { itemId: { $in: validProductIds } },
      { "metadata.productId": { $in: validProductIds } },
    ],
  };
}

function baseEmptyResult(
  metrics: Business360Metrics,
  businessId: string,
): Business360Resolved {
  return {
    ok: true,
    anchor: "businesses._id",
    metrics,
    identity: unresolvedLane({
      businessId,
      name: "",
      alias: null,
      slug: null,
      status: null,
      publicRoute: null,
      directoryStatus: null,
    }),
    directory: unresolvedLane({
      anchorCollection: "businesses",
      paidListingCount: 0,
      latestListingId: null,
      latestListingStatus: null,
      listingTier: null,
    }),
    ownership: unresolvedLane({
      representativeUserIds: [],
      representativeEmails: [],
      verifiedRepresentativeUserIds: [],
      claimState: null,
      ownershipReviewState: null,
      claimCount: 0,
      reviewCount: 0,
      claimIds: [],
      reviewIds: [],
    }),
    membership: unresolvedLane({
      membershipIds: [],
      latestMembershipId: null,
      membershipStatus: null,
      ownershipReviewStatus: null,
      managementAccessStatus: null,
      fulfillmentStatus: null,
      onboardingStatus: null,
    }),
    seller: unresolvedLane({
      directSellerIds: [],
      productLinkedSellerIds: [],
      stripeAccountIds: [],
      publishedProductCount: 0,
      totalProductCount: 0,
      payoutReadySellerCount: 0,
      linkageSource: "none",
    }),
    commerce: unresolvedLane({
      linkedProductCount: 0,
      linkedOrderCount: 0,
      linkedPaymentCount: 0,
      productLinkedOrderCount: 0,
      productLinkedPaymentCount: 0,
      paymentSessionIds: [],
      orderIds: [],
      sellerIds: [],
    }),
    advertising: unresolvedLane({
      advertisingRequestCount: 0,
      adPurchaseCount: 0,
      sponsorScheduleCount: 0,
      directoryListingCount: 0,
      campaignIds: [],
    }),
    jobs: unresolvedLane({
      linkedJobCount: 0,
      linkedEmployerCount: 0,
      unresolvedReason: null,
    }),
    support: unresolvedLane({
      ticketCount: 0,
      openTicketCount: 0,
      ticketIds: [],
      categories: [],
    }),
    activity: unresolvedLane({
      flowEventCount: 0,
      searchEventCount: 0,
      recentEventTypes: [],
    }),
    organization: unresolvedLane({
      relationship: "UNRESOLVED",
      organizationId: null,
      organizationSlug: null,
    }),
  };
}

export function normalizeBusiness360Sections(
  sections?: Business360Section[],
): Business360Section[] {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [...ALL_BUSINESS360_SECTIONS];
  }

  const allowed = new Set(ALL_BUSINESS360_SECTIONS);
  return uniq([
    "identity",
    ...sections.filter((section): section is Business360Section =>
      allowed.has(section),
    ),
  ]) as Business360Section[];
}

export async function resolveBusiness360(
  db: Db,
  input: ResolveBusiness360Options,
): Promise<Business360Result> {
  const startedAt = Date.now();
  const businessId = s(input.businessId);
  const sectionsRequested = normalizeBusiness360Sections(input.sections);
  const requestedSet = new Set(sectionsRequested);
  const metrics = defaultMetrics(sectionsRequested);

  if (!businessId) {
    metrics.latencyMs = Date.now() - startedAt;
    return {
      ok: false,
      code: "MISSING_BUSINESS_ID",
      message: "Business identifier is required.",
      metrics,
    };
  }

  const result = baseEmptyResult(metrics, businessId);

  const business = await findOneTracked(
    db,
    metrics,
    "identity",
    "businesses",
    businessIdFilter("_id", businessId),
  );

  if (!business) {
    metrics.latencyMs = Date.now() - startedAt;
    return {
      ok: false,
      code: "BUSINESS_NOT_FOUND",
      message: "Business not found.",
      metrics,
    };
  }

  const canonicalBusinessId = toId((business as any)._id) || businessId;
  const businessName =
    s((business as any).businessName) ||
    s((business as any).business_name) ||
    s((business as any).name) ||
    "Business";
  const alias = s((business as any).alias) || null;
  const slug = s((business as any).slug) || null;
  const publicRouteIdentity = alias || slug;
  const publicRoute = publicRouteIdentity
    ? `/business/${encodeURIComponent(publicRouteIdentity)}`
    : null;

  result.identity = {
    state: "LINKED",
    provenance: [
      {
        kind: "DIRECT_BUSINESS_ID",
        source: "businesses._id",
        authoritative: true,
      },
    ],
    data: {
      businessId: canonicalBusinessId,
      name: businessName,
      alias,
      slug,
      status: s((business as any).status) || null,
      publicRoute,
      directoryStatus: s((business as any).publicListingStatus) || null,
    },
  };
  metrics.sectionsResolved.push("identity");

  let directProducts: any[] = [];
  let directSellers: any[] = [];
  let productLinkedSellerCandidates: any[] = [];

  if (shouldResolve(requestedSet, "directory")) {
    const listings = await findManyTracked(
      db,
      metrics,
      "directory",
      "directory_listings",
      {
        $or: [
          businessIdFilter("businessIdReal", canonicalBusinessId),
          businessIdFilter("businessId", canonicalBusinessId),
        ],
      },
      { sort: { updatedAt: -1, createdAt: -1 }, limit: 25 },
    );

    result.directory = {
      state: listings.length ? "LINKED" : "NOT_LINKED",
      provenance: [
        {
          kind: "DIRECT_BUSINESS_ID",
          source: "businesses._id",
          authoritative: true,
        },
        ...(listings.length
          ? [
              {
                kind: "DIRECT_BUSINESS_ID" as const,
                source: "directory_listings.businessId",
                authoritative: false,
              },
            ]
          : []),
      ],
      data: {
        anchorCollection: "businesses",
        paidListingCount: listings.length,
        latestListingId: listings[0]?._id ? toId(listings[0]._id) : null,
        latestListingStatus: s(listings[0]?.status) || null,
        listingTier: s(listings[0]?.tier) || null,
      },
    };
    metrics.sectionsResolved.push("directory");
  }

  if (shouldResolve(requestedSet, "ownership")) {
    const [claims, reviews] = await Promise.all([
      findManyTracked(
        db,
        metrics,
        "ownership",
        "business_claims",
        businessIdFilter("businessId", canonicalBusinessId),
        { sort: { updatedAt: -1, createdAt: -1 }, limit: 50 },
      ),
      findManyTracked(
        db,
        metrics,
        "ownership",
        "ownership_reviews",
        businessIdFilter("businessId", canonicalBusinessId),
        { sort: { updatedAt: -1, createdAt: -1 }, limit: 50 },
      ),
    ]);

    const representativeUserIds = uniq([
      toId((business as any).claimedByUserId),
      toId((business as any).managedByUserId),
      ...(Array.isArray((business as any).ownerUserIds)
        ? (business as any).ownerUserIds
        : []
      ).map((value: unknown) => toId(value)),
      ...claims.map((claim) => toId((claim as any).userId)),
      ...reviews.map((review) => toId((review as any).userId)),
    ]);

    const representativeEmails = uniq(
      claims.map((claim) => s((claim as any).claimantEmail)).filter(Boolean),
    );

    const verifiedRepresentativeUserIds = uniq([
      ...claims
        .filter((claim) =>
          ["ownership_verified", "verified"].includes(
            s((claim as any).claimStatus).toLowerCase(),
          ),
        )
        .map((claim) => toId((claim as any).userId)),
      ...reviews
        .filter((review) =>
          ["ownership_verified", "verified"].includes(
            s((review as any).reviewStatus).toLowerCase(),
          ),
        )
        .map((review) => toId((review as any).userId)),
    ]);

    const claimState =
      s((business as any).claimStage) || s(claims[0]?.claimStatus) || null;
    const ownershipReviewState =
      s((business as any).ownershipReviewStatus) ||
      s(reviews[0]?.reviewStatus) ||
      null;

    result.ownership = {
      state:
        representativeUserIds.length || claims.length || reviews.length
          ? "LINKED"
          : "NOT_LINKED",
      provenance: [
        {
          kind:
            verifiedRepresentativeUserIds.length > 0
              ? "VERIFIED"
              : "DIRECT_BUSINESS_ID",
          source: "business_claims + ownership_reviews + businesses",
          authoritative: verifiedRepresentativeUserIds.length > 0,
        },
      ],
      data: {
        representativeUserIds,
        representativeEmails,
        verifiedRepresentativeUserIds,
        claimState,
        ownershipReviewState,
        claimCount: claims.length,
        reviewCount: reviews.length,
        claimIds: claims
          .map((claim) => toId((claim as any)._id))
          .filter(Boolean),
        reviewIds: reviews
          .map((review) => toId((review as any)._id))
          .filter(Boolean),
      },
    };
    metrics.sectionsResolved.push("ownership");
  }

  if (shouldResolve(requestedSet, "membership")) {
    const memberships = await findManyTracked(
      db,
      metrics,
      "membership",
      "business_memberships",
      businessIdFilter("businessId", canonicalBusinessId),
      { sort: { updatedAt: -1, createdAt: -1 }, limit: 25 },
    );

    const latestMembership = memberships[0] || null;
    let fulfillment: any = null;
    let onboarding: any = null;
    if (latestMembership?.membershipId) {
      [fulfillment, onboarding] = await Promise.all([
        findOneTracked(db, metrics, "membership", "membership_fulfillment", {
          membershipId: latestMembership.membershipId,
        }),
        findOneTracked(db, metrics, "membership", "membership_onboarding", {
          membershipId: latestMembership.membershipId,
        }),
      ]);
    }

    result.membership = {
      state: memberships.length ? "LINKED" : "NOT_LINKED",
      provenance: memberships.length
        ? [
            {
              kind: "MEMBERSHIP_LINKED",
              source: "business_memberships.businessId",
              authoritative: true,
            },
          ]
        : [
            {
              kind: "UNKNOWN",
              source: "no_membership_record",
              authoritative: false,
            },
          ],
      data: {
        membershipIds: memberships
          .map((membership) => s((membership as any).membershipId))
          .filter(Boolean),
        latestMembershipId: s((latestMembership as any)?.membershipId) || null,
        membershipStatus:
          s((latestMembership as any)?.membershipStatus) || null,
        ownershipReviewStatus:
          s((latestMembership as any)?.ownershipReviewStatus) || null,
        managementAccessStatus:
          s((latestMembership as any)?.managementAccessStatus) || null,
        fulfillmentStatus: s((fulfillment as any)?.fulfillmentStatus) || null,
        onboardingStatus: s((onboarding as any)?.onboardingStatus) || null,
      },
    };
    metrics.sectionsResolved.push("membership");
  }

  if (
    shouldResolve(requestedSet, "seller") ||
    shouldResolve(requestedSet, "commerce")
  ) {
    const directSellerFilter = {
      $or: [
        businessIdFilter("businessId", canonicalBusinessId),
        businessIdFilter("business_id", canonicalBusinessId),
      ],
    };
    const directProductFilter = {
      $or: [
        businessIdFilter("businessId", canonicalBusinessId),
        businessIdFilter("business_id", canonicalBusinessId),
      ],
    };

    [directSellers, directProducts] = await Promise.all([
      findManyTracked(
        db,
        metrics,
        shouldResolve(requestedSet, "seller") ? "seller" : "commerce",
        "sellers",
        directSellerFilter,
        { sort: { updatedAt: -1, createdAt: -1 }, limit: 100 },
      ),
      findManyTracked(
        db,
        metrics,
        shouldResolve(requestedSet, "commerce") ? "commerce" : "seller",
        "products",
        directProductFilter,
        { sort: { updatedAt: -1, createdAt: -1 }, limit: 200 },
      ),
    ]);

    const sellerIdsFromProducts = uniq(
      directProducts.map((product) => toId((product as any).sellerId)),
    );
    const missingSellerIds = sellerIdsFromProducts.filter(
      (sellerId) =>
        !directSellers.some((seller) => toId((seller as any)._id) === sellerId),
    );

    if (missingSellerIds.length) {
      const objectSellerIds = missingSellerIds
        .filter((id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id)
        .map((id) => new ObjectId(id));

      productLinkedSellerCandidates = await findManyTracked(
        db,
        metrics,
        shouldResolve(requestedSet, "seller") ? "seller" : "commerce",
        "sellers",
        {
          $or: [
            { _id: { $in: missingSellerIds } },
            { _id: { $in: objectSellerIds } },
          ],
        },
        { limit: missingSellerIds.length || 25 },
      );
    }
  }

  if (shouldResolve(requestedSet, "seller")) {
    const publishedProductCount = directProducts.filter((product) => {
      const status = s((product as any).status).toLowerCase();
      return status === "active" && (product as any).isPublished !== false;
    }).length;

    const productLinkedSellerIds = uniq(
      productLinkedSellerCandidates
        .filter((seller) => {
          const sellerId = toId((seller as any)._id);
          return directProducts.some((product) => {
            if (toId((product as any).sellerId) !== sellerId) return false;
            const attribution = resolveCanonicalMarketplaceBusinessId({
              product,
              seller,
            });
            return (
              attribution.deterministic &&
              attribution.businessId === canonicalBusinessId
            );
          });
        })
        .map((seller) => toId((seller as any)._id)),
    );

    const stripeAccountIds = uniq([
      ...directSellers.map((seller) => s((seller as any).stripeAccountId)),
      ...productLinkedSellerCandidates.map((seller) =>
        s((seller as any).stripeAccountId),
      ),
    ]);

    const payoutReadySellerCount = uniq(
      [...directSellers, ...productLinkedSellerCandidates]
        .filter((seller) => Boolean(s((seller as any)?.stripeAccountId)))
        .map((seller) => toId((seller as any)._id)),
    ).length;

    let sellerState: Business360RelationshipState = "NOT_LINKED";
    let linkageSource: Business360SellerData["linkageSource"] = "none";
    if (directSellers.length && directProducts.length) {
      sellerState = "LINKED";
      linkageSource = "seller_and_product";
    } else if (directSellers.length) {
      sellerState = "LINKED";
      linkageSource = "seller.businessId";
    } else if (productLinkedSellerIds.length || directProducts.length) {
      sellerState = "PARTIALLY_LINKED";
      linkageSource = "product.businessId";
    }

    result.seller = {
      state: sellerState,
      provenance: [
        ...(directSellers.length
          ? [
              {
                kind: "SELLER_LINKED" as const,
                source: "sellers.businessId",
                authoritative: false,
              },
            ]
          : []),
        ...((productLinkedSellerIds.length || directProducts.length) &&
        !directSellers.length
          ? [
              {
                kind: "DIRECT_BUSINESS_ID" as const,
                source:
                  "products.businessId + resolveCanonicalMarketplaceBusinessId",
                authoritative: false,
              },
            ]
          : []),
        ...(!directSellers.length && !directProducts.length
          ? [
              {
                kind: "UNKNOWN" as const,
                source: "no_seller_overlay",
                authoritative: false,
              },
            ]
          : []),
      ],
      data: {
        directSellerIds: directSellers
          .map((seller) => toId((seller as any)._id))
          .filter(Boolean),
        productLinkedSellerIds,
        stripeAccountIds,
        publishedProductCount,
        totalProductCount: directProducts.length,
        payoutReadySellerCount,
        linkageSource,
      },
    };
    metrics.sectionsResolved.push("seller");
  }

  if (shouldResolve(requestedSet, "commerce")) {
    const directOrders = await findManyTracked(
      db,
      metrics,
      "commerce",
      "orders",
      {
        $or: [
          businessIdFilter("businessId", canonicalBusinessId),
          businessIdFilter("business_id", canonicalBusinessId),
        ],
      },
      { sort: { createdAt: -1 }, limit: 100 },
    );

    const directPayments = await findManyTracked(
      db,
      metrics,
      "commerce",
      "payments",
      {
        $or: [
          businessIdFilter("businessId", canonicalBusinessId),
          { "metadata.businessId": canonicalBusinessId },
        ],
      },
      { sort: { createdAt: -1 }, limit: 100 },
    );

    let productLinkedOrders: any[] = [];
    let productLinkedPayments: any[] = [];
    const directProductIds = uniq(
      directProducts.map((product) => toId((product as any)._id)),
    );
    if (directProductIds.length) {
      productLinkedOrders = await findManyTracked(
        db,
        metrics,
        "commerce",
        "orders",
        {
          $or: [
            { productId: { $in: directProductIds } },
            {
              productId: {
                $in: directProductIds
                  .filter(
                    (id) =>
                      ObjectId.isValid(id) && String(new ObjectId(id)) === id,
                  )
                  .map((id) => new ObjectId(id)),
              },
            },
          ],
        },
        { sort: { createdAt: -1 }, limit: 100 },
      );
      productLinkedPayments = await findManyTracked(
        db,
        metrics,
        "commerce",
        "payments",
        productIdFilter(directProductIds),
        { sort: { createdAt: -1 }, limit: 100 },
      );
    }

    const uniqueOrders = uniq([
      ...directOrders.map((order) => toId((order as any)._id)),
      ...productLinkedOrders.map((order) => toId((order as any)._id)),
    ]);

    const uniquePayments = uniq([
      ...directPayments.map((payment) => s((payment as any).stripeSessionId)),
      ...productLinkedPayments.map((payment) =>
        s((payment as any).stripeSessionId),
      ),
    ]);

    result.commerce = {
      state:
        directProducts.length || directOrders.length || directPayments.length
          ? "LINKED"
          : productLinkedOrders.length || productLinkedPayments.length
            ? "PARTIALLY_LINKED"
            : "NOT_LINKED",
      provenance: [
        ...(directProducts.length
          ? [
              {
                kind: "DIRECT_BUSINESS_ID" as const,
                source: "products.businessId",
                authoritative: false,
              },
            ]
          : []),
        ...(directOrders.length || directPayments.length
          ? [
              {
                kind: "PAYMENT_LINKED" as const,
                source: "orders.businessId + payments.businessId",
                authoritative: false,
              },
            ]
          : []),
        ...(productLinkedOrders.length || productLinkedPayments.length
          ? [
              {
                kind: "DIRECT_BUSINESS_ID" as const,
                source: "product-linked commerce via products.businessId",
                authoritative: false,
              },
            ]
          : []),
        ...(!directProducts.length &&
        !directOrders.length &&
        !directPayments.length &&
        !productLinkedOrders.length &&
        !productLinkedPayments.length
          ? [
              {
                kind: "UNKNOWN" as const,
                source: "no_commerce_overlay",
                authoritative: false,
              },
            ]
          : []),
      ],
      data: {
        linkedProductCount: directProducts.length,
        linkedOrderCount: directOrders.length,
        linkedPaymentCount: directPayments.length,
        productLinkedOrderCount: productLinkedOrders.filter(
          (order) =>
            !directOrders.some(
              (direct) =>
                toId((direct as any)._id) === toId((order as any)._id),
            ),
        ).length,
        productLinkedPaymentCount: productLinkedPayments.filter(
          (payment) =>
            !directPayments.some(
              (direct) =>
                s((direct as any).stripeSessionId) ===
                s((payment as any).stripeSessionId),
            ),
        ).length,
        paymentSessionIds: uniquePayments,
        orderIds: uniqueOrders,
        sellerIds: uniq([
          ...directProducts.map((product) => toId((product as any).sellerId)),
          ...directOrders.map((order) => toId((order as any).sellerId)),
          ...directPayments.map((payment) => toId((payment as any).sellerId)),
        ]),
      },
    };
    metrics.sectionsResolved.push("commerce");
  }

  if (shouldResolve(requestedSet, "advertising")) {
    const [
      advertisingRequests,
      adPurchases,
      sponsorSchedule,
      directoryListings,
    ] = await Promise.all([
      findManyTracked(
        db,
        metrics,
        "advertising",
        "advertising_requests",
        businessIdFilter("businessId", canonicalBusinessId),
        { sort: { createdAt: -1 }, limit: 100 },
      ),
      findManyTracked(
        db,
        metrics,
        "advertising",
        "ad_purchases",
        businessIdFilter("businessId", canonicalBusinessId),
        { sort: { createdAt: -1 }, limit: 100 },
      ),
      findManyTracked(
        db,
        metrics,
        "advertising",
        "featured_sponsor_schedule",
        businessIdFilter("businessId", canonicalBusinessId),
        { sort: { weekStart: -1 }, limit: 100 },
      ),
      findManyTracked(
        db,
        metrics,
        "advertising",
        "directory_listings",
        {
          $or: [
            businessIdFilter("businessId", canonicalBusinessId),
            businessIdFilter("businessIdReal", canonicalBusinessId),
          ],
        },
        { sort: { createdAt: -1 }, limit: 100 },
      ),
    ]);

    result.advertising = {
      state:
        advertisingRequests.length ||
        adPurchases.length ||
        sponsorSchedule.length ||
        directoryListings.length
          ? "LINKED"
          : "NOT_LINKED",
      provenance:
        advertisingRequests.length ||
        adPurchases.length ||
        sponsorSchedule.length ||
        directoryListings.length
          ? [
              {
                kind: "DIRECT_BUSINESS_ID",
                source:
                  "advertising_requests.businessId + ad_purchases.businessId + featured_sponsor_schedule.businessId",
                authoritative: false,
              },
            ]
          : [
              {
                kind: "UNKNOWN",
                source: "no_advertising_overlay",
                authoritative: false,
              },
            ],
      data: {
        advertisingRequestCount: advertisingRequests.length,
        adPurchaseCount: adPurchases.length,
        sponsorScheduleCount: sponsorSchedule.length,
        directoryListingCount: directoryListings.length,
        campaignIds: uniq([
          ...advertisingRequests.map((row) => toId((row as any)._id)),
          ...adPurchases.map((row) => s((row as any).campaignId)),
          ...sponsorSchedule.map((row) => s((row as any).campaignId)),
        ]),
      },
    };
    metrics.sectionsResolved.push("advertising");
  }

  if (shouldResolve(requestedSet, "jobs")) {
    const [jobs, employers] = await Promise.all([
      findManyTracked(
        db,
        metrics,
        "jobs",
        "jobs",
        {
          $or: [
            businessIdFilter("businessId", canonicalBusinessId),
            businessIdFilter("business_id", canonicalBusinessId),
          ],
        },
        { sort: { createdAt: -1 }, limit: 100 },
      ),
      findManyTracked(
        db,
        metrics,
        "jobs",
        "employers",
        {
          $or: [
            businessIdFilter("businessId", canonicalBusinessId),
            businessIdFilter("business_id", canonicalBusinessId),
          ],
        },
        { sort: { createdAt: -1 }, limit: 100 },
      ),
    ]);

    result.jobs = {
      state: jobs.length || employers.length ? "LINKED" : "NOT_LINKED",
      provenance:
        jobs.length || employers.length
          ? [
              {
                kind: "DIRECT_BUSINESS_ID",
                source: "jobs.businessId + employers.businessId",
                authoritative: false,
              },
            ]
          : [
              {
                kind: "UNKNOWN",
                source: "no_direct_jobs_business_link",
                authoritative: false,
                note: "Business360 does not promote company text or employer email into a business relationship.",
              },
            ],
      data: {
        linkedJobCount: jobs.length,
        linkedEmployerCount: employers.length,
        unresolvedReason:
          jobs.length || employers.length
            ? null
            : "No direct businessId-based jobs/employer relationship was found.",
      },
    };
    metrics.sectionsResolved.push("jobs");
  }

  if (shouldResolve(requestedSet, "support")) {
    const tickets = await findManyTracked(
      db,
      metrics,
      "support",
      "support_tickets",
      { relatedBusinessId: canonicalBusinessId },
      { sort: { updatedAt: -1, createdAt: -1 }, limit: 100 },
    );

    result.support = {
      state: tickets.length ? "LINKED" : "NOT_LINKED",
      provenance: tickets.length
        ? [
            {
              kind: "DIRECT_BUSINESS_ID",
              source: "support_tickets.relatedBusinessId",
              authoritative: false,
            },
          ]
        : [
            {
              kind: "UNKNOWN",
              source: "no_support_overlay",
              authoritative: false,
            },
          ],
      data: {
        ticketCount: tickets.length,
        openTicketCount: tickets.filter((ticket) =>
          isOpenSupportStatus(s((ticket as any).status)),
        ).length,
        ticketIds: tickets
          .map(
            (ticket) =>
              s((ticket as any).ticketId) || toId((ticket as any)._id),
          )
          .filter(Boolean),
        categories: uniq(
          tickets.map((ticket) => s((ticket as any).category)).filter(Boolean),
        ),
      },
    };
    metrics.sectionsResolved.push("support");
  }

  if (shouldResolve(requestedSet, "activity")) {
    const activity = await resolveBusinessActivity360(db, metrics, {
      businessId: canonicalBusinessId,
    });

    result.activity = {
      state: activity.state,
      provenance: activity.provenance.length
        ? activity.provenance.map((entry) => ({
            kind:
              entry.source === "search_quality_events.selectedBusinessId" ||
              entry.source === "flow_events.businessId"
                ? ("DIRECT_BUSINESS_ID" as const)
                : ("UNKNOWN" as const),
            source: entry.source,
            authoritative: entry.authoritative,
            note: entry.note || null,
          }))
        : [
            {
              kind: "UNKNOWN",
              source: "no_activity_overlay",
              authoritative: false,
            },
          ],
      data: {
        flowEventCount: activity.flowEventCount,
        searchEventCount: activity.searchEventCount,
        recentEventTypes: activity.recentEventTypes,
      },
    };
    metrics.sectionsResolved.push("activity");
  }

  if (shouldResolve(requestedSet, "organization")) {
    const organizationId = s((business as any).organizationId) || null;
    const organizationSlug = s((business as any).organizationSlug) || null;
    let organizationDoc: any = null;
    if (organizationId) {
      organizationDoc = await findOneTracked(
        db,
        metrics,
        "organization",
        "organizations",
        buildObjectIdOrStringFilter("_id", organizationId) || {
          _id: organizationId as any,
        },
      );
    } else if (organizationSlug) {
      organizationDoc = await findOneTracked(
        db,
        metrics,
        "organization",
        "organizations",
        { slug: organizationSlug },
      );
    }

    const relationship = organizationDoc
      ? "PROVEN"
      : organizationId || organizationSlug
        ? "UNRESOLVED"
        : "NONE";

    result.organization = {
      state:
        relationship === "PROVEN"
          ? "LINKED"
          : relationship === "UNRESOLVED"
            ? "PARTIALLY_LINKED"
            : "NOT_APPLICABLE",
      provenance: [
        relationship === "PROVEN"
          ? {
              kind: "DIRECT_BUSINESS_ID" as const,
              source: "businesses.organizationId|organizationSlug",
              authoritative: false,
            }
          : {
              kind: "UNKNOWN" as const,
              source: "organizations_not_merged",
              authoritative: false,
            },
      ],
      data: {
        relationship,
        organizationId:
          organizationDoc && organizationDoc._id
            ? toId(organizationDoc._id)
            : organizationId,
        organizationSlug:
          s((organizationDoc as any)?.slug) || organizationSlug || null,
      },
    };
    metrics.sectionsResolved.push("organization");
  }

  metrics.latencyMs = Date.now() - startedAt;
  return result;
}
