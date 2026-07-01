import type Stripe from "stripe";
import type { Db } from "mongodb";
import { computeRevenueSplit } from "../payments/revenue";

export type MarketplacePaymentUpsertArgs = {
  db: Db;
  stripeSessionId: string;
  paymentIntentId: string | null;
  paidAt: Date;
  orderId: string;
  productId: string;
  sellerId: string;
  payoutMode: string | null;
  amountTotal: number;
  currency?: string | null;
  buyerUserId?: string | null;
  buyerEmail?: string | null;
  webhookEventId?: string | null;
  webhookEventType?: string | null;
};

export function buildMarketplacePaymentRecord(
  args: Omit<MarketplacePaymentUpsertArgs, "db">,
) {
  const split = computeRevenueSplit("marketplace", args.amountTotal);
  return {
    stripeSessionId: args.stripeSessionId,
    paymentIntentId: args.paymentIntentId,
    type: "product",
    amountCents: split.grossAmount,
    status: "paid",
    paidAt: args.paidAt,
    currency: args.currency || "usd",
    userId: args.buyerUserId || null,
    email: args.buyerEmail || null,
    itemId: args.productId,
    bweFee: split.bweFee,
    bweFeePercent: split.bweFeePercent,
    payout: split.sellerPayout,
    metadata: {
      type: "product",
      orderId: args.orderId,
      productId: args.productId,
      sellerId: args.sellerId,
      payoutMode: args.payoutMode || null,
      grossAmount: split.grossAmount,
      bweFee: split.bweFee,
      sellerShare: split.sellerPayout,
      paidAt: args.paidAt.toISOString(),
    },
    orderId: args.orderId,
    productId: args.productId,
    sellerId: args.sellerId,
    payoutMode: args.payoutMode || null,
    lastWebhookEventId: args.webhookEventId || null,
    lastWebhookEventType: args.webhookEventType || null,
    updatedAt: new Date(),
  };
}

export async function upsertMarketplacePaymentRecord(
  args: MarketplacePaymentUpsertArgs,
) {
  const paymentRecord = buildMarketplacePaymentRecord(args);
  await args.db.collection("payments").updateOne(
    { stripeSessionId: args.stripeSessionId },
    {
      $setOnInsert: {
        createdAt: new Date(),
      },
      $set: paymentRecord,
    },
    { upsert: true },
  );
  return paymentRecord;
}

export async function emitMarketplaceReconciliationException(args: {
  db: Db;
  eventType:
    | "marketplace_order_missing_on_paid_webhook"
    | "marketplace_payment_missing_on_paid_webhook"
    | "marketplace_payment_order_link_missing";
  stripeSessionId: string;
  paymentIntentId?: string | null;
  orderId?: string | null;
  productId?: string | null;
  sellerId?: string | null;
  detail?: string | null;
  createdAt?: Date;
}) {
  await args.db.collection("flow_events").insertOne({
    eventType: args.eventType,
    pageRoute: "/api/stripe/webhook-handler",
    section: "marketplace_payment_reconciliation",
    source: "stripe_webhook",
    source_variant: "reconciliation_exception",
    stripeSessionId: args.stripeSessionId,
    paymentIntentId: args.paymentIntentId || null,
    orderId: args.orderId || null,
    productId: args.productId || null,
    sellerId: args.sellerId || null,
    detail: args.detail || null,
    createdAt: args.createdAt || new Date(),
  });
}

export function deriveMarketplaceAmountTotal(args: {
  session: Stripe.Checkout.Session;
  existingAmountCents?: number | null;
  orderRecord?: Record<string, any> | null;
}) {
  if (typeof args.session.amount_total === "number" && args.session.amount_total >= 0) {
    return Math.round(args.session.amount_total);
  }

  const existing = Number(args.existingAmountCents);
  if (Number.isFinite(existing) && existing >= 0) {
    return Math.round(existing);
  }

  const orderTotal = Number(
    args.orderRecord?.totalCents ??
      args.orderRecord?.totalPrice ??
      args.orderRecord?.total ??
      args.orderRecord?.grossAmount ??
      0,
  );

  return Number.isFinite(orderTotal) && orderTotal >= 0
    ? Math.round(orderTotal)
    : 0;
}
