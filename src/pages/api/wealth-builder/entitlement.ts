import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthBuilderEntitlementForUser } from "@/lib/wealth-builder/entitlements";

type EntitlementResponse = {
  ok: boolean;
  entitlement?: {
    productKey: "wealth_builder_premium";
    tier: "free" | "premium";
    status: "active" | "trialing" | "canceled" | "expired" | "inactive";
    isPremium: boolean;
    limits: {
      maxSavingsGoals: number;
      currentMonthBudgetOnly: boolean;
      insightsEnabled: boolean;
      budgetHistoryEnabled: boolean;
    };
  };
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EntitlementResponse>,
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
    const entitlement = await getWealthBuilderEntitlementForUser(auth.userId);

    return res.status(200).json({
      ok: true,
      entitlement: {
        productKey: entitlement.productKey,
        tier: entitlement.tier,
        status: entitlement.status,
        isPremium: entitlement.isPremium,
        limits: entitlement.limits,
      },
    });
  } catch (error) {
    console.error("GET /api/wealth-builder/entitlement error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to load entitlement.",
    });
  }
}
