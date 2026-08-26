import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { resolveBuyerSession } from "@/lib/marketplace/buyerSession";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const sessionId =
    typeof req.query.session_id === "string" ? req.query.session_id.trim() : "";
  if (!sessionId) {
    return res.status(400).json({ error: "Missing session_id" });
  }

  const buyer = resolveBuyerSession(req);
  if (!buyer.ok) {
    return res.status(buyer.status).json({ error: buyer.error });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMarketplaceDbName());
    const ordersCol = db.collection<any>("orders");
    const productsCol = db.collection<any>("products");

    const order = await ordersCol.findOne({
      sessionId,
      $or: [
        ...(buyer.userId ? [{ buyerUserId: buyer.userId }] : []),
        ...(buyer.email ? [{ buyerEmail: buyer.email }] : []),
      ],
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const productId = String(order?.productId || "").trim();
    let product: any | null = null;
    if (productId) {
      product = await productsCol.findOne({
        $or: [
          { _id: productId },
          ...(ObjectId.isValid(productId)
            ? [{ _id: new ObjectId(productId) }]
            : []),
        ],
      });
    }

    return res.status(200).json({
      order: {
        orderId: String(order?._id || ""),
        sessionId,
        productId,
        productName:
          String(order?.productName || "").trim() ||
          String(product?.name || product?.title || "").trim() ||
          "Marketplace Product",
        paymentStatus: String(order?.paymentStatus || "pending"),
        fulfillmentStatus: String(order?.fulfillmentStatus || "pending"),
        sellerName:
          String(order?.sellerName || "").trim() ||
          String(product?.sellerName || "").trim() ||
          "BWE Marketplace Seller",
        businessId:
          typeof order?.businessId === "string" ? order.businessId : null,
      },
    });
  } catch (error) {
    console.error("Failed to load marketplace order confirmation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
