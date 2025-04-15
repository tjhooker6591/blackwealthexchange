// src/pages/api/marketplace/update-products.ts
import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

interface DecodedToken {
  userId: string;
  email: string;
  accountType: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Only allow PUT
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Parse and verify JWT from session_token cookie
  const rawCookie = req.headers.cookie || "";
  const cookies = parse(rawCookie);
  const token = cookies.session_token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  let decoded: DecodedToken;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (e) {
    console.error("JWT verify error:", e);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  // Extract and validate body fields
  const { id, name, description, price, imageUrl, category } = req.body;
  if (!id || !name || !description || !price || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let productId: ObjectId;
  try {
    productId = new ObjectId(id);
  } catch {
    return res.status(400).json({ error: "Invalid product ID format" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const products = db.collection("products");

    const existing = await products.findOne({ _id: productId });
    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Ensure the logged‑in user owns this product
    if (existing.userId !== decoded.userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You don't own this product" });
    }

    // Perform the update
    await products.updateOne(
      { _id: productId },
      {
        $set: {
          name,
          description,
          price: parseFloat(price),
          imageUrl,
          category,
          updatedAt: new Date(),
        },
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    console.error("Edit product error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
