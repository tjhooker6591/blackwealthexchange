import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDoc,
  toDateOrNull,
  toNonNegativeNumber,
  toObjectId,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_STATUSES = ["active", "completed", "paused", "cancelled", "archived"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const id = firstQueryValue(req.query.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "Goal id is required." });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return res.status(400).json({ ok: false, message: "Invalid goal id." });
  }

  const db = await getWealthDb();
  const collection = db.collection("savings_goals");
  const filter = { _id: objectId, userId: auth.userId, accountType: "user" as const };

  if (req.method === "PATCH") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.goalName === "string") update.goalName = body.goalName.trim();
    if (body.targetAmount !== undefined) update.targetAmount = toNonNegativeNumber(body.targetAmount, 0);
    if (body.currentAmount !== undefined) update.currentAmount = toNonNegativeNumber(body.currentAmount, 0);
    if (body.targetDate !== undefined) update.targetDate = toDateOrNull(body.targetDate);
    if (body.monthlyContributionTarget !== undefined) {
      update.monthlyContributionTarget = toNonNegativeNumber(body.monthlyContributionTarget, 0);
    }
    if (ALLOWED_STATUSES.includes(body.status)) update.status = body.status;

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
      return res.status(404).json({ ok: false, message: "Goal record not found." });
    }

    await collection.deleteOne(filter);
    return res.status(200).json({ ok: true, deletedId: id });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
