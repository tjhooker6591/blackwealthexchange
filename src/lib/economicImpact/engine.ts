// src/lib/economicImpact/engine.ts
//
// Phase 6 -- Economic Impact Engine. The single orchestration point that
// ties together every canonical economic source already in the codebase
// (bmev_records, the admin finance summary over payments/financial_ledger,
// users, jobs/applicants, referral_events, financial_transactions) into
// one snapshot, category by category. This module does not invent a new
// ledger -- it composes the eight category resolvers in this directory,
// each of which reads an existing collection or an existing resolver
// (src/lib/adminFinanceSummary.ts, src/lib/personalization/attribution.ts's
// grouping approach, src/lib/business360.ts) rather than duplicating it.

import type { Db } from "mongodb";
import { resolveTransactionAttribution } from "./transactionAttribution";
import { resolveBusinessGrowthAttribution } from "./businessGrowthAttribution";
import { resolveCommunityEconomicActivity } from "./communityEconomicActivity";
import { resolveBlackCardImpact } from "./blackCardImpact";
import { resolveReferralImpact } from "./referralImpact";
import { resolveJobCareerImpact } from "./jobCareerImpact";
import { resolveWealthBuildingImpact } from "./wealthBuildingImpact";
import { measured, type EconomicMetric } from "./shared";

export type EconomicImpactCategory = {
  id: string;
  label: string;
  metrics: EconomicMetric[];
};

export type EconomicImpactSnapshot = {
  generatedAt: string;
  categories: EconomicImpactCategory[];
  overall: EconomicMetric[];
};

function sumMeasuredCents(metrics: EconomicMetric[], keys: string[]) {
  let total = 0;
  let anyMeasured = false;
  for (const metric of metrics) {
    if (
      keys.includes(metric.key) &&
      metric.status === "measured" &&
      typeof metric.value === "number"
    ) {
      total += metric.value;
      anyMeasured = true;
    }
  }
  return { total, anyMeasured };
}

export async function resolveEconomicImpactSnapshot(
  db: Db,
): Promise<EconomicImpactSnapshot> {
  const [
    transactionAttribution,
    businessGrowthAttribution,
    communityEconomicActivity,
    blackCardImpact,
    referralImpact,
    jobCareerImpact,
    wealthBuildingImpact,
  ] = await Promise.all([
    resolveTransactionAttribution(db),
    resolveBusinessGrowthAttribution(db),
    resolveCommunityEconomicActivity(db),
    resolveBlackCardImpact(db),
    resolveReferralImpact(db),
    resolveJobCareerImpact(db),
    resolveWealthBuildingImpact(db),
  ]);

  const categories: EconomicImpactCategory[] = [
    {
      id: "transaction_attribution",
      label: "Transaction Attribution",
      metrics: transactionAttribution.metrics,
    },
    {
      id: "business_growth_attribution",
      label: "Business Growth Attribution",
      metrics: businessGrowthAttribution.metrics,
    },
    {
      id: "community_economic_activity",
      label: "Community Economic Activity",
      metrics: communityEconomicActivity.metrics,
    },
    {
      id: "black_card_impact",
      label: "Black Card Economic Impact",
      metrics: blackCardImpact.metrics,
    },
    {
      id: "referral_impact",
      label: "Referral Impact",
      metrics: referralImpact.metrics,
    },
    {
      id: "job_career_impact",
      label: "Job / Career Impact",
      metrics: jobCareerImpact.metrics,
    },
    {
      id: "wealth_building_impact",
      label: "Wealth-Building Impact",
      metrics: wealthBuildingImpact.metrics,
    },
  ];

  // Overall: sum only the measured, non-overlapping revenue components.
  // Marketplace (bmev_records) is the amount paid to businesses, not BWE
  // revenue; Black Card and Wealth Builder are BWE's own verified
  // subscription revenue. Kept as separate lines, not blended into one
  // "total revenue" figure that would conflate the two.
  const { total: businessFacingActivityCents } = sumMeasuredCents(
    communityEconomicActivity.metrics,
    ["community_verified_economic_activity_cents"],
  );
  const { total: bweMembershipRevenueCents } = sumMeasuredCents(
    [...blackCardImpact.metrics, ...wealthBuildingImpact.metrics],
    [
      "black_card_verified_revenue_cents",
      "wealth_builder_verified_revenue_cents",
    ],
  );

  const overall: EconomicMetric[] = [
    measured(
      "overall_business_facing_economic_activity_cents",
      "Total verified economic activity moved to Black-owned businesses",
      businessFacingActivityCents,
      "usd_cents",
      ["bmev_records"],
      "community_verified_economic_activity_cents -- the amount paid to businesses through BWE Marketplace, not BWE's own revenue.",
    ),
    measured(
      "overall_bwe_membership_revenue_cents",
      "Total verified BWE membership revenue (Black Card + Wealth Builder premium)",
      bweMembershipRevenueCents,
      "usd_cents",
      ["payments", "financial_ledger"],
      "black_card_verified_revenue_cents + wealth_builder_verified_revenue_cents.",
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    categories,
    overall,
  };
}
