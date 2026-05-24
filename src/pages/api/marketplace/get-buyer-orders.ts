import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { resolveBuyerSession } from "@/lib/marketplace/buyerSession";

function normalizeTimeline(order: any) {
  const paymentStatus = String(order?.paymentStatus || "pending").toLowerCase();
  const orderState = String(
    order?.orderState || order?.status || "pending",
  ).toLowerCase();
  const fulfillmentStatus = String(
    order?.fulfillmentStatus || "pending",
  ).toLowerCase();

  const orderedDone = true;
  const processingDone =
    ["paid", "fulfilled", "ready"].includes(paymentStatus) ||
    [
      "paid_unfulfilled",
      "fulfilled_payout_ready",
      "fulfilled_payout_pending",
    ].includes(orderState) ||
    ["processing", "fulfilled", "shipped"].includes(fulfillmentStatus);
  const shippedDone = ["shipped", "fulfilled", "delivered"].includes(
    fulfillmentStatus,
  );

  return [
    { key: "ordered", label: "Ordered", done: orderedDone },
    { key: "processing", label: "Processing", done: processingDone },
    { key: "shipped", label: "Shipped", done: shippedDone },
  ];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const buyer = resolveBuyerSession(req);
  if (!buyer.ok) {
    return res.status(buyer.status).json({ error: buyer.error });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMarketplaceDbName());

    const buyerMatch = {
      $or: [
        ...(buyer.userId ? [{ buyerUserId: buyer.userId }] : []),
        ...(buyer.email ? [{ buyerEmail: buyer.email }] : []),
      ],
    } as any;

    const ordersRaw = await db
      .collection("orders")
      .find(buyerMatch)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const productIds = Array.from(
      new Set(
        ordersRaw
          .map((o: any) => (o?.productId ? String(o.productId) : ""))
          .filter(Boolean),
      ),
    );

    const objectProductIds = productIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const products = productIds.length
      ? await db
          .collection("products")
          .find({
            $or: [
              { _id: { $in: productIds } },
              { _id: { $in: objectProductIds } },
            ],
          } as any)
          .toArray()
      : [];

    const productById = new Map<string, any>();
    for (const p of products) {
      productById.set(String(p?._id || ""), p);
    }

    const orders = ordersRaw.map((o: any) => {
      const productId = String(o?.productId || "");
      const product = productById.get(productId);
      const sellerName =
        String(o?.sellerName || "").trim() ||
        String(product?.sellerName || "").trim() ||
        "BWE Marketplace Seller";

      const paymentState = String(o?.paymentStatus || "pending").toLowerCase();
      const fulfillmentState = String(
        o?.fulfillmentStatus ||
          (["shipped", "fulfilled"].includes(
            String(o?.status || "").toLowerCase(),
          )
            ? String(o?.status).toLowerCase()
            : "processing"),
      ).toLowerCase();

      return {
        _id: String(o?._id || ""),
        createdAt: o?.createdAt || null,
        productId,
        productName: o?.productName || product?.name || "Marketplace Product",
        totalCents: Number(o?.totalCents ?? o?.totalPrice ?? o?.total ?? 0),
        paymentState,
        fulfillmentState,
        orderState: String(o?.orderState || ""),
        trackingNumber: o?.trackingNumber || null,
        trackingCarrier: o?.trackingCarrier || null,
        sellerName,
        timeline: normalizeTimeline(o),
      };
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Failed to fetch buyer orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
