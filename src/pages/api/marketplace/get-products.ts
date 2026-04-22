import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getAppEnv } from "@/lib/env";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { ObjectId } from "mongodb";

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
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(
    50,
    Math.max(1, parseInt(limit as string, 10) || 8),
  );
  const skip = (pageNum - 1) * limitNum;

  try {
    const client = await clientPromise;

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
      // Public Marketplace View ➔ show active products, including legacy docs
      // where isPublished was never set. Explicitly unpublished remains hidden.
      filter.status = "active";
      filter.isPublished = { $ne: false };
    }

    const search = String(q || "").trim();
    if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, "i") } },
        { title: { $regex: new RegExp(search, "i") } },
        { description: { $regex: new RegExp(search, "i") } },
        { category: { $regex: new RegExp(search, "i") } },
      ];
    }

    const sortKey = String(sort || "relevance");
    const sortSpec: Record<string, 1 | -1> =
      sortKey === "newest"
        ? { isFeatured: -1, createdAt: -1, _id: -1 }
        : sortKey === "price_asc"
          ? { isFeatured: -1, price: 1, _id: -1 }
          : sortKey === "price_desc"
            ? { isFeatured: -1, price: -1, _id: -1 }
            : { isFeatured: -1, _id: -1 };

    const usedDbName = getMarketplaceDbName();
    const environment = getAppEnv();
    const productsCollection = client.db(usedDbName).collection("products");

    const queryProducts = async (collection: any) => {
      const total = await collection.countDocuments(filter);
      const products = await collection
        .find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(limitNum)
        .toArray();
      return { total, products };
    };

    const result = await queryProducts(productsCollection);

    const sellerIds = Array.from(
      new Set(
        result.products
          .map((p: any) => String(p?.sellerId || "").trim())
          .filter(Boolean),
      ),
    );

    const sellerObjectIds = sellerIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const sellers = sellerIds.length
      ? await client
          .db(usedDbName)
          .collection("sellers")
          .find({
            $or: [
              { userId: { $in: sellerIds } },
              ...(sellerObjectIds.length ? [{ _id: { $in: sellerObjectIds } }] : []),
            ],
          })
          .toArray()
      : [];

    const sellerByKey = new Map<string, any>();
    for (const s of sellers) {
      const sid = String(s?._id || "").trim();
      const uid = String(s?.userId || "").trim();
      if (sid) sellerByKey.set(sid, s);
      if (uid) sellerByKey.set(uid, s);
    }

    const hydratedProducts = result.products.map((p: any) => {
      const sellerKey = String(p?.sellerId || "").trim();
      const seller = sellerByKey.get(sellerKey);
      const createdAt = p?.createdAt ? new Date(p.createdAt) : null;
      const recentlyAdded =
        createdAt instanceof Date && !Number.isNaN(createdAt.getTime())
          ? Date.now() - createdAt.getTime() <= 14 * 24 * 60 * 60 * 1000
          : false;

      return {
        ...p,
        recentlyAdded,
        seller: {
          id: sellerKey || null,
          name:
            seller?.storeName ||
            seller?.businessName ||
            seller?.ownerName ||
            "Verified BWE Marketplace Seller",
          profileComplete: Boolean(
            String(seller?.businessName || "").trim() &&
              String(seller?.email || "").trim() &&
              String(seller?.description || "").trim(),
          ),
        },
      };
    });

    if (String(req.query.debug || "") === "1") {
      return res.status(200).json({
        products: hydratedProducts,
        total: result.total,
        _debug: {
          filter,
          usedDbName,
          environment,
          sortKey,
          pageNum,
          limitNum,
        },
      });
    }

    return res
      .status(200)
      .json({ products: hydratedProducts, total: result.total });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}
