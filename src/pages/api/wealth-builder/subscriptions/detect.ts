import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import { ensureRecurringIndexes } from "@/lib/wealth-builder/recurring-indexes";

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  await ensureRecurringIndexes();
  const db = await getWealthDb();
  const col = db.collection("financial_transactions");

  const tx = await col
    .find({ userId: auth.userId, accountType: "user", type: "expense" })
    .sort({ date: -1 })
    .limit(1500)
    .toArray();

  const groups = new Map<string, any[]>();
  for (const t of tx) {
    const merchant = norm(String(t.merchant || t.category || ""));
    if (!merchant) continue;
    const key = `${merchant}::${Number(t.amount || 0).toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  let updated = 0;
  const now = new Date();

  for (const [key, items] of groups.entries()) {
    if (items.length < 2) continue;
    const dates = items
      .map((x) => new Date(x.date).getTime())
      .sort((a, b) => a - b);
    const diffs: number[] = [];
    for (let i = 1; i < dates.length; i++)
      diffs.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    const avg = diffs.reduce((a, b) => a + b, 0) / Math.max(1, diffs.length);
    const recurring = avg >= 25 && avg <= 35;
    const confidence = recurring
      ? Math.min(0.99, 0.6 + items.length * 0.05)
      : 0.2;
    const nextExpectedAt = recurring
      ? new Date(dates[dates.length - 1] + avg * 24 * 60 * 60 * 1000)
      : null;
    const [merchantNormalized] = key.split("::");

    const ids = items.map((x) => x._id);
    const r = await col.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          merchantNormalized,
          recurringCandidateKey: key,
          recurringConfidence: Number(confidence.toFixed(2)),
          isSubscription: recurring,
          nextExpectedAt,
          recurringDetectedAt: now,
          updatedAt: now,
        },
      },
    );
    updated += r.modifiedCount;
  }

  return res.status(200).json({ ok: true, updated });
}
