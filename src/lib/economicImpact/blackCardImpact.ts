// src/lib/economicImpact/blackCardImpact.ts
//
// Phase 6 -- Black Card Economic Impact. Reuses two existing canonical
// sources rather than building a third: real active-member counts from the
// `users` collection (blackCardStatus/blackCardTier, already the fields
// src/pages/api/auth/me.ts reads), and real verified membership revenue
// from the existing admin finance summary
// (src/lib/adminFinanceSummary.ts -> byStream.membership_black_card, which
// already reconciles the `payments`/`financial_ledger` collections).

import type { Db } from "mongodb";
import { getAdminFinanceSummary } from "@/lib/adminFinanceSummary";
import { BLACK_CARD_TIERS, type BlackCardTier } from "@/lib/black-card";
import {
  measured,
  estimated,
  insufficientData,
  type EconomicMetric,
} from "./shared";

export type BlackCardImpactResult = {
  metrics: EconomicMetric[];
  activeMembersByTier: Record<string, number>;
};

export async function resolveBlackCardImpact(
  db: Db,
): Promise<BlackCardImpactResult> {
  const [tierCounts, financeSummary] = await Promise.all([
    db
      .collection("users")
      .aggregate([
        { $match: { blackCardStatus: "active" } },
        { $group: { _id: "$blackCardTier", count: { $sum: 1 } } },
      ])
      .toArray(),
    getAdminFinanceSummary(db),
  ]);

  const activeMembersByTier: Record<string, number> = {};
  let totalActive = 0;
  for (const row of tierCounts as any[]) {
    const tier = String(row._id || "unknown");
    activeMembersByTier[tier] = row.count;
    totalActive += row.count;
  }

  const membershipStream = financeSummary.byStream?.membership_black_card;
  const verifiedRevenueCents = Number(membershipStream?.completed || 0);

  const metrics: EconomicMetric[] = [
    measured(
      "black_card_active_members",
      "Active Black Card members",
      totalActive,
      "count",
      ["users"],
      "Count of users.blackCardStatus === 'active', grouped by users.blackCardTier.",
    ),
    membershipStream
      ? measured(
          "black_card_verified_revenue_cents",
          "Verified Black Card membership revenue",
          verifiedRevenueCents,
          "usd_cents",
          ["payments", "financial_ledger"],
          "src/lib/adminFinanceSummary.ts byStream.membership_black_card.completed -- the same figure BWE finance reporting already uses.",
        )
      : insufficientData(
          "black_card_verified_revenue_cents",
          "Verified Black Card membership revenue",
          "No membership_black_card payment stream data available yet.",
        ),
  ];

  const tiersWithRealPrice = (
    Object.keys(BLACK_CARD_TIERS) as BlackCardTier[]
  ).filter((tier) => BLACK_CARD_TIERS[tier].priceCents !== null);
  if (totalActive > 0 && tiersWithRealPrice.length) {
    let estimatedAnnualCents = 0;
    let tiersCounted = 0;
    for (const tier of tiersWithRealPrice) {
      const count = activeMembersByTier[tier] || 0;
      const config = BLACK_CARD_TIERS[tier];
      const annualPriceCents =
        config.billingModel === "monthly"
          ? (config.priceCents || 0) * 12
          : config.priceCents || 0;
      estimatedAnnualCents += count * annualPriceCents;
      tiersCounted += count;
    }
    metrics.push(
      estimated(
        "black_card_estimated_annualized_value_cents",
        "Estimated annualized Black Card membership value",
        estimatedAnnualCents,
        "usd_cents",
        ["users", "src/lib/black-card.ts"],
        "Sum over priced tiers of (active members in tier x published tier price, annualized for monthly billing). Elite tier is invite-only with no published price and is excluded -- its contribution is insufficient_data, not zero.",
      ),
    );
    if (tiersCounted < totalActive) {
      metrics.push(
        insufficientData(
          "black_card_elite_tier_value",
          "Estimated value of invite-only Elite tier members",
          `${totalActive - tiersCounted} active member(s) are on the invite-only Elite tier, which has no published price.`,
        ),
      );
    }
  } else if (totalActive === 0) {
    metrics.push(
      insufficientData(
        "black_card_estimated_annualized_value_cents",
        "Estimated annualized Black Card membership value",
        "No active Black Card members exist yet.",
      ),
    );
  }

  return { metrics, activeMembersByTier };
}
