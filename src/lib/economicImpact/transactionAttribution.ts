// src/lib/economicImpact/transactionAttribution.ts
//
// Phase 6 -- Transaction Attribution (platform-wide). Extends the existing
// per-business/per-consumer attribution resolver
// (src/lib/personalization/attribution.ts) to a platform-wide rollup over
// the same canonical `bmev_records` ledger, using the same grouping logic
// (source, businessLine) rather than a second attribution system.

import type { Db } from "mongodb";
import { s, measured, type EconomicMetric } from "./shared";

export type TransactionAttributionResult = {
  metrics: EconomicMetric[];
  revenueBySource: {
    key: string;
    transactionCount: number;
    verifiedRevenueCents: number;
  }[];
  revenueByBusinessLine: {
    key: string;
    transactionCount: number;
    verifiedRevenueCents: number;
  }[];
};

function groupRevenue(records: any[], field: "source" | "businessLine") {
  const grouped = new Map<string, { count: number; cents: number }>();
  for (const record of records) {
    const key = s(record[field]) || "unspecified";
    const entry = grouped.get(key) || { count: 0, cents: 0 };
    entry.count += 1;
    entry.cents += Number(record.bmevAmountCents) || 0;
    grouped.set(key, entry);
  }
  return Array.from(grouped.entries())
    .sort((a, b) => b[1].cents - a[1].cents)
    .map(([key, v]) => ({
      key,
      transactionCount: v.count,
      verifiedRevenueCents: v.cents,
    }));
}

export async function resolveTransactionAttribution(
  db: Db,
): Promise<TransactionAttributionResult> {
  const records = await db
    .collection("bmev_records")
    .find(
      { paymentVerified: true },
      { projection: { source: 1, businessLine: 1, bmevAmountCents: 1 } },
    )
    .limit(20000)
    .toArray();

  const revenueBySource = groupRevenue(records, "source");
  const revenueByBusinessLine = groupRevenue(records, "businessLine");
  const totalRevenueCents = records.reduce(
    (sum, r) => sum + (Number((r as any).bmevAmountCents) || 0),
    0,
  );

  return {
    revenueBySource,
    revenueByBusinessLine,
    metrics: [
      measured(
        "verified_transaction_count",
        "Verified transactions",
        records.length,
        "count",
        ["bmev_records"],
      ),
      measured(
        "verified_transaction_revenue_cents",
        "Verified transaction revenue",
        totalRevenueCents,
        "usd_cents",
        ["bmev_records"],
        "Sum of bmevAmountCents (merchandise subtotal only; excludes shipping and BWE fee) across every payment-verified bmev_records entry.",
      ),
    ],
  };
}
