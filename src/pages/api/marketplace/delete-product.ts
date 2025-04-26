import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

// Mock function to get seller ID from session
async function getSellerId(req: NextApiRequest) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/me`, {
      headers: { cookie: req.headers.cookie || "" },
    });
    const data = await res.json();
    return data?.user?.accountType === "seller" ? data.user.id : null;
  } catch {
    return null;
  }
}

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
    const sellerId = await getSellerId(req);
    if (!sellerId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Seller access required" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Check if product belongs to this seller
    const product = await db.collection("products").findOne({ _id: productId });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.sellerId !== sellerId) {
      return res
        .status(403)
        .json({ error: "Forbidden: You do not own this product" });
    }

    const result = await db
      .collection("products")
      .deleteOne({ _id: productId });

    if (result.deletedCount === 0) {
      return res.status(500).json({ error: "Failed to delete product" });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
