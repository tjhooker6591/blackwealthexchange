import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { resolveSellerSession } from "@/lib/marketplace/sellerSession";
import { ObjectId } from "mongodb";
import { isMarketplaceSellerLiabilityOrder } from "@/lib/marketplace/orderLifecycle";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
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

    const ordersRaw = await db
      .collection("orders")
      .find({ sellerId: sellerSession.sellerId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const productIds = Array.from(
      new Set(
        ordersRaw
          .map((o) => (o?.productId ? String(o.productId) : ""))
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

    const productNameById = new Map<string, string>();
    for (const p of products) {
      const id = String(p?._id || "");
      if (!id) continue;
      productNameById.set(id, String(p?.name || p?.title || ""));
    }

    const orders = ordersRaw.map((o) => {
      const productId = o?.productId ? String(o.productId) : "";
      const totalCents = Number(
        o?.totalCents ?? o?.totalPrice ?? o?.total ?? 0,
      );

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
        ...o,
        productName:
          o?.productName || productNameById.get(productId) || "Unknown product",
        totalCents,
        totalPrice: totalCents / 100,
        orderState: o?.orderState || null,
        paymentState,
        fulfillmentState,
        trackingNumber: o?.trackingNumber || null,
        trackingCarrier: o?.trackingCarrier || null,
        sellerLiabilityActive: isMarketplaceSellerLiabilityOrder(o),
        status: o?.orderState || o?.status || o?.paymentStatus || "pending",
      };
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
