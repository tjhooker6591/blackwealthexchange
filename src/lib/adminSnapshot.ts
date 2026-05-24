import type { Db } from "mongodb";
import {
  safeCount,
  startOfMonth,
  startOfToday,
  sumAmount,
} from "@/lib/adminMetrics";

export async function buildLiveAdminMetrics(db: Db) {
  const now = new Date();
  const today = startOfToday(now);
  const month = startOfMonth(now);

  const revenue = {
    revenueToday: await sumAmount(
      db,
      "financial_transactions",
      { createdAt: { $gte: today } },
      ["netBweRevenue", "amount"],
    ),
    revenueThisMonth: await sumAmount(
      db,
      "financial_transactions",
      { createdAt: { $gte: month } },
      ["netBweRevenue", "amount"],
    ),
    marketplacePlatformFees: await sumAmount(db, "orders", {}, [
      "platformFeeAmount",
      "platformFee",
      "bweFee",
    ]),
  };
  const support = {
    newTickets: await safeCount(db, "support_tickets", { status: "new" }),
    escalated: await safeCount(db, "support_tickets", { status: "escalated" }),
  };
  const growth = {
    newUsersThisMonth: await safeCount(db, "users", {
      createdAt: { $gte: month },
    }),
    newBusinessesThisMonth: await safeCount(db, "businesses", {
      createdAt: { $gte: month },
    }),
  };
  const trustSafety = {
    pendingBusinessApprovals: await safeCount(db, "businesses", {
      status: { $in: ["pending", "pending_review"] },
    }),
    disputes: await safeCount(db, "disputes", {}),
  };
  const systemHealthLogs = await db
    .collection("system_health_logs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray()
    .catch(() => []);
  const failures = systemHealthLogs.filter(
    (x: any) => x.status === "fail" || x.httpStatus >= 500,
  );
  const systemHealth = {
    errorCount: failures.length,
    lastFailureTime: failures[0]?.createdAt || null,
    uptimeIndicator: failures.length === 0 ? "healthy" : "degraded",
  };
  const executiveSignals = {
    goingWell:
      Number(revenue.revenueThisMonth.value || 0) > 0
        ? ["Revenue streams active"]
        : [],
    needsAttention:
      Number(support.escalated.value || 0) > 0
        ? [`${support.escalated.value} escalated tickets`]
        : [],
    atRisk: failures.length > 0 ? ["System failures detected"] : [],
  };

  return {
    now,
    revenue,
    support,
    growth,
    trustSafety,
    systemHealth,
    executiveSignals,
  };
}
