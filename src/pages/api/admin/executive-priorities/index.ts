import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  const db = (await clientPromise).db(getMongoDbName());
  if (req.method === "GET") {
    const rows = await db
      .collection("executive_priorities")
      .find({})
      .sort({ priorityRank: 1, updatedAt: -1 })
      .toArray();
    return res.status(200).json({ ok: true, rows });
  }
  if (req.method === "POST") {
    const b =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const now = new Date();
    const doc = {
      title: String(b.title || ""),
      description: String(b.description || ""),
      priorityRank: Number(b.priorityRank || 999),
      status: String(b.status || "active"),
      owner: String(b.owner || ""),
      dueDate: b.dueDate ? new Date(b.dueDate) : null,
      businessLine: String(b.businessLine || ""),
      impactArea: String(b.impactArea || ""),
      requiresFounderDecision: Boolean(b.requiresFounderDecision),
      createdAt: now,
      updatedAt: now,
    };
    const r = await db.collection("executive_priorities").insertOne(doc);
    return res.status(201).json({ ok: true, id: String(r.insertedId) });
  }
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({
    ok: false,
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed",
  });
}
