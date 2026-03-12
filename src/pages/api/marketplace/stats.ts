import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { resolveSellerSession } from "@/lib/marketplace/sellerSession";

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
    const db = client.db(getMongoDbName());

    const sellerSession = await resolveSellerSession(req, db);
    if (!sellerSession.ok) {
      return res.status(sellerSession.status).json({ error: sellerSession.error });
    }

    const sellerId = sellerSession.sellerId;

    const products = await db.collection("products").countDocuments({ sellerId });

    const [orderStats] = await db
      .collection("orders")
      .aggregate([
        { $match: { sellerId } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: { $ifNull: ["$totalPrice", "$total", 0] } },
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      products,
      orders: Number(orderStats?.count || 0),
      revenue: Number(orderStats?.revenue || 0),
    });
  } catch (err) {
    console.error("Stats: Database error:", err);
    return res.status(500).json({ error: "Failed to fetch seller stats" });
  }
}
