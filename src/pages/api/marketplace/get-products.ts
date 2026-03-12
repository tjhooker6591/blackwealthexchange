import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

type SortKey = "relevance" | "newest" | "price_asc" | "price_desc";

function escRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    q = "",
    sort = "relevance",
  } = req.query;

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(60, Math.max(1, parseInt(String(limit), 10) || 8));
  const skip = (pageNum - 1) * limitNum;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const collection = db.collection("products");

    const filter: any = {};

    // Category filtering
    if (category && category !== "All") {
      filter.category = { $regex: new RegExp(escRegex(String(category)), "i") };
    }

    const queryText = String(q || "").trim();
    if (queryText) {
      const rx = new RegExp(escRegex(queryText), "i");
      filter.$or = [{ name: rx }, { description: rx }, { category: rx }];
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

    const sortKey = String(sort) as SortKey;
    const sortBy =
      sortKey === "newest"
        ? { createdAt: -1, _id: -1 }
        : sortKey === "price_asc"
          ? { price: 1, createdAt: -1 }
          : sortKey === "price_desc"
            ? { price: -1, createdAt: -1 }
            : { createdAt: -1, _id: -1 };

    const total = await collection.countDocuments(filter);
    const products = await collection
      .find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    return res.status(200).json({ products, total });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}
