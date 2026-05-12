import type { NextApiRequest, NextApiResponse } from "next";
import { requireWealthUser } from "@/lib/wealth-builder/auth";
import { getWealthDb } from "@/lib/wealth-builder/mongo";
import {
  firstQueryValue,
  toDateOrNull,
  toNonNegativeNumber,
  toObjectId,
} from "@/lib/wealth-builder/helpers";

const ALLOWED_STATUSES = [
  "active",
  "paid",
  "paused",
  "delinquent",
  "collections",
  "closed",
] as const;

type DebtStatus = (typeof ALLOWED_STATUSES)[number];

type DebtApiItem = {
  id: string;
  userId: string;
  accountType: "user";
  name: string;
  lender: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: Date | null;
  category: string;
  status: DebtStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

type DebtDetailResponse = {
  ok: boolean;
  item?: DebtApiItem | null;
  deletedId?: string;
  message?: string;
};

function getDebtStatus(value: unknown): DebtStatus {
  return typeof value === "string" &&
    ALLOWED_STATUSES.includes(value as DebtStatus)
    ? (value as DebtStatus)
    : "active";
}

function formatDebtDoc(doc: any): DebtApiItem {
  return {
    id: doc._id.toString(),
    userId: String(doc.userId ?? ""),
    accountType: "user",
    name: typeof doc.name === "string" ? doc.name : "",
    lender: typeof doc.lender === "string" ? doc.lender : "",
    balance: Number(doc.balance) || 0,
    interestRate: Number(doc.interestRate) || 0,
    minimumPayment: Number(doc.minimumPayment) || 0,
    dueDate:
      doc.dueDate instanceof Date
        ? doc.dueDate
        : doc.dueDate
          ? new Date(doc.dueDate)
          : null,
    category: typeof doc.category === "string" ? doc.category : "",
    status: getDebtStatus(doc.status),
    notes: typeof doc.notes === "string" ? doc.notes : "",
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebtDetailResponse>,
) {
  const auth = await requireWealthUser(req, res);
  if (!auth) return;

  const id = firstQueryValue(req.query.id);
  if (!id) {
    return res.status(400).json({
      ok: false,
      message: "Debt id is required.",
    });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return res.status(400).json({
      ok: false,
      message: "Invalid debt id.",
    });
  }

  const db = await getWealthDb();
  const collection = db.collection("financial_debts");
  const filter = {
    _id: objectId,
    userId: auth.userId,
    accountType: "user" as const,
  };

  if (req.method === "PATCH") {
    try {
      const body = typeof req.body === "object" && req.body ? req.body : {};
      const update: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (typeof body.name === "string") update.name = body.name.trim();
      if (typeof body.lender === "string") update.lender = body.lender.trim();
      if (body.balance !== undefined) {
        update.balance = toNonNegativeNumber(body.balance, 0);
      }
      if (body.interestRate !== undefined) {
        update.interestRate = toNonNegativeNumber(body.interestRate, 0);
      }
      if (body.minimumPayment !== undefined) {
        update.minimumPayment = toNonNegativeNumber(body.minimumPayment, 0);
      }
      if (body.dueDate !== undefined) {
        update.dueDate = toDateOrNull(body.dueDate);
      }
      if (typeof body.category === "string") {
        update.category = body.category.trim();
      }
      if (typeof body.notes === "string") {
        update.notes = body.notes.trim();
      }
      if (typeof body.status === "string") {
        update.status = getDebtStatus(body.status);
      }

      const existing = await collection.findOne(filter);
      if (!existing) {
        return res.status(404).json({
          ok: false,
          message: "Debt record not found.",
        });
      }

      await collection.updateOne(filter, { $set: update });
      const updated = await collection.findOne(filter);

      return res.status(200).json({
        ok: true,
        item: updated ? formatDebtDoc(updated) : null,
      });
    } catch (error) {
      console.error("PATCH /api/wealth-builder/debts/[id] error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to update debt record.",
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const existing = await collection.findOne(filter);
      if (!existing) {
        return res.status(404).json({
          ok: false,
          message: "Debt record not found.",
        });
      }

      await collection.deleteOne(filter);

      return res.status(200).json({
        ok: true,
        deletedId: id,
      });
    } catch (error) {
      console.error("DELETE /api/wealth-builder/debts/[id] error:", error);
      return res.status(500).json({
        ok: false,
        message: "Failed to delete debt record.",
      });
    }
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({
    ok: false,
    message: `Method ${req.method} not allowed.`,
  });
}
