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
      return res
        .status(sellerSession.status)
        .json({ error: sellerSession.error });
    }

    const orders = await db
      .collection("orders")
      .find({ sellerId: sellerSession.sellerId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
