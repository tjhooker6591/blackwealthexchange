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

const ALLOWED_TYPES = ["income", "expense", "transfer", "debt-payment", "savings"] as const;
const ALLOWED_SOURCES = ["manual", "import", "sync", "adjustment"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const id = firstQueryValue(req.query.id);
  if (!id) {
    return res.status(400).json({ ok: false, message: "Transaction id is required." });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return res.status(400).json({ ok: false, message: "Invalid transaction id." });
  }

  const db = await getWealthDb();
  const collection = db.collection("financial_transactions");
  const filter = { _id: objectId, userId: auth.userId, accountType: "user" as const };

  if (req.method === "PATCH") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (body.date !== undefined) update.date = toDateOrNull(body.date);
    if (body.amount !== undefined) update.amount = toNonNegativeNumber(body.amount, 0);
    if (typeof body.category === "string") update.category = body.category.trim();
    if (typeof body.merchant === "string") update.merchant = body.merchant.trim();
    if (typeof body.notes === "string") update.notes = body.notes.trim();
    if (ALLOWED_TYPES.includes(body.type)) update.type = body.type;
    if (ALLOWED_SOURCES.includes(body.source)) update.source = body.source;

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
      return res.status(404).json({ ok: false, message: "Transaction record not found." });
    }

    await collection.deleteOne(filter);
    return res.status(200).json({ ok: true, deletedId: id });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
