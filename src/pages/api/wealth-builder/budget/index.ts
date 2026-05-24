import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toIntegerInRange,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";
import { getWealthBuilderEntitlementForUser } from "@/lib/wealth-builder/entitlements";

type BudgetCategory = {
  name: string;
  plannedAmount: number;
  actualAmount: number;
};

function isCurrentMonthYear(month: number, year: number) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  return month === currentMonth && year === currentYear;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("budget_plans");
  const entitlement = await getWealthBuilderEntitlementForUser(auth.userId);

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

    if (
      entitlement.limits.currentMonthBudgetOnly &&
      !isCurrentMonthYear(month, year)
    ) {
      return res.status(403).json({
        ok: false,
        code: "PREMIUM_REQUIRED",
        message:
          "Free Wealth Builder includes current-month budget only. Upgrade to Premium for budget history.",
      });
    }

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
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const now = new Date();

    const month = toIntegerInRange(body.month, 1, 12, now.getMonth() + 1);
    const year = toIntegerInRange(body.year, 2000, 2100, now.getFullYear());

    if (
      entitlement.limits.currentMonthBudgetOnly &&
      !isCurrentMonthYear(month, year)
    ) {
      return res.status(403).json({
        ok: false,
        code: "PREMIUM_REQUIRED",
        message:
          "Free Wealth Builder can only create/update the current month budget. Upgrade to Premium for historical budgets.",
      });
    }

    const categories: BudgetCategory[] = Array.isArray(body.categories)
      ? (body.categories
          .map((item: any): BudgetCategory | null => {
            if (!item || typeof item !== "object") return null;
            const name = typeof item.name === "string" ? item.name.trim() : "";
            if (!name) return null;

            return {
              name,
              plannedAmount: toNonNegativeNumber(item.plannedAmount, 0),
              actualAmount: toNonNegativeNumber(item.actualAmount, 0),
            };
          })
          .filter(Boolean) as BudgetCategory[])
      : [];

    const totalBudgeted = categories.reduce(
      (sum: number, item: BudgetCategory) => sum + item.plannedAmount,
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
