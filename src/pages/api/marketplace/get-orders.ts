// File: /pages/api/marketplace/get-orders.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Reuse the singleton client
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const ordersCollection = db.collection("orders");

    // TODO: replace mockSellerId with real sellerId from your auth token
    const mockSellerId = "1234567890";

    const orders = await ordersCollection
      .find({ sellerId: mockSellerId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
