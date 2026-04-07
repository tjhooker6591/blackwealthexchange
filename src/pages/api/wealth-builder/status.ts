import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthBuilderEntitlementForUser } from "@/lib/wealth-builder/entitlements";
import { getWealthDb } from "@/lib/wealth-builder/mongo";

type StatusResponse = {
  ok: boolean;
  status?: {
    userId: string;
    email?: string | null;
    entitlement: {
      productKey: "wealth_builder_premium";
      tier: "free" | "premium";
      status: "active" | "trialing" | "canceled" | "expired" | "inactive";
      isPremium: boolean;
      limits: {
        maxSavingsGoals: number | null;
        currentMonthBudgetOnly: boolean;
        insightsEnabled: boolean;
        budgetHistoryEnabled: boolean;
      };
    };
    summary: {
      debtCount: number;
      goalCount: number;
      activeGoalCount: number;
      budgetCount: number;
      transactionCount: number;
      wealthBuilderPaymentCount: number;
      lastWealthBuilderPaymentStatus: string | null;
      lastWealthBuilderPaymentAt: string | null;
    };
    recentWealthBuilderPayments: Array<{
      stripeSessionId: string | null;
      itemId: string | null;
      productKey: string | null;
      billingInterval: string | null;
      status: string | null;
      amountCents: number | null;
      createdAt: string | null;
      paidAt: string | null;
    }>;
  };
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      message: `Method ${req.method} not allowed.`,
    });
  }

  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  try {
    const db = await getWealthDb();
    const entitlement = await getWealthBuilderEntitlementForUser(auth.userId);

    const [
      debtCount,
      goalCount,
      activeGoalCount,
      budgetCount,
      transactionCount,
      paymentDocs,
    ] = await Promise.all([
      db.collection("financial_debts").countDocuments({
        userId: auth.userId,
        accountType: "user",
      }),
      db.collection("savings_goals").countDocuments({
        userId: auth.userId,
        accountType: "user",
      }),
      db.collection("savings_goals").countDocuments({
        userId: auth.userId,
        accountType: "user",
        status: "active",
      }),
      db.collection("budget_plans").countDocuments({
        userId: auth.userId,
        accountType: "user",
      }),
      db.collection("financial_transactions").countDocuments({
        userId: auth.userId,
        accountType: "user",
      }),
      db
        .collection("payments")
        .find(
          {
            userId: auth.userId,
            $or: [
              { "metadata.productKey": "wealth_builder_premium" },
              { itemId: "wealth-builder-premium-monthly" },
              { itemId: "wealth-builder-premium-annual" },
            ],
          },
          {
            projection: {
              stripeSessionId: 1,
              itemId: 1,
              status: 1,
              amountCents: 1,
              createdAt: 1,
              paidAt: 1,
              metadata: 1,
            },
          }
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
    ]);

    const recentWealthBuilderPayments = paymentDocs.map((doc: any) => ({
      stripeSessionId:
        typeof doc.stripeSessionId === "string" ? doc.stripeSessionId : null,
      itemId: typeof doc.itemId === "string" ? doc.itemId : null,
      productKey:
        typeof doc?.metadata?.productKey === "string"
          ? doc.metadata.productKey
          : null,
      billingInterval:
        typeof doc?.metadata?.billingInterval === "string"
          ? doc.metadata.billingInterval
          : null,
      status: typeof doc.status === "string" ? doc.status : null,
      amountCents: typeof doc.amountCents === "number" ? doc.amountCents : null,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
      paidAt: doc.paidAt ? new Date(doc.paidAt).toISOString() : null,
    }));

    const lastPayment = recentWealthBuilderPayments[0] || null;

    return res.status(200).json({
      ok: true,
      status: {
        userId: auth.userId,
        email: auth.email || null,
        entitlement: {
          productKey: entitlement.productKey,
          tier: entitlement.tier,
          status: entitlement.status,
          isPremium: entitlement.isPremium,
          limits: {
            maxSavingsGoals: Number.isFinite(entitlement.limits.maxSavingsGoals)
              ? entitlement.limits.maxSavingsGoals
              : null,
            currentMonthBudgetOnly: entitlement.limits.currentMonthBudgetOnly,
            insightsEnabled: entitlement.limits.insightsEnabled,
            budgetHistoryEnabled: entitlement.limits.budgetHistoryEnabled,
          },
        },
        summary: {
          debtCount,
          goalCount,
          activeGoalCount,
          budgetCount,
          transactionCount,
          wealthBuilderPaymentCount: recentWealthBuilderPayments.length,
          lastWealthBuilderPaymentStatus: lastPayment?.status ?? null,
          lastWealthBuilderPaymentAt: lastPayment?.paidAt ?? null,
        },
        recentWealthBuilderPayments,
      },
    });
  } catch (error) {
    console.error("GET /api/wealth-builder/status error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to load Wealth Builder status.",
    });
  }
}