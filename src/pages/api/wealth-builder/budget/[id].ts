import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toNonNegativeNumber,
  toObjectId,
} from "@/lib/wealth-builder/helpers";

type BudgetCategory = {
  name: string;
  plannedAmount: number;
  actualAmount: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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

  if (req.method === "PATCH") {
    const body: Record<string, unknown> =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};

    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (Array.isArray(body.categories)) {
      const categories: BudgetCategory[] = body.categories
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
        .filter((item): item is BudgetCategory => item !== null);

      update.categories = categories;
      update.totalBudgeted = categories.reduce(
        (sum, item) => sum + item.plannedAmount,
        0
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
    const existing = await collection.findOne(filter);
    if (!existing) {
      return res
        .status(404)
        .json({ ok: false, message: "Budget plan not found." });
    }

    await collection.deleteOne(filter);
    return res.status(200).json({ ok: true, deletedId: id });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res
    .status(405)
    .json({ ok: false, message: `Method ${req.method} not allowed.` });
}