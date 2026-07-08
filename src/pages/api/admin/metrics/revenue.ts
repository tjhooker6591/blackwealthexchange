import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getAdminFinanceSummary } from "@/lib/adminFinanceSummary";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const db = (await clientPromise).db(getMongoDbName());
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(month.getFullYear(), month.getMonth() - 1, 1);

  const currentSummary = await getAdminFinanceSummary(db);

  const monthlyKeys = Object.keys(currentSummary.monthlySummary || {}).sort();
  const currentMonthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthKey = `${prevMonthStart.getFullYear()}-${String(prevMonthStart.getMonth() + 1).padStart(2, "0")}`;
  const total = Number(currentSummary.totalRevenue || 0);
  const prevTotal = Number(currentSummary.monthlySummary?.[prevMonthKey] || 0);
  const changePercent =
    prevTotal > 0
      ? Number((((total - prevTotal) / prevTotal) * 100).toFixed(2))
      : 0;

  const streamEntries = Object.entries(currentSummary.byStream || {}).map(
    ([key, value]: [string, any]) => ({
      key,
      retained: Number(value?.retained || 0),
      gross: Number(value?.gross || 0),
      pending: Number(value?.pending || 0),
      count: Number(value?.count || 0),
    }),
  );
  const sorted = [...streamEntries].sort((a, b) => b.retained - a.retained);
  const topDriver = sorted[0]?.key || null;
  const fastestGrowth = topDriver;
  const declineRisk = changePercent < 0 ? topDriver : null;

  return res.status(200).json({
    ok: true,
    generatedAt: now.toISOString(),
    sourceOfTruth: currentSummary.sourceOfTruth,
    intelligence: {
      total: Number(total.toFixed(2)),
      changePercent,
      topDriver,
      fastestGrowth,
      declineRisk,
      currentMonthKey,
      previousMonthKey: prevMonthKey,
      monthsTracked: monthlyKeys.length,
    },
    streams: currentSummary.byStream,
    summary: {
      grossRevenue: currentSummary.grossRevenue,
      totalRevenue: currentSummary.totalRevenue,
      revenueThisMonth: currentSummary.revenueThisMonth,
      pendingRevenue: currentSummary.pendingRevenue,
      failedOrRefunded: currentSummary.failedOrRefunded,
    },
  });
}
