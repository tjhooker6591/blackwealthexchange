import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  serializeDocs,
  toDateOrNull,
  toIntegerInRange,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_TYPES = ["income", "expense", "transfer", "debt-payment", "savings"] as const;
const ALLOWED_SOURCES = ["manual", "import", "sync", "adjustment"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("financial_transactions");

  if (req.method === "GET") {
    const filter: Record<string, unknown> = {
      userId: auth.userId,
      accountType: "user",
    };

    const type = firstQueryValue(req.query.type);
    const category = firstQueryValue(req.query.category);
    const from = toDateOrNull(firstQueryValue(req.query.from));
    const to = toDateOrNull(firstQueryValue(req.query.to));
    const limit = toIntegerInRange(firstQueryValue(req.query.limit), 1, 500, 100);

    if (type && ALLOWED_TYPES.includes(type as any)) filter.type = type;
    if (category) filter.category = category;

    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>).$gte = from;
      if (to) (filter.date as Record<string, unknown>).$lte = to;
    }

    const items = await collection.find(filter).sort({ date: -1, createdAt: -1 }).limit(limit).toArray();

    return res.status(200).json({
      ok: true,
      items: serializeDocs(items),
    });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "object" && req.body ? req.body : {};

    const category = typeof body.category === "string" ? body.category.trim() : "";
    if (!category) {
      return res.status(400).json({ ok: false, message: "Transaction category is required." });
    }

    const type = ALLOWED_TYPES.includes(body.type) ? body.type : "expense";
    const source = ALLOWED_SOURCES.includes(body.source) ? body.source : "manual";
    const date = toDateOrNull(body.date) || new Date();
    const now = new Date();

    const doc = {
      userId: auth.userId,
      accountType: "user",
      date,
      amount: toNonNegativeNumber(body.amount, 0),
      category,
      merchant: typeof body.merchant === "string" ? body.merchant.trim() : "",
      type,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
      source,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    const created = await collection.findOne({ _id: result.insertedId });

    return res.status(201).json({
      ok: true,
      item: created ? { id: created._id.toString(), ...doc } : null,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, message: `Method ${req.method} not allowed.` });
}
