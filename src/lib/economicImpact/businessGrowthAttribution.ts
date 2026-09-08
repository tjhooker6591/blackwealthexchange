// src/lib/economicImpact/businessGrowthAttribution.ts
//
// Phase 6 -- Business Growth Attribution (platform-wide). Reuses the same
// verified-ownership and verified-revenue signals already computed per
// business by src/lib/personalization/businessGrowth.ts (Growth Command
// Center) and src/lib/business360.ts, rolled up to a platform total rather
// than re-deriving ownership or revenue logic.

import type { Db } from "mongodb";
import {
  measured,
  estimated,
  insufficientData,
  type EconomicMetric,
} from "./shared";

export type BusinessGrowthAttributionResult = {
  metrics: EconomicMetric[];
};

export async function resolveBusinessGrowthAttribution(
  db: Db,
): Promise<BusinessGrowthAttributionResult> {
  const [claimedCount, distinctSellingBusinessIds] = await Promise.all([
    db.collection("businesses").countDocuments({
      $or: [
        { claimStage: { $in: ["ownership_verified", "verified"] } },
        { ownershipReviewStatus: { $in: ["ownership_verified", "verified"] } },
      ],
    }),
    db.collection("bmev_records").distinct("businessId", {
      paymentVerified: true,
      businessId: { $ne: null },
    }),
  ]);

  const sellingBusinessCount =
    distinctSellingBusinessIds.filter(Boolean).length;
  const conversionRatio =
    claimedCount > 0
      ? Math.round((sellingBusinessCount / claimedCount) * 1000) / 1000
      : null;

  return {
    metrics: [
      measured(
        "claimed_verified_business_count",
        "Verified/claimed businesses",
        claimedCount,
        "count",
        ["businesses"],
      ),
      measured(
        "businesses_with_verified_sales",
        "Businesses with at least one verified sale",
        sellingBusinessCount,
        "count",
        ["bmev_records"],
      ),
      conversionRatio === null
        ? insufficientData(
            "claimed_to_selling_ratio",
            "Share of verified businesses with a verified sale",
            "No verified/claimed businesses exist yet, so this ratio cannot be calculated.",
          )
        : estimated(
            "claimed_to_selling_ratio",
            "Share of verified businesses with a verified sale",
            conversionRatio,
            "ratio",
            ["businesses", "bmev_records"],
            "businesses_with_verified_sales / claimed_verified_business_count",
          ),
    ],
  };
}
