import type { Db } from "mongodb";
import { isFinancialLedgerEnabled } from "@/lib/finance/ledger";

const STREAMS = [
  "membership_black_card",
  "marketplace",
  "advertising",
  "directory",
  "jobs",
  "courses",
  "wealth_builder",
  "music_creator_plan",
  "affiliate_revenue",
  "affiliate_liability",
  "consulting_opportunity_network",
  "manual_offline",
] as const;

export type AdminFinanceStream = (typeof STREAMS)[number] | "other";

export function streamForPayment(
  type: string,
  itemId: string,
): AdminFinanceStream {
  if (type === "product") return "marketplace";
  if (type === "ad") {
    if (itemId === "directory-standard" || itemId === "directory-featured") {
      return "directory";
    }
    return "advertising";
  }
  if (type === "job") return "jobs";
  if (type === "course") return "courses";
  if (type === "plan") {
    if (itemId.startsWith("music-creator-")) return "music_creator_plan";
    if (itemId.startsWith("wealth-builder-")) return "wealth_builder";
    if (
      itemId.startsWith("black-card") ||
      itemId === "premium" ||
      itemId === "founder"
    ) {
      return "membership_black_card";
    }
  }
  if (type === "affiliate") return "affiliate_revenue";
  if (type === "manual") return "manual_offline";
  return "other";
}

function buildEmptyStreams() {
  const byStream: Record<string, any> = {};
  for (const s of STREAMS) {
    byStream[s] = {
      gross: 0,
      retained: 0,
      payouts: 0,
      pending: 0,
      completed: 0,
      failed: 0,
      refunded: 0,
      count: 0,
    };
  }
  byStream.other = {
    gross: 0,
    retained: 0,
    payouts: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    refunded: 0,
    count: 0,
  };
  return byStream;
}

export async function getAdminFinanceSummary(db: Db) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (isFinancialLedgerEnabled()) {
    const ledgerRows = await db
      .collection("financial_ledger")
      .find(
        {},
        {
          projection: {
            revenueStream: 1,
            grossAmount: 1,
            bweFeeAmount: 1,
            sellerPayoutAmount: 1,
            paymentStatus: 1,
            refundStatus: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(5000)
      .toArray();

    const byStream = buildEmptyStreams();
    let grossRevenue = 0;
    let totalRevenue = 0;
    let revenueThisMonth = 0;
    let pendingRevenue = 0;
    let failedOrRefunded = 0;

    const monthlySummary: Record<string, number> = {};

    for (const row of ledgerRows as any[]) {
      const stream = String(row?.revenueStream || "other");
      if (!byStream[stream]) byStream[stream] = buildEmptyStreams().other;

      const gross = Number(row?.grossAmount || 0);
      const retained = Number(row?.bweFeeAmount ?? row?.netBweRevenue ?? gross);
      const payout = Number(row?.sellerPayoutAmount || 0);
      const paymentStatus = String(row?.paymentStatus || "pending");
      const refundStatus = String(row?.refundStatus || "none");
      const d = row?.createdAt ? new Date(row.createdAt) : null;

      byStream[stream].count += 1;
      byStream[stream].gross += gross;
      byStream[stream].retained += retained;
      byStream[stream].payouts += payout;

      if (paymentStatus === "paid" || paymentStatus === "completed") {
        byStream[stream].completed += gross;
        grossRevenue += gross;
        totalRevenue += retained;
        if (d && !Number.isNaN(d.getTime()) && d >= monthStart) {
          revenueThisMonth += retained;
        }
      } else if (paymentStatus.includes("fail")) {
        byStream[stream].failed += gross;
        failedOrRefunded += gross;
      } else if (paymentStatus.includes("refund") || refundStatus !== "none") {
        byStream[stream].refunded += gross;
        failedOrRefunded += gross;
      } else {
        byStream[stream].pending += gross;
        pendingRevenue += gross;
      }

      if (d && !Number.isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlySummary[key] = (monthlySummary[key] || 0) + retained;
      }
    }

    const latestTransactions = ledgerRows.slice(0, 30).map((row: any) => ({
      revenueStream: row?.revenueStream || "other",
      grossAmount: Number(row?.grossAmount || 0),
      bweFeeAmount: Number(row?.bweFeeAmount ?? row?.grossAmount ?? 0),
      paymentStatus: row?.paymentStatus || "pending",
      updatedAt: row?.updatedAt || row?.createdAt || null,
      source: "financial_ledger",
    }));

    return {
      sourceOfTruth: "financial_ledger",
      grossRevenue,
      totalRevenue,
      revenueThisMonth,
      pendingRevenue,
      failedOrRefunded,
      byStream,
      monthlySummary,
      latestTransactions,
    };
  }

  const payments = await db
    .collection("payments")
    .find(
      {},
      {
        projection: {
          type: 1,
          itemId: 1,
          amountCents: 1,
          bweFee: 1,
          payout: 1,
          status: 1,
          paidAt: 1,
          updatedAt: 1,
        },
      },
    )
    .sort({ updatedAt: -1 })
    .limit(5000)
    .toArray();

  const byStream = buildEmptyStreams();
  let grossRevenue = 0;
  let totalRevenue = 0;
  let revenueThisMonth = 0;
  let pendingRevenue = 0;
  let failedOrRefunded = 0;

  for (const p of payments as any[]) {
    const stream = streamForPayment(
      String(p.type || ""),
      String(p.itemId || ""),
    );
    const amount = Number(p.amountCents || 0);
    const fee = Number(p.bweFee ?? amount);
    const payout = Number(p.payout || 0);
    const status = String(p.status || "pending");
    const paidAt = p.paidAt ? new Date(p.paidAt) : null;

    byStream[stream].count += 1;
    byStream[stream].gross += amount;
    byStream[stream].retained += fee;
    byStream[stream].payouts += payout;

    if (status === "paid" || status === "completed") {
      byStream[stream].completed += amount;
      grossRevenue += amount;
      totalRevenue += fee;
      if (paidAt && paidAt >= monthStart) revenueThisMonth += fee;
    } else if (status.includes("fail")) {
      byStream[stream].failed += amount;
      failedOrRefunded += amount;
    } else if (status.includes("refund")) {
      byStream[stream].refunded += amount;
      failedOrRefunded += amount;
    } else {
      byStream[stream].pending += amount;
      pendingRevenue += amount;
    }
  }

  const affiliatePending = await db
    .collection("affiliatePayouts")
    .aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
    ])
    .toArray();
  byStream.affiliate_liability.pending = Number(
    affiliatePending[0]?.total || 0,
  );

  const latestTransactions = (payments as any[]).slice(0, 30).map((p) => ({
    type: p.type || "unknown",
    itemId: p.itemId || null,
    amountCents: Number(p.amountCents || 0),
    bweFee: Number(p.bweFee ?? p.amountCents ?? 0),
    payout: Number(p.payout || 0),
    status: p.status || "pending",
    updatedAt: p.updatedAt || null,
    source: "payments",
  }));

  const monthlySummary: Record<string, number> = {};
  for (const p of payments as any[]) {
    const fee = Number(p.bweFee ?? p.amountCents ?? 0);
    const d = p.paidAt
      ? new Date(p.paidAt)
      : p.updatedAt
        ? new Date(p.updatedAt)
        : null;
    if (!d || Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlySummary[key] = (monthlySummary[key] || 0) + fee;
  }

  return {
    sourceOfTruth: "payments",
    grossRevenue,
    totalRevenue,
    revenueThisMonth,
    pendingRevenue,
    failedOrRefunded,
    byStream,
    monthlySummary,
    latestTransactions,
  };
}
