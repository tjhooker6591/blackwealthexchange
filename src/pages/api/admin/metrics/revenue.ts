import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { startOfMonth, startOfToday, sumAmount } from "@/lib/adminMetrics";

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
  const today = startOfToday(now);
  const month = startOfMonth(now);

  const marketplaceFeesToday = await sumAmount(
    db,
    "orders",
    { createdAt: { $gte: today } },
    ["platformFeeAmount", "platformFee", "bweFee"],
  );
  const marketplaceFeesMonth = await sumAmount(
    db,
    "orders",
    { createdAt: { $gte: month } },
    ["platformFeeAmount", "platformFee", "bweFee"],
  );
  const advertising = await sumAmount(
    db,
    "advertising_requests",
    { status: { $in: ["paid", "active", "approved"] } },
    ["amount", "price"],
  );
  const jobs = await sumAmount(db, "jobs", { paid: true }, [
    "paymentAmount",
    "price",
    "amount",
  ]);
  const membership = await sumAmount(db, "black_card_memberships", {}, [
    "amount",
    "price",
    "total",
  ]);
  const courses = await sumAmount(db, "course_orders", {}, [
    "amount",
    "price",
    "total",
  ]);
  const music = await sumAmount(db, "music_creator_onboarding", {}, [
    "amount",
    "planAmount",
    "price",
  ]);
  const consulting = await sumAmount(
    db,
    "consulting_intake",
    { $or: [{ paid: true }, { invoicePaid: true }] },
    ["revenueAmount", "amount"],
  );
  const affiliate = await sumAmount(db, "affiliate_revenue", {}, [
    "amount",
    "commission",
  ]);
  const manual = await sumAmount(db, "manual_offline_revenue", {}, ["amount"]);

  const streamsList = [
    ["marketplaceFeesMonth", marketplaceFeesMonth],
    ["advertising", advertising],
    ["jobs", jobs],
    ["membership", membership],
    ["courses", courses],
    ["music", music],
    ["consulting", consulting],
    ["affiliate", affiliate],
    ["manual", manual],
  ] as const;
  const total = streamsList.reduce((a, [, m]) => a + Number(m.value || 0), 0);
  const prevMonthStart = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const prevMonthEnd = month;
  const prevMonth = await sumAmount(
    db,
    "financial_transactions",
    { createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd } },
    ["netBweRevenue", "amount"],
  );
  const prevTotal = Number(prevMonth.value || 0);
  const changePercent =
    prevTotal > 0
      ? Number((((total - prevTotal) / prevTotal) * 100).toFixed(2))
      : 0;
  const sorted = [...streamsList].sort(
    (a, b) => Number(b[1].value) - Number(a[1].value),
  );
  const topDriver = sorted[0]?.[0] || null;
  const fastestGrowth = topDriver;
  const declineRisk = changePercent < 0 ? sorted[0]?.[0] || null : null;

  return res.status(200).json({
    ok: true,
    generatedAt: now.toISOString(),
    intelligence: {
      total: Number(total.toFixed(2)),
      changePercent,
      topDriver,
      fastestGrowth,
      declineRisk,
    },
    streams: {
      marketplaceFeesToday,
      marketplaceFeesMonth,
      advertising,
      jobs,
      membership,
      courses,
      music,
      consulting,
      affiliate,
      manual,
    },
  });
}
