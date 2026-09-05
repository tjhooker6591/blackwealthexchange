// src/lib/personalization/consumerEconomics.ts
//
// P4-02 Consumer Economic Dashboard.
//
// Shows a member their own verified economic impact -- dollars spent with
// Black-owned businesses through BWE, sourced from the same bmev_records
// ledger used for business-side revenue reporting (proofLevel:
// "verified_payment_truth"). No estimates, no platform-wide numbers
// presented as personal, and an honest empty state when a member has not
// made a verified purchase yet.

import { ObjectId, type Db } from "mongodb";

export type MonthlySpendPoint = { month: string; verifiedRevenueCents: number };

export type ConsumerEconomicDashboardResult = {
  state: "LINKED" | "NOT_LINKED";
  userId: string;
  verifiedRevenueCents: number;
  transactionCount: number;
  businessLines: string[];
  businessesSupported: number;
  latestTransactionAt: string | null;
  monthlyTrend: MonthlySpendPoint[];
  membershipState: string;
  blackCardActive: boolean;
  provenance: { source: string; authoritative: boolean }[];
};

function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function monthKeyOf(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function resolveConsumerEconomicDashboard(
  db: Db,
  input: { userId: string },
): Promise<ConsumerEconomicDashboardResult> {
  const userId = s(input.userId);

  const [records, user] = await Promise.all([
    db
      .collection("bmev_records")
      .find(
        { buyerUserId: userId, paymentVerified: true },
        { sort: { occurredAt: -1 }, limit: 500 },
      )
      .toArray(),
    db
      .collection("users")
      .findOne(
        (ObjectId.isValid(userId)
          ? { _id: new ObjectId(userId) }
          : { _id: userId }) as any,
        {
          projection: {
            currentPlan: 1,
            premiumStatus: 1,
            blackCardStatus: 1,
          },
        },
      ),
  ]);

  if (!records.length) {
    return {
      state: "NOT_LINKED",
      userId,
      verifiedRevenueCents: 0,
      transactionCount: 0,
      businessLines: [],
      businessesSupported: 0,
      latestTransactionAt: null,
      monthlyTrend: [],
      membershipState: s(user?.currentPlan) || "free",
      blackCardActive:
        String(user?.blackCardStatus || "").toLowerCase() === "active",
      provenance: [{ source: "no_verified_purchases", authoritative: false }],
    };
  }

  const monthBuckets = new Map<string, number>();
  const businessIds = new Set<string>();
  for (const record of records) {
    const occurredAt = (record as any).occurredAt;
    if (occurredAt instanceof Date || typeof occurredAt === "string") {
      const month = monthKeyOf(new Date(occurredAt));
      monthBuckets.set(
        month,
        (monthBuckets.get(month) || 0) +
          (Number((record as any).bmevAmountCents) || 0),
      );
    }
    const businessId = s((record as any).businessId);
    if (businessId) businessIds.add(businessId);
  }

  const monthlyTrend = Array.from(monthBuckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, verifiedRevenueCents]) => ({ month, verifiedRevenueCents }));

  return {
    state: "LINKED",
    userId,
    verifiedRevenueCents: records.reduce(
      (sum, r: any) => sum + (Number(r.bmevAmountCents) || 0),
      0,
    ),
    transactionCount: records.length,
    businessLines: Array.from(
      new Set(records.map((r: any) => s(r.businessLine)).filter(Boolean)),
    ),
    businessesSupported: businessIds.size,
    latestTransactionAt:
      records
        .map((r: any) =>
          r.occurredAt instanceof Date
            ? r.occurredAt.toISOString()
            : s(r.occurredAt),
        )
        .filter(Boolean)
        .sort()
        .reverse()[0] || null,
    monthlyTrend,
    membershipState: s(user?.currentPlan) || "free",
    blackCardActive:
      String(user?.blackCardStatus || "").toLowerCase() === "active",
    provenance: [{ source: "bmev_records.buyerUserId", authoritative: true }],
  };
}
