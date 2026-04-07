import { getWealthDb } from "@/lib/wealth-builder/mongo";

type EntitlementStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "expired"
  | "inactive";

type BillingInterval = "monthly" | "annual" | null;

type UpsertPremiumEntitlementInput = {
  userId: string;
  status: EntitlementStatus;
  billingInterval?: BillingInterval;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  trialEndsAt?: Date | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean | null;
};

export async function upsertWealthBuilderPremiumEntitlement(
  input: UpsertPremiumEntitlementInput
) {
  const db = await getWealthDb();
  const collection = db.collection("user_entitlements");
  const now = new Date();

  await collection.updateOne(
    {
      userId: input.userId,
      accountType: "user",
      productKey: "wealth_builder_premium",
    },
    {
      $set: {
        userId: input.userId,
        accountType: "user",
        productKey: "wealth_builder_premium",
        tier:
          input.status === "active" || input.status === "trialing"
            ? "premium"
            : "free",
        status: input.status,
        billingInterval: input.billingInterval ?? null,
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        trialEndsAt: input.trialEndsAt ?? null,
        currentPeriodStart: input.currentPeriodStart ?? null,
        currentPeriodEnd: input.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );
}