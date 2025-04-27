import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  const {
    page = "1",
    limit = "8",
    category = "All",
    sellerView,
    sellerId,
  } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const collection = db.collection("products");

    const filter: any = {};

    // Category filtering
    if (category && category !== "All") {
      filter.category = { $regex: new RegExp(category as string, "i") };
    }

    if (sellerView === "true") {
      // Seller Dashboard View ➔ Show all products by this seller
      if (!sellerId) {
        return res
          .status(400)
          .json({ error: "Seller ID required for seller view." });
      }
      filter.sellerId = sellerId;
    } else {
      // Public Marketplace View ➔ Only show active & published products
      filter.status = "active";
      filter.isPublished = true;
    }

    const total = await collection.countDocuments(filter);
    const products = await collection
      .find(filter)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    return res.status(200).json({ products, total });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}
