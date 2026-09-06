// src/pages/api/user/save-business.ts
//
// Phase 5 -- Save Business. Mirrors the existing save-job.ts pattern
// (src/pages/api/user/save-job.ts): POST/DELETE toggle keyed by
// { userId, businessId }, GET lists the caller's own saved businesses.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, getNetworkSession, s } from "@/lib/network/shared";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";

async function ensureIndexes(db: any) {
  await db
    .collection("saved_businesses")
    .createIndex(
      { userId: 1, businessId: 1 },
      { unique: true, name: "uniq_saved_businesses_user_business" },
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
    const rows = await db
      .collection("saved_businesses")
      .find({ userId: session.userId })
      .sort({ savedAt: -1 })
      .limit(200)
      .toArray();

    const businessIds = rows
      .map((row: any) => s(row.businessId))
      .filter(Boolean);
    const filter = businessIds.length
      ? {
          $or: businessIds
            .map((id) => buildIdFilter("_id", id))
            .filter(Boolean) as any[],
        }
      : null;
    const businesses = filter
      ? await db
          .collection("businesses")
          .find(filter as any)
          .toArray()
      : [];
    const byId = new Map(businesses.map((doc: any) => [String(doc._id), doc]));

    return res.status(200).json({
      businesses: rows
        .map((row: any) => {
          const doc = byId.get(s(row.businessId));
          if (!doc) return null;
          const profile = mapDirectoryProfileFromDoc(doc);
          return {
            businessId: s(row.businessId),
            savedAt:
              row.savedAt instanceof Date
                ? row.savedAt.toISOString()
                : row.savedAt || null,
            displayName: profile.displayName || "Business",
            shortSummary: profile.shortSummary || "",
            primaryCategory: profile.primaryCategory || "",
            city: profile.city || "",
            state: profile.state || "",
            publicHref:
              doc.alias || doc.slug
                ? `/business/${encodeURIComponent(doc.alias || doc.slug)}`
                : null,
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
    const businessId = s(body.businessId);
    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }

    if (req.method === "DELETE") {
      await db
        .collection("saved_businesses")
        .deleteOne({ userId: session.userId, businessId });
      return res.status(200).json({ saved: false });
    }

    const business = await db
      .collection("businesses")
      .findOne(buildIdFilter("_id", businessId) as any, {
        projection: { _id: 1 },
      });
    if (!business) return res.status(404).json({ error: "Business not found" });

    await db.collection("saved_businesses").updateOne(
      { userId: session.userId, businessId },
      {
        $setOnInsert: {
          userId: session.userId,
          businessId,
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
