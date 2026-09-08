// src/pages/api/user/collections.ts
//
// Phase 5 -- Collections. User-curated named lists of businesses/products,
// separate from (and built on top of) Save Business / Save Product: a
// collection groups items a user already saved into a named, shareable-ish
// grouping (e.g. "Black-owned restaurants in Atlanta").

import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession, isValidObjectId, s } from "@/lib/network/shared";

const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 300;

async function ensureIndexes(db: any) {
  await db
    .collection("collections")
    .createIndex({ userId: 1, createdAt: -1 })
    .catch(() => null);
  await db
    .collection("collection_items")
    .createIndex(
      { collectionId: 1, itemType: 1, itemId: 1 },
      { unique: true, name: "uniq_collection_items" },
    )
    .catch(() => null);
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
  await ensureIndexes(db);

  if (req.method === "GET") {
    const collections = await db
      .collection("collections")
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray();

    const counts = await db
      .collection("collection_items")
      .aggregate([
        {
          $match: {
            collectionId: { $in: collections.map((c: any) => String(c._id)) },
          },
        },
        { $group: { _id: "$collectionId", count: { $sum: 1 } } },
      ])
      .toArray();
    const countById = new Map(counts.map((c: any) => [c._id, c.count]));

    return res.status(200).json({
      collections: collections.map((c: any) => ({
        id: String(c._id),
        name: c.name,
        description: c.description || null,
        itemCount: countById.get(String(c._id)) || 0,
        createdAt:
          c.createdAt instanceof Date
            ? c.createdAt.toISOString()
            : c.createdAt || null,
      })),
    });
  }

  if (req.method === "POST") {
    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const name = s(body.name).slice(0, MAX_NAME_LENGTH);
    const description = s(body.description).slice(0, MAX_DESCRIPTION_LENGTH);
    if (!name) return res.status(400).json({ error: "name is required" });

    const now = new Date();
    const result = await db.collection("collections").insertOne({
      userId: session.userId,
      name,
      description: description || null,
      createdAt: now,
    });

    return res.status(201).json({
      ok: true,
      collection: {
        id: String(result.insertedId),
        name,
        description: description || null,
        itemCount: 0,
        createdAt: now.toISOString(),
      },
    });
  }

  if (req.method === "DELETE") {
    const id = s((req.query.id as string) || (req.body as any)?.id);
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ error: "A valid id is required" });
    }
    const owned = await db
      .collection("collections")
      .findOne({ _id: new ObjectId(id), userId: session.userId });
    if (!owned) return res.status(404).json({ error: "Collection not found" });

    await db.collection("collections").deleteOne({ _id: new ObjectId(id) });
    await db.collection("collection_items").deleteMany({ collectionId: id });
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
