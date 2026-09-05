import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { resolveBuyerSession } from "@/lib/marketplace/buyerSession";

const MAX_COMMENT_LENGTH = 1000;

type ReviewDoc = {
  _id: ObjectId;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function s(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] || "BWE customer";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 40);
}

async function ensureIndexes(db: any) {
  const collection = db.collection("product_reviews");
  await Promise.all([
    collection
      .createIndex(
        { productId: 1, userId: 1 },
        { name: "uniq_product_reviews_product_user", unique: true },
      )
      .catch(() => null),
    collection
      .createIndex(
        { productId: 1, createdAt: -1 },
        { name: "product_reviews_productId_createdAt" },
      )
      .catch(() => null),
  ]);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const client = await clientPromise;
  const db = client.db(getMarketplaceDbName());

  if (req.method === "GET") {
    const productId = s(req.query.productId);
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    try {
      const reviews = await db
        .collection("product_reviews")
        .find({ productId })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      const ratings = reviews.map((r: any) => Number(r.rating) || 0);
      const count = ratings.length;
      const averageRating = count
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10
        : 0;

      return res.status(200).json({
        productId,
        count,
        averageRating,
        reviews: reviews.map((r: any) => ({
          id: String(r._id),
          userName: r.userName || "BWE customer",
          rating: Number(r.rating) || 0,
          comment: r.comment || null,
          verifiedPurchase: Boolean(r.verifiedPurchase),
          createdAt: r.createdAt,
        })),
      });
    } catch (error) {
      console.error("Failed to fetch product reviews:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  if (req.method === "POST") {
    const buyer = resolveBuyerSession(req);
    if (!buyer.ok) {
      return res.status(buyer.status).json({ error: buyer.error });
    }

    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const productId = s(body.productId);
    const ratingRaw = Number(body.rating);
    const comment = s(body.comment).slice(0, MAX_COMMENT_LENGTH);

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }
    if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
      return res
        .status(400)
        .json({ error: "rating must be a whole number from 1 to 5" });
    }

    try {
      await ensureIndexes(db);

      const product = await db.collection("products").findOne(
        {
          $or: [
            { _id: productId },
            ...(ObjectId.isValid(productId)
              ? [{ _id: new ObjectId(productId) }]
              : []),
          ],
        } as any,
        { projection: { _id: 1 } },
      );
      if (!product) {
        return res
          .status(404)
          .json({ error: "This product could not be found." });
      }

      const paidOrder = await db.collection("orders").findOne({
        productId,
        paymentStatus: "paid",
        $or: [
          ...(buyer.userId ? [{ buyerUserId: buyer.userId }] : []),
          ...(buyer.email ? [{ buyerEmail: buyer.email }] : []),
        ],
      });

      const userName = buyer.email
        ? displayNameFromEmail(buyer.email)
        : "BWE customer";

      const now = new Date();
      const result = await db.collection("product_reviews").findOneAndUpdate(
        { productId, userId: buyer.userId || buyer.email },
        {
          $set: {
            productId,
            userId: buyer.userId || buyer.email,
            userName,
            rating: ratingRaw,
            comment: comment || null,
            verifiedPurchase: Boolean(paidOrder),
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: "after" },
      );

      const saved: ReviewDoc | null = result?.value || result;

      return res.status(201).json({
        ok: true,
        review: saved
          ? {
              id: String((saved as any)._id),
              userName: (saved as any).userName,
              rating: (saved as any).rating,
              comment: (saved as any).comment,
              verifiedPurchase: Boolean((saved as any).verifiedPurchase),
              createdAt: (saved as any).createdAt,
            }
          : null,
      });
    } catch (error) {
      console.error("Failed to submit product review:", error);
      return res
        .status(500)
        .json({ error: "We could not save your review. Please try again." });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
