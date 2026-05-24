import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  getMonthRange,
  toIntegerInRange,
} from "@/lib/wealth-builder/helpers";

type SuggestedActual = {
  category: string;
  amount: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ ok: false, message: `Method ${req.method} not allowed.` });
  }

  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const now = new Date();
  const month = toIntegerInRange(
    firstQueryValue(req.query.month),
    1,
    12,
    now.getMonth() + 1,
  );
  const year = toIntegerInRange(
    firstQueryValue(req.query.year),
    2000,
    2100,
    now.getFullYear(),
  );

  const { start, end } = getMonthRange(year, month);

  const db = await getWealthDb();
  const transactions = db.collection("financial_transactions");

  const expenses = await transactions
    .find({
      userId: auth.userId,
      accountType: "user",
      type: "expense",
      date: { $gte: start, $lt: end },
    })
    .toArray();

  const totals = expenses.reduce<Record<string, number>>((acc, item: any) => {
    const key =
      typeof item.category === "string" && item.category.trim()
        ? item.category.trim()
        : "Other";
    acc[key] =
      (acc[key] || 0) + (typeof item.amount === "number" ? item.amount : 0);
    return acc;
  }, {});

  const suggestedActuals: SuggestedActual[] = Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return res.status(200).json({
    ok: true,
    month,
    year,
    suggestedActuals,
    transactionCount: expenses.length,
  });
}
