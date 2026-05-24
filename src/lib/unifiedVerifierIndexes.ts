import type { Db } from "mongodb";

let ensured = false;

export async function ensureUnifiedVerifierIndexes(db: Db) {
  if (ensured) return;
  await Promise.all([
    db.collection("payments").createIndex({ stripeSessionId: 1 }),
    db.collection("payments").createIndex({ paymentIntentId: 1 }),
    db.collection("payments").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("payments").createIndex({ type: 1, itemId: 1, status: 1 }),
    db.collection("payments").createIndex({
      fulfillmentStatus: 1,
      entitlementStatus: 1,
      updatedAt: -1,
    }),
  ]);
  ensured = true;
}
