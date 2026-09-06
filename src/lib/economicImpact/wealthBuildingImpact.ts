// src/lib/economicImpact/wealthBuildingImpact.ts
//
// Phase 6 -- Wealth-Building Impact. Reuses the real Wealth Builder data
// already in place: `financial_transactions` (a member's own budget
// entries -- src/pages/api/wealth-builder/dashboard.ts) for real usage
// counts, and the existing admin finance summary's wealth_builder stream
// for real verified premium revenue. Deliberately does NOT sum members'
// own financial_transactions amounts into a platform-wide "wealth
// created" figure: that data is self-reported personal budget entries,
// not BWE-generated economic value, and aggregating it into a company
// claim would be both an inference and a privacy concern -- so that
// metric is reported as insufficient_data rather than invented.

import type { Db } from "mongodb";
import { getAdminFinanceSummary } from "@/lib/adminFinanceSummary";
import { measured, insufficientData, type EconomicMetric } from "./shared";

export type WealthBuildingImpactResult = {
  metrics: EconomicMetric[];
};

export async function resolveWealthBuildingImpact(
  db: Db,
): Promise<WealthBuildingImpactResult> {
  const [activeUserIds, financeSummary] = await Promise.all([
    db.collection("financial_transactions").distinct("userId"),
    getAdminFinanceSummary(db),
  ]);

  const activeMemberCount = activeUserIds.filter(Boolean).length;
  const wealthBuilderStream = financeSummary.byStream?.wealth_builder;
  const verifiedRevenueCents = Number(wealthBuilderStream?.completed || 0);

  return {
    metrics: [
      measured(
        "wealth_builder_active_members",
        "Members actively using Wealth Builder",
        activeMemberCount,
        "count",
        ["financial_transactions"],
        "Distinct userId values with at least one financial_transactions entry.",
      ),
      wealthBuilderStream
        ? measured(
            "wealth_builder_verified_revenue_cents",
            "Verified Wealth Builder premium revenue",
            verifiedRevenueCents,
            "usd_cents",
            ["payments", "financial_ledger"],
            "src/lib/adminFinanceSummary.ts byStream.wealth_builder.completed -- the same figure BWE finance reporting already uses.",
          )
        : insufficientData(
            "wealth_builder_verified_revenue_cents",
            "Verified Wealth Builder premium revenue",
            "No wealth_builder payment stream data available yet.",
          ),
      insufficientData(
        "wealth_builder_aggregate_wealth_created_cents",
        "Aggregate member wealth created / saved",
        "Members' budget, debt, and savings entries in financial_transactions are self-reported personal financial data, not BWE-generated economic value. Summing it into a platform-wide dollar claim would misrepresent what BWE directly created and risks exposing personal financial information in aggregate form -- so this metric is intentionally not calculated.",
      ),
    ],
  };
}
