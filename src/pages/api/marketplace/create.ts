// src/pages/api/marketplace/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { resolveSellerSession } from "@/lib/marketplace/sellerSession";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Only allow POST for creating a product
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const {
    name,
    description,
    price,
    category,
    imageUrl,
    stockQuantity = 0,
    isFeatured = false,
    sellerId: suppliedSellerId = "",
  } = body;

  // Validate required fields
  if (!name || !description || !price || !category || !imageUrl) {
    return res.status(400).json({ error: "Missing required fields" });
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

    if (
      typeof suppliedSellerId === "string" &&
      suppliedSellerId.trim() &&
      suppliedSellerId.trim() !== sellerSession.sellerId
    ) {
      return res.status(403).json({
        error: "Seller identity must match the authenticated seller account.",
      });
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stockQuantity);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: "Invalid price" });
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ error: "Invalid stock quantity" });
    }

    const newProduct = {
      name,
      description,
      price: parsedPrice,
      category,
      imageUrl,
      stockQuantity: parsedStock,
      isFeatured,
      sellerId: sellerSession.sellerId,
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
