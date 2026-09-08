// src/pages/api/user/collections/[id]/items.ts
//
// Phase 5 -- Collections. Add/remove/list items (businesses or products
// the user already saved) inside one of their own collections.

import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { getNetworkSession, isValidObjectId, s } from "@/lib/network/shared";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const session = getNetworkSession(req);
  if (!session) return res.status(401).json({ error: "Login required" });

  const collectionId = s(req.query.id as string);
  if (!collectionId || !isValidObjectId(collectionId)) {
    return res.status(400).json({ error: "A valid collection id is required" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const marketplaceDb = client.db(getMarketplaceDbName());

  const collection = await db
    .collection("collections")
    .findOne({ _id: new ObjectId(collectionId), userId: session.userId });
  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }

  if (req.method === "GET") {
    const items = await db
      .collection("collection_items")
      .find({ collectionId })
      .sort({ addedAt: -1 })
      .toArray();

    const businessIds = items
      .filter((i: any) => i.itemType === "business")
      .map((i: any) => s(i.itemId));
    const productIds = items
      .filter((i: any) => i.itemType === "product")
      .map((i: any) => s(i.itemId));

    const [businesses, products] = await Promise.all([
      businessIds.length
        ? db
            .collection("businesses")
            .find({
              $or: businessIds.flatMap((id) => [
                { _id: id },
                ...(isValidObjectId(id) ? [{ _id: new ObjectId(id) }] : []),
              ]),
            } as any)
            .toArray()
        : [],
      productIds.length
        ? marketplaceDb
            .collection("products")
            .find({
              $or: productIds.flatMap((id) => [
                { _id: id },
                ...(isValidObjectId(id) ? [{ _id: new ObjectId(id) }] : []),
              ]),
            } as any)
            .toArray()
        : [],
    ]);
    const businessById = new Map(
      businesses.map((doc: any) => [String(doc._id), doc]),
    );
    const productById = new Map(
      products.map((doc: any) => [String(doc._id), doc]),
    );

    return res.status(200).json({
      collection: {
        id: String(collection._id),
        name: collection.name,
        description: collection.description || null,
      },
      items: items
        .map((item: any) => {
          if (item.itemType === "business") {
            const doc = businessById.get(s(item.itemId));
            if (!doc) return null;
            const profile = mapDirectoryProfileFromDoc(doc);
            return {
              itemType: "business",
              itemId: s(item.itemId),
              title: profile.displayName || "Business",
              subtitle: profile.primaryCategory || "",
              href:
                doc.alias || doc.slug
                  ? `/business/${encodeURIComponent(doc.alias || doc.slug)}`
                  : null,
            };
          }
          const doc = productById.get(s(item.itemId));
          if (!doc) return null;
          return {
            itemType: "product",
            itemId: s(item.itemId),
            title: doc.name || "Product",
            subtitle:
              typeof doc.price === "number" ? `$${doc.price.toFixed(2)}` : "",
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
    const itemType = s(body.itemType);
    const itemId = s(body.itemId);
    if (!["business", "product"].includes(itemType) || !itemId) {
      return res
        .status(400)
        .json({ error: "itemType (business|product) and itemId are required" });
    }

    if (req.method === "DELETE") {
      await db
        .collection("collection_items")
        .deleteOne({ collectionId, itemType, itemId });
      return res.status(200).json({ ok: true });
    }

    await db.collection("collection_items").updateOne(
      { collectionId, itemType, itemId },
      {
        $setOnInsert: { collectionId, itemType, itemId, addedAt: new Date() },
      },
      { upsert: true },
    );
    return res.status(201).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
