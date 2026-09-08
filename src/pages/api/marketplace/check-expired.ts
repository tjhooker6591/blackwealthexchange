import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { hasPublicMarketplaceVisibility } from "@/lib/marketplace/publicCatalog";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db(getMarketplaceDbName());
    const products = db.collection("products");

    const today = new Date();
    const candidates = await products
      .find(
        {
          expiresAt: { $lte: today },
          status: { $ne: "expired" },
        },
        {
          projection: {
            name: 1,
            title: 1,
            slug: 1,
            status: 1,
            isPublished: 1,
            expiresAt: 1,
            deletedAt: 1,
          },
        },
      )
      .toArray();

    return res.status(200).json({
      message:
        "Legacy marketplace expiry metadata audited. No product statuses were mutated.",
      modifiedCount: 0,
      candidateCount: candidates.length,
      candidates: candidates.map((doc) => ({
        _id: String(doc._id),
        name:
          typeof doc.name === "string"
            ? doc.name
            : typeof doc.title === "string"
              ? doc.title
              : null,
        slug: typeof doc.slug === "string" ? doc.slug : null,
        status: doc.status ?? null,
        isPublished: doc.isPublished ?? null,
        expiresAt: doc.expiresAt ?? null,
        publicVisible: hasPublicMarketplaceVisibility(doc, today),
      })),
    });
  } catch (error) {
    console.error("Error checking expired products:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
