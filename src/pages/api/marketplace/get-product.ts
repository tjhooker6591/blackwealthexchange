import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Product ID is required." });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMarketplaceDbName());

    const productId = new ObjectId(id);

    const product = await db.collection("products").findOne({ _id: productId });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    await db
      .collection("products")
      .updateOne(
        { _id: productId },
        { $inc: { views: 1 }, $set: { updatedAt: new Date() } },
      );

    const effectiveViews = Number(product?.views || 0) + 1;

    const rawSellerId = String(product?.sellerId || "").trim();
    let seller: any = null;

    if (rawSellerId) {
      const sellerOr: any[] = [{ userId: rawSellerId }];
      if (ObjectId.isValid(rawSellerId)) {
        sellerOr.push({ _id: new ObjectId(rawSellerId) });
      }

      seller = await db.collection("sellers").findOne({ $or: sellerOr } as any);
    }

    const createdAt = product?.createdAt ? new Date(product.createdAt) : null;
    const recentlyAdded =
      createdAt instanceof Date && !Number.isNaN(createdAt.getTime())
        ? Date.now() - createdAt.getTime() <= 14 * 24 * 60 * 60 * 1000
        : false;

    const stockQuantity = Number(product?.stockQuantity ?? 0);
    const availability =
      stockQuantity <= 0
        ? "Out of stock"
        : stockQuantity <= 3
          ? "Low stock"
          : "In stock";

    return res.status(200).json({
      product: {
        ...product,
        views: effectiveViews,
        condition: String(product?.condition || "New"),
        availability,
        recentlyAdded,
        activeListing: String(product?.status || "").toLowerCase() === "active",
        seller: {
          id: rawSellerId || null,
          name:
            seller?.storeName ||
            seller?.businessName ||
            seller?.ownerName ||
            "Verified BWE Marketplace Seller",
          joinedAt: seller?.createdAt || null,
          profileComplete: Boolean(
            String(seller?.businessName || "").trim() &&
            String(seller?.email || "").trim() &&
            String(seller?.description || "").trim(),
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
