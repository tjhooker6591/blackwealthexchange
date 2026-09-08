// src/lib/economicImpact/communityEconomicActivity.ts
//
// Phase 6 -- Community Economic Activity. A platform-wide aggregate over
// the same canonical `bmev_records` ledger used by every other economic
// resolver in this directory -- distinct buyers, distinct businesses
// supported, and total verified economic activity. This is the number
// safe to describe publicly as "economic activity BWE has verifiably
// moved toward Black-owned businesses," since bmevAmountCents is the
// merchandise subtotal paid to the business, not BWE's own revenue.

import type { Db } from "mongodb";
import {
  measured,
  estimated,
  insufficientData,
  type EconomicMetric,
} from "./shared";

export type CommunityEconomicActivityResult = {
  metrics: EconomicMetric[];
};

export async function resolveCommunityEconomicActivity(
  db: Db,
): Promise<CommunityEconomicActivityResult> {
  const [agg, distinctBuyers, distinctBusinesses] = await Promise.all([
    db
      .collection("bmev_records")
      .aggregate([
        { $match: { paymentVerified: true } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalCents: { $sum: { $ifNull: ["$bmevAmountCents", 0] } },
          },
        },
      ])
      .toArray(),
    db.collection("bmev_records").distinct("buyerUserId", {
      paymentVerified: true,
      buyerUserId: { $ne: null },
    }),
    db.collection("bmev_records").distinct("businessId", {
      paymentVerified: true,
      businessId: { $ne: null },
    }),
  ]);

  const count = Number(agg[0]?.count || 0);
  const totalCents = Number(agg[0]?.totalCents || 0);
  const buyerCount = distinctBuyers.filter(Boolean).length;
  const businessCount = distinctBusinesses.filter(Boolean).length;

  return {
    metrics: [
      measured(
        "community_verified_transaction_count",
        "Verified transactions across BWE",
        count,
        "count",
        ["bmev_records"],
      ),
      measured(
        "community_verified_economic_activity_cents",
        "Verified economic activity moved to Black-owned businesses",
        totalCents,
        "usd_cents",
        ["bmev_records"],
        "Sum of merchandise-subtotal (bmevAmountCents) across every payment-verified transaction -- the amount paid to the business, not BWE's own revenue.",
      ),
      measured(
        "community_distinct_buyers",
        "Distinct BWE members who completed a verified purchase",
        buyerCount,
        "count",
        ["bmev_records"],
      ),
      measured(
        "community_businesses_supported",
        "Distinct businesses with at least one verified sale",
        businessCount,
        "count",
        ["bmev_records"],
      ),
      count > 0
        ? estimated(
            "community_average_transaction_cents",
            "Average verified transaction value",
            Math.round(totalCents / count),
            "usd_cents",
            ["bmev_records"],
            "community_verified_economic_activity_cents / community_verified_transaction_count",
          )
        : insufficientData(
            "community_average_transaction_cents",
            "Average verified transaction value",
            "No verified transactions exist yet.",
          ),
    ],
  };
}
