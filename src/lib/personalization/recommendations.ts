// src/lib/personalization/recommendations.ts
//
// P4-07 Recommendations.
//
// Recommendations are derived strictly from real signals already captured
// by the platform: a person's own flow_events (page views / CTA clicks) and
// verified purchases (bmev_records), used to find the categories they have
// shown interest in, then matched against real, publicly-visible businesses
// and products in those categories (excluding items already interacted
// with). When a person has no personal signal yet, we fall back to a
// transparent "trending" pool computed from real site-wide activity in the
// last 30 days -- never a fabricated or hand-picked list -- and label it
// honestly as such rather than claiming it is personalized.

import { ObjectId, type Db } from "mongodb";
import { publicBusinessBaseQuery } from "@/lib/directory/publicBusinessQuery";
import { buildPublicMarketplaceVisibilityFilter } from "@/lib/marketplace/publicCatalog";

export type RecommendationBasis = "PERSONAL_ACTIVITY" | "TRENDING" | "NONE";

export type RecommendedBusiness = {
  businessId: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  image: string | null;
  verified: boolean;
  url: string;
};

export type RecommendedProduct = {
  productId: string;
  name: string;
  category: string | null;
  price: number | null;
  image: string | null;
  url: string;
};

export type RecommendationsResult = {
  state: "PERSONALIZED" | "TRENDING_FALLBACK" | "INSUFFICIENT_DATA";
  basis: RecommendationBasis;
  categoriesUsed: string[];
  businesses: RecommendedBusiness[];
  products: RecommendedProduct[];
  provenance: { source: string; authoritative: boolean }[];
};

function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function toId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof ObjectId) return value.toString();
  return "";
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function businessDoc(doc: any): RecommendedBusiness {
  const name =
    s(doc.business_name) || s(doc.businessName) || s(doc.name) || "Business";
  const routeId = s(doc.alias) || s(doc.slug) || toId(doc._id);
  return {
    businessId: toId(doc._id),
    name,
    category: s(doc.display_categories) || s(doc.category) || null,
    city: s(doc.city) || null,
    state: s(doc.state) || null,
    image: s(doc.image) || null,
    // Verification-field drift fix (2026-09-07): `verified` is canonical;
    // isVerified is a deprecated mirror, no longer read independently.
    verified: Boolean(doc.verified),
    url: `/business/${encodeURIComponent(routeId)}`,
  };
}

function productDoc(doc: any): RecommendedProduct {
  const routeId = s(doc.slug) || toId(doc._id);
  return {
    productId: toId(doc._id),
    name: s(doc.name) || s(doc.title) || "Product",
    category: s(doc.category) || null,
    price: typeof doc.price === "number" ? doc.price : null,
    image: s(doc.imageUrl) || null,
    url: `/marketplace/product/${encodeURIComponent(routeId)}`,
  };
}

async function categoriesForBusinessIds(db: Db, businessIds: string[]) {
  if (!businessIds.length) return [];
  const objectIds = businessIds.filter((id) => ObjectId.isValid(id));
  const docs = await db
    .collection("businesses")
    .find(
      { _id: { $in: objectIds.map((id) => new ObjectId(id)) } },
      { projection: { category: 1, display_categories: 1 } },
    )
    .toArray();
  return uniq(
    docs.flatMap((doc: any) => [s(doc.category), s(doc.display_categories)]),
  );
}

async function categoriesForProductIds(db: Db, productIds: string[]) {
  if (!productIds.length) return [];
  const objectIds = productIds.filter((id) => ObjectId.isValid(id));
  const docs = await db
    .collection("products")
    .find(
      { _id: { $in: objectIds.map((id) => new ObjectId(id)) } },
      { projection: { category: 1 } },
    )
    .toArray();
  return uniq(docs.map((doc: any) => s(doc.category)));
}

async function trendingBusinesses(db: Db, excludeIds: string[], limit: number) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const agg = await db
    .collection("flow_events")
    .aggregate([
      {
        $match: {
          businessId: { $ne: null, $nin: excludeIds },
          createdAt: { $gte: since },
        },
      },
      { $group: { _id: "$businessId", hits: { $sum: 1 } } },
      { $sort: { hits: -1 } },
      { $limit: limit * 2 },
    ])
    .toArray();

  const ids = agg
    .map((row: any) => String(row._id))
    .filter((id) => ObjectId.isValid(id));
  if (!ids.length) return [];

  const docs = await db
    .collection("businesses")
    .find({
      $and: [
        publicBusinessBaseQuery(),
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
      ],
    })
    .limit(limit)
    .toArray();

  return docs.map(businessDoc);
}

