import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getBlackCardSession } from "@/lib/black-card-member";

const ORDER_TYPES = new Set(["initial", "replacement", "reissue"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = getBlackCardSession(req);
  if (!session) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const orderType = String(req.body?.orderType || "initial").toLowerCase();
  if (!ORDER_TYPES.has(orderType)) {
    return res.status(400).json({ ok: false, error: "Invalid orderType" });
  }

  const reason = String(req.body?.reason || "").trim() || null;
  const shippingProfileId = String(req.body?.shippingProfileId || "").trim() || null;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();

  const membership = await db.collection("black_card_memberships").findOne(
    { $or: [{ userId: session.userId }, { email: session.email }], status: "active" },
    { projection: { _id: 1, userId: 1, email: 1, status: 1 } },
  );

  if (!membership) {
    return res.status(403).json({ ok: false, error: "Active Black Card membership required" });
  }

  const card = await db
    .collection("black_card_cards")
    .find({ membershipId: String(membership._id) })
    .sort({ issueVersion: -1 })
    .limit(1)
    .next();

  const status = shippingProfileId ? "ready_to_fulfill" : "pending_profile";

  const openExisting = await db.collection("black_card_orders").findOne({
    membershipId: String(membership._id),
    orderType,
    status: { $in: ["pending_profile", "ready_to_fulfill", "submitted", "in_production", "shipped"] },
  });

  if (openExisting) {
    return res.status(409).json({ ok: false, error: "An open order of this type already exists" });
  }

  const orderDoc = {
    membershipId: String(membership._id),
    cardId: card ? String(card._id) : null,
    userId: String(membership.userId || session.userId),
    email: String(membership.email || session.email),
    orderType,
    status,
    reason,
    shippingProfileId,
    requestedBy: "member",
    createdAt: now,
    updatedAt: now,
  };

  const inserted = await db.collection("black_card_orders").insertOne(orderDoc);

  const eventType =
    orderType === "initial"
      ? "order_created"
      : orderType === "replacement"
        ? "replacement_requested"
        : "reissue_requested";

  await db.collection("black_card_order_events").insertOne({
    orderId: String(inserted.insertedId),
    eventType,
    fromStatus: null,
    toStatus: status,
    actorRole: "member",
    actorId: session.userId,
    actorEmail: session.email,
    reason,
    createdAt: now,
  });

  await db.collection("flow_events").insertOne({
    eventType: "black_card_order_created",
    orderId: String(inserted.insertedId),
    orderType,
    status,
    userId: session.userId,
    email: session.email,
    createdAt: now,
  });

  return res.status(200).json({
    ok: true,
    order: {
      id: String(inserted.insertedId),
      orderType,
      status,
    },
  });
}
