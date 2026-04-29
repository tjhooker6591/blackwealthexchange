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

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = (await clientPromise).db(getMongoDbName());
  const docs = await db
    .collection("support_tickets")
    .find({}, { projection: { email: 1, subject: 1, priority: 1, status: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const rows = docs.map((d: any) => ({
    ticketId: String(d._id),
    email: d.email || null,
    subject: d.subject || "",
    priority: d.priority || "normal",
    status: d.status || "open",
    createdAt: d.createdAt || null,
  }));

  return res.status(200).json({ ok: true, rows });
}