export async function resolveRecommendations(
  db: Db,
  input: { userId: string; limit?: number },
): Promise<RecommendationsResult> {
  const userId = s(input.userId);
  const limit = Math.max(1, Math.min(20, Number(input.limit || 8)));

  if (!userId) {
    return {
      state: "INSUFFICIENT_DATA",
      basis: "NONE",
      categoriesUsed: [],
      businesses: [],
      products: [],
      provenance: [{ source: "missing_user_id", authoritative: false }],
    };
  }

  const [recentEvents, purchases] = await Promise.all([
    db
      .collection("flow_events")
      .find({ userId }, { sort: { createdAt: -1 }, limit: 150 })
      .toArray(),
    db
      .collection("bmev_records")
      .find(
        { buyerUserId: userId, paymentVerified: true },
        { sort: { occurredAt: -1 }, limit: 100 },
      )
      .toArray(),
  ]);

  const seedBusinessIds = uniq([
    ...recentEvents.map((e: any) => s(e.businessId)),
    ...purchases.map((p: any) => s(p.businessId)),
  ]);
  const seedProductIds = uniq([
    ...recentEvents.map((e: any) => s(e.productId)),
    ...purchases.map((p: any) => s(p.productId)),
  ]);
  const directCategoryHints = uniq(recentEvents.map((e: any) => s(e.category)));

  const [businessCategories, productCategories] = await Promise.all([
    categoriesForBusinessIds(db, seedBusinessIds),
    categoriesForProductIds(db, seedProductIds),
  ]);

  const categoriesUsed = uniq([
    ...directCategoryHints,
    ...businessCategories,
    ...productCategories,
  ]);

  if (!categoriesUsed.length) {
    const trending = await trendingBusinesses(db, seedBusinessIds, limit);
    if (!trending.length) {
      return {
        state: "INSUFFICIENT_DATA",
        basis: "NONE",
        categoriesUsed: [],
        businesses: [],
        products: [],
        provenance: [
          {
            source: "no_personal_or_sitewide_activity",
            authoritative: false,
          },
        ],
      };
    }
    return {
      state: "TRENDING_FALLBACK",
      basis: "TRENDING",
      categoriesUsed: [],
      businesses: trending,
      products: [],
      provenance: [
        {
          source: "flow_events.businessId (30d sitewide)",
          authoritative: false,
        },
      ],
    };
  }

  const categoryRegexes = categoriesUsed.map(
    (c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  );

  const [businessDocs, productDocs] = await Promise.all([
    db
      .collection("businesses")
      .find({
        $and: [
          publicBusinessBaseQuery(),
          {
            $or: [
              { category: { $in: categoryRegexes } },
              { display_categories: { $in: categoryRegexes } },
            ],
          },
          {
            _id: {
              $nin: seedBusinessIds
                .filter((id) => ObjectId.isValid(id))
                .map((id) => new ObjectId(id)),
            },
          },
        ],
      })
      .limit(limit)
      .toArray(),
    db
      .collection("products")
      .find({
        $and: [
          buildPublicMarketplaceVisibilityFilter(),
          { category: { $in: categoryRegexes } },
          {
            _id: {
              $nin: seedProductIds
                .filter((id) => ObjectId.isValid(id))
                .map((id) => new ObjectId(id)),
            },
          },
        ],
      })
      .limit(limit)
      .toArray(),
  ]);

  const businesses = businessDocs.map(businessDoc);
  const products = productDocs.map(productDoc);

  if (!businesses.length && !products.length) {
    const trending = await trendingBusinesses(db, seedBusinessIds, limit);
    return {
      state: trending.length ? "TRENDING_FALLBACK" : "INSUFFICIENT_DATA",
      basis: trending.length ? "TRENDING" : "NONE",
      categoriesUsed,
      businesses: trending,
      products: [],
      provenance: [
        {
          source: "no_public_matches_in_interest_categories",
          authoritative: false,
        },
      ],
    };
  }

  return {
    state: "PERSONALIZED",
    basis: "PERSONAL_ACTIVITY",
    categoriesUsed,
    businesses,
    products,
    provenance: [
      { source: "flow_events.userId", authoritative: true },
      { source: "bmev_records.buyerUserId", authoritative: true },
    ],
  };
}
