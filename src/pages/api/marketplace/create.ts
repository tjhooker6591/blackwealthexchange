// src/pages/api/marketplace/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Only allow POST for creating a product
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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

  // Validate required fields
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

    return res
      .status(201)
      .json({ success: true, productId: result.insertedId });
  } catch (error) {
    console.error("Error inserting product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
