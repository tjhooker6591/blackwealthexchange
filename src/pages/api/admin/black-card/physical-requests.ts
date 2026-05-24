import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

const ALLOWED = new Set([
  "requested",
  "approved",
  "sent_to_vendor",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
  "replaced",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const status = String(req.query.status || "").trim();
    const filter = status ? { status } : {};
    const items = await db
      .collection("black_card_physical_requests")
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();

    const memberIds = items
      .map((i: any) => String(i.memberId || ""))
      .filter(Boolean);

    const cards = memberIds.length
      ? await db
          .collection("black_card_cards")
          .find({ memberId: { $in: memberIds } })
          .project({ _id: 1, memberId: 1, cardSerial: 1, email: 1, userId: 1 })
          .toArray()
      : [];

    const byMember = new Map<string, any>();
    for (const c of cards) {
      const m = String((c as any).memberId || "");
      if (m && !byMember.has(m)) byMember.set(m, c);
    }

    return res.status(200).json({
      ok: true,
      items: items.map((i: any) => {
        const card = byMember.get(String(i.memberId || ""));
        return {
          requestId: String(i._id),
          memberId: i.memberId || null,
          userId: i.userId || card?.userId || null,
          email: card?.email || null,
          cardId: card?._id ? String(card._id) : null,
          cardSerial: card?.cardSerial || null,
          cardType: i.cardType || null,
          status: i.status || "requested",
          nameToPrint: i.nameToPrint || "",
          vendorRef: i.vendorRef || null,
          trackingNumber: i.trackingNumber || null,
          createdAt: i.createdAt || null,
          updatedAt: i.updatedAt || null,
        };
      }),
      meta: { requestedBy: admin.email || admin.userId || "admin" },
    });
  }

  if (req.method === "PATCH") {
    const requestId = String(req.body?.requestId || "").trim();
    const action = String(req.body?.action || "").trim();
    const nextStatus = String(req.body?.status || "")
      .trim()
      .toLowerCase();

    if (!ObjectId.isValid(requestId)) {
      return res.status(400).json({ ok: false, error: "Invalid requestId" });
    }

    const request = await db
      .collection("black_card_physical_requests")
      .findOne({ _id: new ObjectId(requestId) });
    if (!request) {
      return res.status(404).json({ ok: false, error: "Request not found" });
    }

    let status = nextStatus;
    if (!status && action === "approve") status = "approved";
    if (!status && action === "sent_to_vendor") status = "sent_to_vendor";
    if (!status && action === "shipped") status = "shipped";
    if (!status && action === "delivered") status = "delivered";

    if (!ALLOWED.has(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    const now = new Date();
    await db.collection("black_card_physical_requests").updateOne(
      { _id: request._id },
      {
        $set: {
          status,
          vendorRef: req.body?.vendorRef || request.vendorRef || null,
          trackingNumber:
            req.body?.trackingNumber || request.trackingNumber || null,
          updatedAt: now,
        },
      },
    );

    await db.collection("black_card_audit_events").insertOne({
      eventType: `physical_request_${status}`,
      requestId,
      memberId: request.memberId || null,
      actorAdmin: admin.email || admin.userId || "admin",
      createdAt: now,
    });

    return res.status(200).json({ ok: true, status });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
