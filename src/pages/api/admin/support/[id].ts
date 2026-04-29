import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { SUPPORT_STATUSES } from "@/lib/support";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  const id = String(req.query.id || "").trim();
  if (!id) return res.status(400).json({ error: "id required" });

  const db = (await clientPromise).db(getMongoDbName());

  if (req.method === "GET") {
    const ticket = await db.collection("support_tickets").findOne(
      { ticketId: id },
      {
        projection: {
          internalNotes: 1,
          ticketId: 1,
          userId: 1,
          accountType: 1,
          name: 1,
          email: 1,
          category: 1,
          priority: 1,
          subject: 1,
          message: 1,
          relatedOrderId: 1,
          relatedPaymentId: 1,
          relatedBusinessId: 1,
          relatedProductId: 1,
          status: 1,
          assignedTo: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    );
    if (!ticket) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ ok: true, ticket });
  }

  if (req.method === "PATCH") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const status = String(body.status || "").trim();
    const internalNote = String(body.internalNote || "").trim();
    const assignedTo = String(body.assignedTo || "").trim();
    const escalationLevel = String(body.escalationLevel || "").trim();
    if (status && !SUPPORT_STATUSES.includes(status as any)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const update: any = { updatedAt: new Date() };
    if (status) update.status = status;
    if (assignedTo) update.assignedTo = assignedTo;
    if (escalationLevel) update.escalationLevel = escalationLevel;
    const push: any = {};
    if (internalNote)
      push.internalNotes = {
        note: internalNote,
        at: new Date(),
        by: admin.email || admin.userId || "admin",
      };
    await db
      .collection("support_tickets")
      .updateOne(
        { ticketId: id },
        { $set: update, ...(internalNote ? { $push: push } : {}) },
      );
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: "Method not allowed" });
}
