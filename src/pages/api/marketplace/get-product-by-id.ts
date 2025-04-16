// src/pages/api/marketplace/get-product-by-id.ts
import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Validate and parse the product ID
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Missing or invalid product ID" });
  }

  let productId: ObjectId;
  try {
    productId = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: "Invalid product ID format" });
  }

  try {
    // Reuse the shared MongoDB client
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const product = await db.collection("products").findOne({ _id: productId });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
