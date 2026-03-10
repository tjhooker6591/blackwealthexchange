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

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const sellerSession = await resolveSellerSession(req, db);
    if (!sellerSession.ok) {
      return res.status(sellerSession.status).json({ error: sellerSession.error });
    }

    const product = await db.collection("products").findOne({ _id: productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (String(product.sellerId) !== sellerSession.sellerId) {
      return res.status(403).json({ error: "Forbidden: You do not own this product" });
    }

    const result = await db.collection("products").deleteOne({ _id: productId });
    if (result.deletedCount === 0) {
      return res.status(500).json({ error: "Failed to delete product" });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
