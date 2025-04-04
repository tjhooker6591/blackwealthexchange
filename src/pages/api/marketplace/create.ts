// /pages/api/marketplace/create.ts
import clientPromise from "@/lib/mongodb";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const {
    name,
    description,
    price,
    category,
    imageUrl,
    stockQuantity = 0,
    isFeatured = false,
    sellerId = "demo_user", // Replace with actual session user ID later
  } = req.body;

  if (!name || !description || !price || !category || !imageUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const newProduct = {
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl,
      stockQuantity,
      isFeatured,
      sellerId,
      createdAt: new Date(),
    };

    const result = await db.collection("products").insertOne(newProduct);
    return res.status(200).json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error inserting product:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
