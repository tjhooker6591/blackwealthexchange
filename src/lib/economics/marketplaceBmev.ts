import type { Db } from "mongodb";

export type MarketplaceBmevUpsertArgs = {
  db: Db;
  orderId: string;
  stripeSessionId: string;
  paymentIntentId?: string | null;
  productId: string;
  sellerId: string | null;
  businessId?: string | null;
  buyerUserId?: string | null;
  buyerEmail?: string | null;
  subtotalCents: number;
  shippingCents?: number;
  currency?: string | null;
  occurredAt: Date;
  webhookEventId?: string | null;
  webhookEventType?: string | null;
  paymentRecordId?: string | null;
  bweFeeCents?: number | null;
  sellerProceedsCents?: number | null;
};

function cents(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function buildMarketplaceBmevRecord(
  args: Omit<MarketplaceBmevUpsertArgs, "db">,
) {
  const subtotalCents = cents(args.subtotalCents);
  const shippingCents = cents(args.shippingCents);
  const bweFeeCents = cents(args.bweFeeCents);
  const sellerProceedsCents = cents(args.sellerProceedsCents);
  const economicTransactionId = `marketplace:${args.orderId || args.stripeSessionId}`;

  return {
    economicTransactionId,
    source: "marketplace",
    businessLine: "marketplace_product_sale",
    attributionMethod: "verified_paid_webhook",
    proofLevel: "verified_payment_truth",
    proofReference: args.stripeSessionId,
    deduplicationKey: economicTransactionId,
    orderId: args.orderId,
    stripeSessionId: args.stripeSessionId,
    paymentIntentId: args.paymentIntentId || null,
    paymentRecordId: args.paymentRecordId || null,
    productId: args.productId,
    sellerId: args.sellerId || null,
    businessId: args.businessId || null,
    buyerUserId: args.buyerUserId || null,
    buyerEmail: args.buyerEmail || null,
    currency: args.currency || "usd",

    // Defensible marketplace policy:
    // BMEV counts the merchandise subtotal only. Shipping is preserved separately.
    bmevAmountCents: subtotalCents,
    merchandiseAmountCents: subtotalCents,
    shippingAmountCents: shippingCents,
    salesTaxAmountCents: 0,
    refundedAmountCents: 0,
    chargebackAmountCents: 0,

    paymentVerified: true,
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled_or_pending",
    occurredAt: args.occurredAt,

    bweFeeCents,
    sellerProceedsCents,
    updatedAt: new Date(),
  };
}

export async function upsertMarketplaceBmevRecord(
  args: MarketplaceBmevUpsertArgs,
) {
  const record = buildMarketplaceBmevRecord(args);
  await args.db.collection("bmev_records").updateOne(
    { economicTransactionId: record.economicTransactionId },
    {
      $setOnInsert: {
        createdAt: new Date(),
      },
      $set: {
        ...record,
        lastWebhookEventId: args.webhookEventId || null,
        lastWebhookEventType: args.webhookEventType || null,
      },
    },
    { upsert: true },
  );
  return record;
}
