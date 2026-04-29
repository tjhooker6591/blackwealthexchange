import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
  const skip = (page - 1) * limit;
  const stream = String(req.query.stream || "").trim();
  const status = String(req.query.status || "").trim();
  const from = String(req.query.from || "").trim();
  const to = String(req.query.to || "").trim();

  const filter: any = {};
  if (stream) filter.revenueStream = stream;
  if (status) filter.paymentStatus = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const db = (await clientPromise).db(getMongoDbName());
  const col = db.collection("financial_ledger");

  const [total, rows] = await Promise.all([
    col.countDocuments(filter),
    col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  res.status(200).json({ page, limit, total, rows });
}
