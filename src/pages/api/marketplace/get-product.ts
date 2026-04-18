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

    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const rawSellerId = String(product?.sellerId || "").trim();
    let seller: any = null;

    if (rawSellerId) {
      const sellerOr: any[] = [{ userId: rawSellerId }];
      if (ObjectId.isValid(rawSellerId)) {
        sellerOr.push({ _id: new ObjectId(rawSellerId) });
      }

      seller = await db.collection("sellers").findOne({ $or: sellerOr } as any);
    }

    return res.status(200).json({
      product: {
        ...product,
        seller: {
          id: rawSellerId || null,
          name:
            seller?.storeName ||
            seller?.businessName ||
            seller?.ownerName ||
            "Verified BWE Marketplace Seller",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
