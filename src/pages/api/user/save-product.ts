// src/pages/api/user/save-product.ts
//
// Phase 5 -- Save Product (marketplace wishlist). Same POST/DELETE/GET
// toggle-and-list pattern as save-business.ts and the pre-existing
// save-job.ts, but reads from the marketplace database
// (src/lib/marketplace/db.ts) since `products` lives there, not in the
// primary app database.

import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { getNetworkSession, s } from "@/lib/network/shared";

async function ensureIndexes(db: any) {
  await db
    .collection("saved_products")
    .createIndex(
      { userId: 1, productId: 1 },
      { unique: true, name: "uniq_saved_products_user_product" },
    )
    .catch(() => null);
}

function productFilter(productId: string) {
  return {
    $or: [
      { _id: productId },
      ...(ObjectId.isValid(productId)
        ? [{ _id: new ObjectId(productId) }]
        : []),
    ],
  } as any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const session = getNetworkSession(req);
  if (!session) return res.status(401).json({ error: "Login required" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const marketplaceDb = client.db(getMarketplaceDbName());
  await ensureIndexes(db);

  if (req.method === "GET") {
    const rows = await db
      .collection("saved_products")
      .find({ userId: session.userId })
      .sort({ savedAt: -1 })
      .limit(200)
      .toArray();

    const productIds = rows.map((row: any) => s(row.productId)).filter(Boolean);
    const products = productIds.length
      ? await marketplaceDb
          .collection("products")
          .find({
            $or: productIds.flatMap((id) => [
              { _id: id },
              ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
            ]),
          } as any)
          .toArray()
      : [];
    const byId = new Map(products.map((doc: any) => [String(doc._id), doc]));

    return res.status(200).json({
      products: rows
        .map((row: any) => {
          const doc = byId.get(s(row.productId));
          if (!doc) return null;
          return {
            productId: s(row.productId),
            savedAt:
              row.savedAt instanceof Date
                ? row.savedAt.toISOString()
                : row.savedAt || null,
            name: doc.name || "Product",
            price: typeof doc.price === "number" ? doc.price : null,
            imageUrl: doc.imageUrl || null,
            status: doc.status || null,
            href: `/marketplace/product/${encodeURIComponent(String(doc._id))}`,
          };
        })
        .filter(Boolean),
    });
  }

  if (req.method === "POST" || req.method === "DELETE") {
    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const productId = s(body.productId);
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    if (req.method === "DELETE") {
      await db
        .collection("saved_products")
        .deleteOne({ userId: session.userId, productId });
      return res.status(200).json({ saved: false });
    }

    const product = await marketplaceDb
      .collection("products")
      .findOne(productFilter(productId), { projection: { _id: 1 } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    await db.collection("saved_products").updateOne(
      { userId: session.userId, productId },
      {
        $setOnInsert: {
          userId: session.userId,
          productId,
          savedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return res.status(201).json({ saved: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
