import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  serializeDocs,
  toDateOrNull,
  toNonNegativeNumber,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_STATUSES = [
  "active",
  "paid",
  "paused",
  "delinquent",
  "collections",
  "closed",
] as const;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const db = await getWealthDb();
  const collection = db.collection("financial_debts");

  if (req.method === "GET") {
    const debts = await collection
      .find({ userId: auth.userId, accountType: "user" })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    return res.status(200).json({
      ok: true,
      items: serializeDocs(debts),
    });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "object" && req.body ? req.body : {};

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return res
        .status(400)
        .json({ ok: false, message: "Debt name is required." });
    }

    const status = ALLOWED_STATUSES.includes(body.status)
      ? body.status
      : "active";
    const now = new Date();

    const doc = {
      userId: auth.userId,
      accountType: "user",
      name,
      lender: typeof body.lender === "string" ? body.lender.trim() : "",
      balance: toNonNegativeNumber(body.balance, 0),
      interestRate: toNonNegativeNumber(body.interestRate, 0),
      minimumPayment: toNonNegativeNumber(body.minimumPayment, 0),
      dueDate: toDateOrNull(body.dueDate),
      category: typeof body.category === "string" ? body.category.trim() : "",
      status,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
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
  return res
    .status(405)
    .json({ ok: false, message: `Method ${req.method} not allowed.` });
}
