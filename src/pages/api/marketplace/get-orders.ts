import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb+srv://bwes_admin:M4LmIzY5EjKPODPJ@bwes-cluster.3lko7.mongodb.net/?retryWrites=true&w=majority&appName=BWES-Cluster";
const client = new MongoClient(uri);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await client.connect();
    const db = client.db("bwes-cluster");
    const ordersCollection = db.collection("orders");

    // TEMP: Mock sellerId (replace with auth-based filtering later)
    const mockSellerId = "1234567890";

    const orders = await ordersCollection
      .find({ sellerId: mockSellerId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    await client.close();
  }
}
