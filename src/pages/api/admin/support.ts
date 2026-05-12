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

  const qStatus = String(req.query.status || "").trim();
  const qCategory = String(req.query.category || "").trim();
  const qPriority = String(req.query.priority || "").trim();

  const filter: any = {};
  if (qStatus) filter.status = qStatus;
  if (qCategory) filter.category = qCategory;
  if (qPriority) filter.priority = qPriority;

  const db = (await clientPromise).db(getMongoDbName());
  const docs = await db
    .collection("support_tickets")
    .find(filter, {
      projection: {
        ticketId: 1,
        email: 1,
        subject: 1,
        category: 1,
        priority: 1,
        status: 1,
        assignedTo: 1,
        escalationLevel: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    })
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();

  const rows = docs.map((d: any) => ({
    ticketId: d.ticketId || String(d._id),
    email: d.email || null,
    subject: d.subject || "",
    category: d.category || "General Question",
    priority: d.priority || "normal",
    status: d.status || "new",
    assignedTo: d.assignedTo || null,
    escalationLevel: d.escalationLevel || "none",
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null,
  }));

  return res.status(200).json({ ok: true, rows });
}
