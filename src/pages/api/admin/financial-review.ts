import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";

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

function streamFor(type: string, itemId: string) {
  if (type === "product") return "marketplace";
  if (type === "ad") {
    if (itemId === "directory-standard" || itemId === "directory-featured")
      return "directory";
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
    )
      return "membership_black_card";
  }
  if (type === "affiliate") return "affiliate_revenue";
  if (type === "manual") return "manual_offline";
  return "other";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

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

  const byStream: Record<string, any> = {};
  for (const s of STREAMS)
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

  let totalRevenue = 0,
    thisMonth = 0,
    pending = 0,
    failedRefunded = 0;

  for (const p of payments as any[]) {
    const stream = streamFor(String(p.type || ""), String(p.itemId || ""));
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
      totalRevenue += fee;
      if (paidAt && paidAt >= monthStart) thisMonth += fee;
    } else if (status.includes("fail")) {
      byStream[stream].failed += amount;
      failedRefunded += amount;
    } else if (status.includes("refund")) {
      byStream[stream].refunded += amount;
      failedRefunded += amount;
    } else {
      byStream[stream].pending += amount;
      pending += amount;
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

  return res.status(200).json({
    totalRevenue,
    revenueThisMonth: thisMonth,
    pendingRevenue: pending,
    failedOrRefunded: failedRefunded,
    byStream,
    monthlySummary,
    latestTransactions,
    notes: {
      consultingOpportunityNetwork: "Manual entry (Phase 1)",
      manualRevenue: "Manual / Offline Revenue",
    },
  });
}
