import { getWealthDb } from "@/lib/wealth-builder/mongo";

export type WealthBuilderTier = "free" | "premium";
export type WealthBuilderStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "expired"
  | "inactive";

export type WealthBuilderEntitlement = {
  productKey: "wealth_builder_premium";
  tier: WealthBuilderTier;
  status: WealthBuilderStatus;
  isPremium: boolean;
  limits: {
    maxSavingsGoals: number;
    currentMonthBudgetOnly: boolean;
    insightsEnabled: boolean;
    budgetHistoryEnabled: boolean;
  };
  raw: Record<string, any> | null;
};

function getFreeEntitlement(): WealthBuilderEntitlement {
  return {
    productKey: "wealth_builder_premium",
    tier: "free",
    status: "inactive",
    isPremium: false,
    limits: {
      maxSavingsGoals: 2,
      currentMonthBudgetOnly: true,
      insightsEnabled: false,
      budgetHistoryEnabled: false,
    },
    raw: null,
  };
}

function getPremiumEntitlement(
  raw: Record<string, any>,
): WealthBuilderEntitlement {
  return {
    productKey: "wealth_builder_premium",
    tier: "premium",
    status:
      raw.status === "active" || raw.status === "trialing"
        ? raw.status
        : "inactive",
    isPremium: true,
    limits: {
      maxSavingsGoals: Number.POSITIVE_INFINITY,
      currentMonthBudgetOnly: false,
      insightsEnabled: true,
      budgetHistoryEnabled: true,
    },
    raw,
  };
}

export async function getWealthBuilderEntitlementForUser(
  userId: string,
): Promise<WealthBuilderEntitlement> {
  const db = await getWealthDb();
  const collection = db.collection("user_entitlements");

  const entitlement = await collection.findOne({
    userId,
    accountType: "user",
    productKey: "wealth_builder_premium",
  });

  if (!entitlement) {
    return getFreeEntitlement();
  }

  const isActivePremium =
    entitlement.tier === "premium" &&
    (entitlement.status === "active" || entitlement.status === "trialing");

  if (!isActivePremium) {
    return getFreeEntitlement();
  }

  return getPremiumEntitlement(entitlement as Record<string, any>);
}
