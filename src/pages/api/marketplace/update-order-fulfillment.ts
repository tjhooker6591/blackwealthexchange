import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { resolveSellerSession } from "@/lib/marketplace/sellerSession";

function parseOrderId(input: unknown): ObjectId | null {
  const id = String(input || "").trim();
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST" && req.method !== "PUT") {
    res.setHeader("Allow", ["POST", "PUT"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { orderId, fulfillmentState, trackingNumber, trackingCarrier } =
    req.body || {};
  const oid = parseOrderId(orderId);
  if (!oid) {
    return res.status(400).json({ error: "Invalid orderId" });
  }

  const nextState = String(fulfillmentState || "")
    .trim()
    .toLowerCase();
  if (!["processing", "fulfilled", "shipped"].includes(nextState)) {
    return res.status(400).json({
      error: "Invalid fulfillmentState. Use processing, fulfilled, or shipped.",
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMarketplaceDbName());

    const sellerSession = await resolveSellerSession(req, db);
    if (!sellerSession.ok) {
      return res
        .status(sellerSession.status)
        .json({ error: sellerSession.error });
    }

    const order = await db.collection("orders").findOne({ _id: oid });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (String(order?.sellerId || "") !== sellerSession.sellerId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this order" });
    }

    const now = new Date();
    const updateDoc: any = {
      fulfillmentStatus: nextState,
      status: nextState === "processing" ? "paid" : nextState,
      updatedAt: now,
    };

    if (nextState === "shipped" || nextState === "fulfilled") {
      updateDoc.fulfilledAt = now;
    }

    const cleanTrackingNumber = String(trackingNumber || "").trim();
    const cleanTrackingCarrier = String(trackingCarrier || "").trim();
    if (cleanTrackingNumber) updateDoc.trackingNumber = cleanTrackingNumber;
    if (cleanTrackingCarrier) updateDoc.trackingCarrier = cleanTrackingCarrier;

    await db.collection("orders").updateOne({ _id: oid }, { $set: updateDoc });

    await db.collection("flow_events").insertOne({
      eventType: "marketplace_order_fulfillment_updated",
      pageRoute: "/api/marketplace/update-order-fulfillment",
      section: "marketplace_seller_fulfillment",
      source: "seller_orders_api",
      orderId: String(order?._id || ""),
      sellerId: sellerSession.sellerId,
      fulfillmentState: nextState,
      trackingNumber: cleanTrackingNumber || null,
      trackingCarrier: cleanTrackingCarrier || null,
      createdAt: now,
    });

    return res.status(200).json({
      ok: true,
      orderId: String(order?._id || ""),
      fulfillmentState: nextState,
      trackingNumber: cleanTrackingNumber || null,
      trackingCarrier: cleanTrackingCarrier || null,
    });
  } catch (error) {
    console.error("Failed to update order fulfillment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
