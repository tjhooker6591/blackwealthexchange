// src/lib/foundingMembershipRefund.ts
//
// Rejecting a claim (the person who paid is not the owner) cancels the
// Founding membership and refunds what was paid -- the same for every
// listing type. Used by the business and organization claim reviews.

import Stripe from "stripe";
import type { Db } from "mongodb";
import { requireStripeSecretKey } from "@/lib/stripeSecret";

let client: Stripe | null = null;
function stripe() {
  if (!client)
    client = new Stripe(requireStripeSecretKey(), {
      apiVersion: "2025-02-24.acacia" as any,
    });
  return client;
}

export type RefundResult = {
  cancelled: boolean;
  refundedCents: number;
  refundIds: string[];
  note?: string;
};

export async function cancelAndRefundFoundingMembership(
  db: Db,
  membershipId: string,
  actor: { email?: string | null; reason?: string | null },
  deps: {
    stripe?: Pick<Stripe, "subscriptions" | "invoices" | "refunds">;
  } = {},
): Promise<RefundResult> {
  const membership: any = await db
    .collection("business_memberships")
    .findOne({ membershipId });
  if (!membership)
    return {
      cancelled: false,
      refundedCents: 0,
      refundIds: [],
      note: "no membership on record",
    };
  if (membership.refundedAt)
    return {
      cancelled: true,
      refundedCents: Number(membership.refundedCents || 0),
      refundIds: membership.refundIds || [],
      note: "already refunded",
    };

  const subId: string | null = membership.stripeSubscriptionId || null;
  const refundIds: string[] = [];
  let refundedCents = 0;

  if (subId) {
    const s = (deps.stripe as Stripe) || stripe();
    try {
      await s.subscriptions.cancel(subId, {
        invoice_now: false,
        prorate: false,
      });
    } catch (err: any) {
      if (
        err?.code !== "resource_missing" &&
        !/canceled/i.test(String(err?.message))
      )
        throw err;
    }
    const invoices = await s.invoices.list({
      subscription: subId,
      status: "paid",
      limit: 100,
    });
    for (const inv of invoices.data as any[]) {
      if (!inv.amount_paid) continue;
      const paymentIntent =
        typeof inv.payment_intent === "string"
          ? inv.payment_intent
          : inv.payment_intent?.id;
      const charge =
        typeof inv.charge === "string" ? inv.charge : inv.charge?.id;
      if (!paymentIntent && !charge) continue;
      const refund = await s.refunds.create(
        {
          ...(paymentIntent ? { payment_intent: paymentIntent } : { charge }),
          reason: "requested_by_customer",
          metadata: { membershipId, cause: "claim_rejected" },
        },
        { idempotencyKey: `claim-rejected-refund:${inv.id}` },
      );
      refundIds.push(refund.id);
      refundedCents += refund.amount || 0;
    }
  }

  const now = new Date();
  await db.collection("business_memberships").updateOne(
    { membershipId },
    {
      $set: {
        membershipStatus: "cancelled",
        cancelledReason: "claim_rejected",
        canceledAt: now,
        refundedAt: now,
        refundedCents,
        refundIds,
        refundedBy: actor.email || null,
        refundReason: actor.reason || null,
        updatedAt: now,
      },
    },
  );
  await db.collection("payments").updateMany(
    { membershipId },
    {
      $set: {
        refundStatus: refundedCents > 0 ? "refunded" : "none_due",
        refundedAt: now,
        refundedAmountCents: refundedCents,
        updatedAt: now,
      },
    },
  );
  return {
    cancelled: true,
    refundedCents,
    refundIds,
    note: subId ? undefined : "no Stripe subscription on record",
  };
}
