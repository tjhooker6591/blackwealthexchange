import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toIntegerInRange,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";

type BudgetCategory = {
  name: string;
  plannedAmount: number;
  actualAmount: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("budget_plans");

  if (req.method === "GET") {
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

    const plan = await collection.findOne({
      userId: auth.userId,
      accountType: "user",
      month,
      year,
    });

    return res.status(200).json({
      ok: true,
      item: serializeDoc(plan),
    });
  }

  if (req.method === "POST") {
    const body: Record<string, unknown> =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};

    const now = new Date();

    const month = toIntegerInRange(body.month, 1, 12, now.getMonth() + 1);
    const year = toIntegerInRange(body.year, 2000, 2100, now.getFullYear());

    const categories: BudgetCategory[] = Array.isArray(body.categories)
      ? body.categories
          .map((item: unknown): BudgetCategory | null => {
            if (!item || typeof item !== "object") return null;

            const category = item as Record<string, unknown>;
            const name =
              typeof category.name === "string" ? category.name.trim() : "";

            if (!name) return null;

            return {
              name,
              plannedAmount: toNonNegativeNumber(category.plannedAmount, 0),
              actualAmount: toNonNegativeNumber(category.actualAmount, 0),
            };
          })
          .filter((item): item is BudgetCategory => item !== null)
      : [];

    const totalBudgeted = categories.reduce(
      (sum, item) => sum + item.plannedAmount,
      0,
    );

    await collection.updateOne(
      { userId: auth.userId, accountType: "user", month, year },
      {
        $set: {
          userId: auth.userId,
          accountType: "user",
          month,
          year,
          categories,
          totalBudgeted: toNonNegativeNumber(body.totalBudgeted, totalBudgeted),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    const saved = await collection.findOne({
      userId: auth.userId,
      accountType: "user",
      month,
      year,
    });

    return res.status(200).json({
      ok: true,
      item: serializeDoc(saved),
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res
    .status(405)
    .json({ ok: false, message: `Method ${req.method} not allowed.` });
}
