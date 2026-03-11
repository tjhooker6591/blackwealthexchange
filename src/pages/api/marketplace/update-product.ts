import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { resolveSellerSession } from "@/lib/marketplace/sellerSession";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "PUT" && req.method !== "POST") {
    res.setHeader("Allow", ["PUT", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id, name, description, price, imageUrl, category } = req.body || {};
  if (!id || !name || !description || !price || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let productId: ObjectId;
  try {
    productId = new ObjectId(String(id));
  } catch {
    return res.status(400).json({ error: "Invalid product ID format" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const products = db.collection("products");

    const sellerSession = await resolveSellerSession(req, db);
    if (!sellerSession.ok) {
      return res
        .status(sellerSession.status)
        .json({ error: sellerSession.error });
    }

    const existing = await products.findOne({ _id: productId });
    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (String(existing.sellerId) !== sellerSession.sellerId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You don't own this product" });
    }

    await products.updateOne(
      { _id: productId },
      {
        $set: {
          name: String(name).trim(),
          description: String(description).trim(),
          price: Number(price),
          imageUrl: String(imageUrl || "").trim(),
          category: String(category).trim(),
          updatedAt: new Date(),
        },
      },
    );

    return res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    console.error("Edit product error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
