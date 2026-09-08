// src/lib/personalization/creatorExperience.ts
//
// P4-06 Creator Experience.
//
// Real seller/creator performance: verified revenue and buyer engagement
// per product, sourced from the sellers/products collections plus the
// bmev_records ledger (keyed by sellerId, already populated at checkout)
// and flow_events product-view counts. Payout/onboarding readiness is
// intentionally left to the existing /api/marketplace/readiness endpoint
// already used by the creator dashboard -- this module adds the
// performance layer on top rather than duplicating that state.

import { ObjectId, type Db } from "mongodb";

export type CreatorProductPerformance = {
  productId: string;
  name: string;
  published: boolean;
  views: number;
  verifiedRevenueCents: number;
  unitsSold: number;
};

export type CreatorExperienceResult = {
  state: "LINKED" | "NOT_LINKED";
  sellerIds: string[];
  totalProducts: number;
  publishedProducts: number;
  verifiedRevenueCents: number;
  transactionCount: number;
  latestTransactionAt: string | null;
  topProducts: CreatorProductPerformance[];
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

export async function resolveCreatorExperience(
  db: Db,
  input: { userId: string },
): Promise<CreatorExperienceResult> {
  const userId = s(input.userId);
  if (!userId) {
    return {
      state: "NOT_LINKED",
      sellerIds: [],
      totalProducts: 0,
      publishedProducts: 0,
      verifiedRevenueCents: 0,
      transactionCount: 0,
      latestTransactionAt: null,
      topProducts: [],
      provenance: [{ source: "missing_user_id", authoritative: false }],
    };
  }

  const sellers = await db
    .collection("sellers")
    .find({ userId }, { projection: { _id: 1 } })
    .toArray();
  const sellerIds = sellers.map((seller: any) => toId(seller._id));

  if (!sellerIds.length) {
    return {
      state: "NOT_LINKED",
      sellerIds: [],
      totalProducts: 0,
      publishedProducts: 0,
      verifiedRevenueCents: 0,
      transactionCount: 0,
      latestTransactionAt: null,
      topProducts: [],
      provenance: [
        { source: "sellers.userId (no profile)", authoritative: false },
      ],
    };
  }

  const [products, revenueRecords] = await Promise.all([
    db
      .collection("products")
      .find({ sellerId: { $in: sellerIds } })
      .project({ _id: 1, name: 1, title: 1, status: 1, isPublished: 1 })
      .toArray(),
    db
      .collection("bmev_records")
      .find(
        { sellerId: { $in: sellerIds }, paymentVerified: true },
        { sort: { occurredAt: -1 }, limit: 500 },
      )
      .toArray(),
  ]);

  const productIds = products.map((p: any) => toId(p._id));
  const viewEvents = productIds.length
    ? await db
        .collection("flow_events")
        .aggregate([
          {
            $match: {
              productId: { $in: productIds },
              eventType: "product_detail_viewed",
            },
          },
          { $group: { _id: "$productId", views: { $sum: 1 } } },
        ])
        .toArray()
    : [];
  const viewsByProduct = new Map<string, number>(
    viewEvents.map((row: any) => [String(row._id), row.views]),
  );

  const revenueByProduct = new Map<string, { cents: number; units: number }>();
  for (const record of revenueRecords) {
    const productId = s((record as any).productId);
    if (!productId) continue;
    const entry = revenueByProduct.get(productId) || { cents: 0, units: 0 };
    entry.cents += Number((record as any).bmevAmountCents) || 0;
    entry.units += 1;
    revenueByProduct.set(productId, entry);
  }

  const topProducts: CreatorProductPerformance[] = products
    .map((p: any) => {
      const id = toId(p._id);
      const rev = revenueByProduct.get(id) || { cents: 0, units: 0 };
      return {
        productId: id,
        name: s(p.name) || s(p.title) || "Product",
        published: p.isPublished !== false && s(p.status) !== "inactive",
        views: viewsByProduct.get(id) || 0,
        verifiedRevenueCents: rev.cents,
        unitsSold: rev.units,
      };
    })
    .sort(
      (a, b) =>
        b.verifiedRevenueCents - a.verifiedRevenueCents || b.views - a.views,
    )
    .slice(0, 8);

  return {
    state: "LINKED",
    sellerIds,
    totalProducts: products.length,
    publishedProducts: products.filter(
      (p: any) => p.isPublished !== false && s(p.status) !== "inactive",
    ).length,
    verifiedRevenueCents: revenueRecords.reduce(
      (sum, r: any) => sum + (Number(r.bmevAmountCents) || 0),
      0,
    ),
    transactionCount: revenueRecords.length,
    latestTransactionAt:
      revenueRecords
        .map((r: any) =>
          r.occurredAt instanceof Date
            ? r.occurredAt.toISOString()
            : s(r.occurredAt),
        )
        .filter(Boolean)
        .sort()
        .reverse()[0] || null,
    topProducts,
    provenance: [
      { source: "sellers.userId", authoritative: true },
      { source: "bmev_records.sellerId", authoritative: true },
      { source: "flow_events.productId", authoritative: false },
    ],
  };
}
