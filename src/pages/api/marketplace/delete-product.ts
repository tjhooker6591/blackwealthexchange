// src/pages/api/marketplace/delete-products.ts
import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Only allow DELETE
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Extract and validate the product ID from the query string
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
    const db = client.db("bwes-cluster");
    const result = await db
      .collection("products")
      .deleteOne({ _id: productId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 204 No Content indicates successful deletion with no response body
    return res.status(204).end();
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
