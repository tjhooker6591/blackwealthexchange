import type { Db } from "mongodb";

let ensured = false;

export async function ensureFinancialClassIndexes(db: Db) {
  if (ensured) return;

  await Promise.all([
    db.collection("payments").createIndex({ stripeSessionId: 1 }),
    db.collection("payments").createIndex({ paymentIntentId: 1 }),
    db.collection("payments").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("payments").createIndex({ type: 1, itemId: 1, status: 1 }),

    db
      .collection("enrollments")
      .createIndex({ userId: 1, courseId: 1 }, { unique: true }),
    db.collection("enrollments").createIndex({ sourceStripeSessionId: 1 }),

    db
      .collection("financial_class_admin_audit")
      .createIndex({ stripeSessionId: 1, createdAt: -1 }),
    db
      .collection("financial_class_admin_audit")
      .createIndex({ userId: 1, createdAt: -1 }),
  ]);

  ensured = true;
}
