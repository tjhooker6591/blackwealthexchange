import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toNonNegativeNumber,
  toObjectId,
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

  const id = firstQueryValue(req.query.id);
  if (!id) {
    return res
      .status(400)
      .json({ ok: false, message: "Budget id is required." });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return res.status(400).json({ ok: false, message: "Invalid budget id." });
  }

  const db = await getWealthDb();
  const collection = db.collection("budget_plans");
  const filter = {
    _id: objectId,
    userId: auth.userId,
    accountType: "user" as const,
  };
  const entitlement = await getWealthBuilderEntitlementForUser(auth.userId);
  const existing = await collection.findOne(filter);

  if (!existing) {
    return res
      .status(404)
      .json({ ok: false, message: "Budget plan not found." });
  }

  const existingMonth = Number(existing.month);
  const existingYear = Number(existing.year);

  if (
    entitlement.limits.currentMonthBudgetOnly &&
    Number.isFinite(existingMonth) &&
    Number.isFinite(existingYear) &&
    !isCurrentMonthYear(existingMonth, existingYear)
  ) {
    return res.status(403).json({
      ok: false,
      code: "PREMIUM_REQUIRED",
      message:
        "Free Wealth Builder can only modify current month budget. Upgrade to Premium for budget history updates.",
    });
  }

  if (req.method === "PATCH") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (Array.isArray(body.categories)) {
      const categories: BudgetCategory[] = body.categories
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
        .filter(Boolean) as BudgetCategory[];

      update.categories = categories;
      update.totalBudgeted = categories.reduce(
        (sum: number, item: BudgetCategory) => sum + item.plannedAmount,
        0,
      );
    }

    if (body.totalBudgeted !== undefined) {
      update.totalBudgeted = toNonNegativeNumber(body.totalBudgeted, 0);
    }

    await collection.updateOne(filter, { $set: update });
    const updated = await collection.findOne(filter);

    return res.status(200).json({
      ok: true,
      item: serializeDoc(updated),
    });
  }

  if (req.method === "DELETE") {
    await collection.deleteOne(filter);
    return res.status(200).json({ ok: true, deletedId: id });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res
    .status(405)
    .json({ ok: false, message: `Method ${req.method} not allowed.` });
}
