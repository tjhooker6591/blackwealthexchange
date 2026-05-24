import { getWealthDb } from "@/lib/wealth-builder/mongo";
let ensured = false;
export async function ensureRecurringIndexes() {
  if (ensured) return;
  const db = await getWealthDb();
  await Promise.all([
    db
      .collection("financial_transactions")
      .createIndex({ userId: 1, date: -1 }),
    db
      .collection("financial_transactions")
      .createIndex({ userId: 1, merchantNormalized: 1, amount: 1, date: -1 }),
    db
      .collection("financial_transactions")
      .createIndex({ userId: 1, isSubscription: 1, nextExpectedAt: 1 }),
  ]);
  ensured = true;
}
