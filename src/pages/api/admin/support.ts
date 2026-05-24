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
  const qAssignedTo = String(req.query.assignedTo || "").trim();
  const qUnassigned = String(req.query.unassigned || "").trim() === "1";
  const qEscalated = String(req.query.escalated || "").trim() === "1";
  const qSearch = String(req.query.search || "").trim();

  const filter: any = {};
  if (qStatus) filter.status = qStatus;
  if (qCategory) filter.category = qCategory;
  if (qPriority) filter.priority = qPriority;
  if (qAssignedTo) filter.assignedTo = qAssignedTo;
  if (qUnassigned)
    filter.$or = [
      { assignedTo: { $exists: false } },
      { assignedTo: "" },
      { assignedTo: null },
    ];
  if (qEscalated) filter.escalationLevel = { $nin: ["", "none", null] };

  if (qSearch) {
    const rx = {
      $regex: qSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
    const searchOr = [
      { ticketId: rx },
      { email: rx },
      { name: rx },
      { subject: rx },
      { relatedOrderId: rx },
      { relatedPaymentId: rx },
      { relatedProductId: rx },
      { relatedBusinessId: rx },
      { relatedJobId: rx },
      { relatedAdCampaignId: rx },
    ];
    filter.$and = [...(filter.$and || []), { $or: searchOr }];
  }

  const db = (await clientPromise).db(getMongoDbName());
  const docs = await db
    .collection("support_tickets")
    .find(filter, {
      projection: {
        ticketId: 1,
        name: 1,
        email: 1,
        subject: 1,
        category: 1,
        priority: 1,
        status: 1,
        assignedTo: 1,
        escalationLevel: 1,
        createdAt: 1,
        updatedAt: 1,
        publicReplies: 1,
        firstResponseAt: 1,
      },
    })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  const now = Date.now();
  const rows = docs.map((d: any) => {
    const replies = Array.isArray(d.publicReplies) ? d.publicReplies : [];
    const lastReply = replies.length ? replies[replies.length - 1] : null;
    const ageHours = d.createdAt
      ? Math.floor((now - new Date(d.createdAt).getTime()) / 36e5)
      : null;
    const needsResponse =
      d.status === "New" ||
      d.status === "In Review" ||
      (lastReply && lastReply.from === "user");
    return {
      ticketId: d.ticketId || String(d._id),
      name: d.name || "",
      email: d.email || null,
      subject: d.subject || "",
      category: d.category || "General Question",
      priority: d.priority || "Normal",
      status: d.status || "New",
      assignedTo: d.assignedTo || null,
      escalationLevel: d.escalationLevel || "none",
      createdAt: d.createdAt || null,
      updatedAt: d.updatedAt || null,
      ageHours,
      sla:
        ageHours == null
          ? "-"
          : ageHours > 72
            ? "BREACH"
            : ageHours > 24
              ? "WARN"
              : "OK",
      lastReplyDirection: lastReply?.from || null,
      needsResponse: Boolean(needsResponse),
      firstResponseAt: d.firstResponseAt || null,
    };
  });

  return res.status(200).json({ ok: true, rows });
}
