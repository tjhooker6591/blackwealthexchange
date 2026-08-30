import type { Db } from "mongodb";
import { safeCount, startOfMonth } from "@/lib/adminMetrics";
import { isMarketplaceSellerLiabilityOrder } from "@/lib/marketplace/orderLifecycle";
import { getAdminFinanceSummary } from "@/lib/adminFinanceSummary";

export async function buildLiveAdminMetrics(db: Db) {
  const now = new Date();
  const month = startOfMonth(now);
  const financeSummary = await getAdminFinanceSummary(db);

  const revenue = {
    revenueToday: {
      value: 0,
      sourceStatus: "needs_mapping",
      note: "Daily centralized finance rollup not yet mapped",
    },
    revenueThisMonth: {
      value: Number(financeSummary.totalRevenue || 0),
      sourceStatus: "live",
      note: `Centralized admin finance summary (${financeSummary.sourceOfTruth})`,
    },
    grossRevenue: {
      value: Number(financeSummary.grossRevenue || 0),
      sourceStatus: "live",
      note: `Centralized admin finance summary (${financeSummary.sourceOfTruth})`,
    },
    pendingRevenue: {
      value: Number(financeSummary.pendingRevenue || 0),
      sourceStatus: "live",
      note: `Centralized admin finance summary (${financeSummary.sourceOfTruth})`,
    },
    failedOrRefunded: {
      value: Number(financeSummary.failedOrRefunded || 0),
      sourceStatus: "live",
      note: `Centralized admin finance summary (${financeSummary.sourceOfTruth})`,
    },
    marketplacePlatformFees: {
      value: (
        await db
          .collection("orders")
          .find(
            {},
            {
              projection: {
                paymentStatus: 1,
                orderState: 1,
                paid: 1,
                paidAt: 1,
                bweFee: 1,
                platformFeeAmount: 1,
                platformFee: 1,
              },
            },
          )
          .toArray()
      ).reduce((sum: number, order: any) => {
        if (!isMarketplaceSellerLiabilityOrder(order)) return sum;
        return (
          sum +
          Number(
            order?.platformFeeAmount ??
              order?.platformFee ??
              order?.bweFee ??
              0,
          )
        );
      }, 0),
    },
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
