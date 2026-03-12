import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";

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
    const db = client.db(getMongoDbName());

    const product = await db.collection("products").findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    let sellerTrust = {
      sellerExists: false,
      payoutReady: false,
      hasBusinessName: false,
    };

    if (product?.sellerId) {
      const seller = await db.collection("sellers").findOne(
        { _id: new ObjectId(String(product.sellerId)) },
        { projection: { _id: 1, stripeAccountId: 1, businessName: 1 } },
      ).catch(() => null);

      sellerTrust = {
        sellerExists: !!seller,
        payoutReady: !!(seller?.stripeAccountId && String(seller.stripeAccountId).startsWith("acct_")),
        hasBusinessName: !!seller?.businessName,
      };
    }

    return res.status(200).json({ product: { ...product, sellerTrust } });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
