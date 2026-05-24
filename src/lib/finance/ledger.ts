import { Db } from "mongodb";

export function isFinancialLedgerEnabled() {
  return (
    String(process.env.ENABLE_FINANCIAL_LEDGER || "false").toLowerCase() ===
    "true"
  );
}

export async function ensureFinancialLedgerIndexes(db: Db) {
  const col = db.collection("financial_ledger");
  await Promise.all([
    col.createIndex(
      { webhookEventId: 1 },
      {
        unique: true,
        partialFilterExpression: { webhookEventId: { $type: "string" } },
      },
    ),
    col.createIndex({ stripeSessionId: 1 }),
    col.createIndex({ revenueStream: 1 }),
    col.createIndex({ createdAt: -1 }),
    col.createIndex({ paymentStatus: 1 }),
  ]);
}

export function redactStripeId(v: unknown) {
  const s = typeof v === "string" ? v : "";
  if (!s) return null;
  return `${s.slice(0, 12)}••••`;
}

export function adminSafeLedgerProjection() {
  return {
    _id: 0,
    transactionId: 1,
    stripeSessionId: 1,
    stripePaymentIntentId: 1,
    revenueStream: 1,
    grossAmount: 1,
    bweFeeAmount: 1,
    sellerPayoutAmount: 1,
    netBweRevenue: 1,
    paymentStatus: 1,
    fulfillmentStatus: 1,
    payoutStatus: 1,
    refundStatus: 1,
    disputeStatus: 1,
    sourceRoute: 1,
    userId: 1,
    createdAt: 1,
    updatedAt: 1,
  };
}
