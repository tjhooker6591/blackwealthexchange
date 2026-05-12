import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { resolveBuyerSession } from "@/lib/marketplace/buyerSession";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const buyer = resolveBuyerSession(req);
  if (!buyer.ok) {
    return res.status(buyer.status).json({ error: buyer.error });
  }

  const { productId, sellerId, message } = req.body || {};
  const safeProductId = String(productId || "").trim();
  const safeSellerId = String(sellerId || "").trim();
  const safeMessage = String(message || "").trim();

  if (!safeProductId || !safeSellerId || safeMessage.length < 8) {
    return res.status(400).json({
      error: "Missing required fields. Message must be at least 8 characters.",
    });
  }

  if (safeMessage.length > 1000) {
    return res
      .status(400)
      .json({ error: "Message is too long (max 1000 characters)." });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMarketplaceDbName());

    await db.collection("marketplace_messages").insertOne({
      productId: safeProductId,
      sellerId: safeSellerId,
      buyerUserId: buyer.userId || null,
      buyerEmail: buyer.email || null,
      message: safeMessage,
      channel: "mediated_marketplace_message",
      status: "submitted",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection("flow_events").insertOne({
      eventType: "marketplace_buyer_message_submitted",
      pageRoute: "/api/marketplace/contact-seller",
      section: "marketplace_contact",
      source: "mediated_contact_api",
      productId: safeProductId,
      sellerId: safeSellerId,
      buyerUserId: buyer.userId || null,
      buyerEmail: buyer.email || null,
      createdAt: new Date(),
    });

    return res.status(200).json({
      ok: true,
      message:
        "Message sent. BWE will route this to the seller through the marketplace contact channel.",
    });
  } catch (error) {
    console.error("Failed to submit marketplace message:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
