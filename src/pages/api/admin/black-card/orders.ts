import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

const VALID_STATUS = new Set([
  "pending_profile",
  "ready_to_fulfill",
  "submitted",
  "in_production",
  "shipped",
  "delivered",
  "on_hold",
  "failed",
  "returned",
  "cancelled",
]);

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_profile: ["ready_to_fulfill", "cancelled", "on_hold"],
  ready_to_fulfill: ["submitted", "on_hold", "cancelled"],
  submitted: ["in_production", "on_hold", "cancelled"],
  in_production: ["shipped", "failed", "on_hold"],
  shipped: ["delivered", "returned"],
  delivered: [],
  on_hold: ["ready_to_fulfill", "cancelled"],
  failed: [],
  returned: [],
  cancelled: [],
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const status = String(req.query.status || "")
      .trim()
      .toLowerCase();
    const orderType = String(req.query.orderType || "")
      .trim()
      .toLowerCase();
    const userId = String(req.query.userId || "").trim();

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (userId) query.userId = userId;

    const items = await db
      .collection("black_card_orders")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.status(200).json({
      ok: true,
      items: items.map((item: any) => ({
        id: String(item._id),
        membershipId: String(item.membershipId || ""),
        cardId: item.cardId ? String(item.cardId) : null,
        userId: String(item.userId || ""),
        email: item.email || null,
        orderType: String(item.orderType || "initial"),
        status: String(item.status || "pending_profile"),
        reason: item.reason || null,
        shippingProfileId: item.shippingProfileId || null,
        fulfillmentRef: item.fulfillmentRef || null,
        trackingNumber: item.trackingNumber || null,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      })),
    });
  }

  if (req.method === "PATCH") {
    const orderId = String(req.body?.orderId || "").trim();
    const nextStatus = String(req.body?.status || "")
      .trim()
      .toLowerCase();
    const reason = String(req.body?.reason || "").trim() || null;
    const fulfillmentRef =
      String(req.body?.fulfillmentRef || "").trim() || null;
    const trackingNumber =
      String(req.body?.trackingNumber || "").trim() || null;

    if (
      !orderId ||
      !ObjectId.isValid(orderId) ||
      !VALID_STATUS.has(nextStatus)
    ) {
      return res
        .status(400)
        .json({ ok: false, error: "orderId and valid status are required" });
    }

    const order = await db
      .collection("black_card_orders")
      .findOne({ _id: new ObjectId(orderId) });
    if (!order)
      return res.status(404).json({ ok: false, error: "Order not found" });

    const currentStatus = String(
      order.status || "pending_profile",
    ).toLowerCase();
    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
      return res.status(409).json({
        ok: false,
        error: `Invalid transition from ${currentStatus} to ${nextStatus}`,
      });
    }

    const now = new Date();
    await db.collection("black_card_orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: nextStatus,
          reason,
          fulfillmentRef,
          trackingNumber,
          updatedAt: now,
          lastUpdatedBy: admin.email || admin.userId || null,
        },
      },
    );

    await db.collection("black_card_order_events").insertOne({
      orderId,
      membershipId: String(order.membershipId || ""),
      cardId: order.cardId ? String(order.cardId) : null,
      userId: String(order.userId || ""),
      eventType: "status_transition",
      fromStatus: currentStatus,
      toStatus: nextStatus,
      actorType: "admin",
      actorId: admin.userId || null,
      note: reason,
      createdAt: now,
    });

    await db.collection("black_card_admin_audit").insertOne({
      targetType: "order",
      targetId: orderId,
      action: "order_status_transition",
      orderId,
      membershipId: String(order.membershipId || ""),
      cardId: order.cardId ? String(order.cardId) : null,
      actorId: admin.userId || null,
      reason,
      before: {
        status: currentStatus,
      },
      after: {
        status: nextStatus,
        fulfillmentRef,
        trackingNumber,
      },
      createdAt: now,
    });

    await db.collection("flow_events").insertOne({
      eventType: "black_card_order_status_transitioned",
      orderId,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      actorEmail: admin.email || null,
      createdAt: now,
    });

    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
