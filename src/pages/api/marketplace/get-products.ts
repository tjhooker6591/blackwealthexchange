import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { ObjectId } from "mongodb";

type SortKey = "relevance" | "newest" | "price_asc" | "price_desc";

function escRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asObjectId(input: string) {
  try {
    return ObjectId.isValid(input) ? new ObjectId(input) : null;
  } catch {
    return null;
  }
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

    if (category && category !== "All") {
      filter.category = { $regex: new RegExp(escRegex(String(category)), "i") };
    }

    const queryText = String(q || "").trim();
    if (queryText) {
      const rx = new RegExp(escRegex(queryText), "i");
      filter.$or = [{ name: rx }, { description: rx }, { category: rx }];
    }

    if (sellerView === "true") {
      if (!sellerId) {
        return res
          .status(400)
          .json({ error: "Seller ID required for seller view." });
      }
      filter.sellerId = sellerId;
    } else {
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

    const sellerIds = Array.from(
      new Set(products.map((p: any) => String(p.sellerId || "")).filter(Boolean)),
    );

    const sellerDocs = await db
      .collection("sellers")
      .find(
        {
          _id: {
            $in: sellerIds.map((id) => asObjectId(id)).filter(Boolean),
          },
        },
        { projection: { _id: 1, stripeAccountId: 1, businessName: 1 } },
      )
      .toArray();

    const sellerById = new Map(
      sellerDocs.map((s: any) => [String(s._id), s]),
    );

    const withTrust = products.map((p: any) => {
      const seller = sellerById.get(String(p.sellerId || ""));
      return {
        ...p,
        sellerTrust: {
          sellerExists: !!seller,
          payoutReady: !!(seller?.stripeAccountId && String(seller.stripeAccountId).startsWith("acct_")),
          hasBusinessName: !!seller?.businessName,
        },
      };
    });

    return res.status(200).json({ products: withTrust, total });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}
