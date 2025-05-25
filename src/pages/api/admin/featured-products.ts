// pages/api/admin/feature-product.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { productId, isFeatured } = req.body;
    if (!productId || typeof isFeatured !== "boolean") {
      return res.status(400).json({ error: "Missing parameters." });
    }
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    await db
      .collection("products")
      .updateOne({ _id: new ObjectId(productId) }, { $set: { isFeatured } });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[feature-product] Error:", err);
    res.status(500).json({ error: "Failed to update featured status." });
  }
  
}
