// src/lib/economicImpact/referralImpact.ts
//
// Phase 6 -- Referral Impact. Aggregates the real `referral_events`
// collection (Phase 5 -- src/pages/api/referrals/track.ts and the
// referred_signup capture added to src/pages/api/auth/signup.ts) rather
// than a new referral ledger. Downstream revenue is a real join, not an
// inference: a referred_signup event's context.newUserId is matched
// against that same user's own bmev_records purchases.

import type { Db } from "mongodb";
import {
  s,
  measured,
  attributed,
  insufficientData,
  type EconomicMetric,
} from "./shared";

export type ReferralImpactResult = {
  metrics: EconomicMetric[];
  eventCounts: Record<string, number>;
};

export async function resolveReferralImpact(
  db: Db,
): Promise<ReferralImpactResult> {
  const [eventAgg, referrerCount, signupEvents] = await Promise.all([
    db
      .collection("referral_events")
      .aggregate([{ $group: { _id: "$event", count: { $sum: 1 } } }])
      .toArray(),
    db.collection("referral_codes").countDocuments({}),
    db
      .collection("referral_events")
      .find(
        { event: "referred_signup" },
        { projection: { "context.newUserId": 1 } },
      )
      .limit(5000)
      .toArray(),
  ]);

  const eventCounts: Record<string, number> = {};
  let totalEvents = 0;
  for (const row of eventAgg as any[]) {
    const key = String(row._id || "unknown");
    eventCounts[key] = row.count;
    totalEvents += row.count;
  }

  const referredUserIds = Array.from(
    new Set(
      signupEvents.map((e: any) => s(e?.context?.newUserId)).filter(Boolean),
    ),
  );

  const metrics: EconomicMetric[] = [
    measured(
      "referral_total_events",
      "Total real referral events tracked",
      totalEvents,
      "count",
      ["referral_events"],
    ),
    measured(
      "referral_codes_generated",
      "BWE members with a referral code",
      referrerCount,
      "count",
      ["referral_codes"],
    ),
    measured(
      "referral_signups",
      "Real signups attributed to a referral link",
      eventCounts.referred_signup || 0,
      "count",
      ["referral_events"],
    ),
  ];

  if (referredUserIds.length) {
    const purchases = await db
      .collection("bmev_records")
      .find(
        { paymentVerified: true, buyerUserId: { $in: referredUserIds } },
        { projection: { bmevAmountCents: 1, buyerUserId: 1 } },
      )
      .toArray();

    const purchasingReferredUsers = new Set(
      purchases.map((p: any) => s(p.buyerUserId)),
    );
    const attributedRevenueCents = purchases.reduce(
      (sum, p: any) => sum + (Number(p.bmevAmountCents) || 0),
      0,
    );

    metrics.push(
      attributed(
        "referral_attributed_purchasers",
        "Referred members who went on to make a verified purchase",
        purchasingReferredUsers.size,
        "count",
        ["referral_events", "bmev_records"],
        "Real join: referral_events.context.newUserId matched against bmev_records.buyerUserId for the same user.",
      ),
      attributed(
        "referral_attributed_revenue_cents",
        "Verified purchase revenue from referred members",
        attributedRevenueCents,
        "usd_cents",
        ["referral_events", "bmev_records"],
        "Sum of bmevAmountCents for verified purchases made by users whose signup was tracked via a real referral_signup event. Not a multiplier or projection -- a direct sum of their own real transactions.",
      ),
    );
  } else {
    metrics.push(
      insufficientData(
        "referral_attributed_revenue_cents",
        "Verified purchase revenue from referred members",
        "No referred signups have made a verified purchase yet.",
      ),
    );
  }

  return { metrics, eventCounts };
}
