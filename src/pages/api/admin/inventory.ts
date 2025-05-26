import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const products = await db
      .collection("products")
      .find({})
      .sort({ stock: 1, name: 1 }) // Show low-stock first
      .toArray();
    res.status(200).json({
      products: products.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        stock: typeof p.stock === "number" ? p.stock : 0,
        imageUrl: p.imageUrl || "",
        isFeatured: !!p.isFeatured,
      })),
    });
  } catch (err) {
    console.error("[inventory] Error:", err);
    res.status(500).json({ error: "Failed to load inventory." });
  }
}
