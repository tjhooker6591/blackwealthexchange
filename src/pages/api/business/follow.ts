// src/pages/api/business/follow.ts
//
// Phase 5 -- Follow Business. Real follows only: a follow row is created
// solely by an authenticated user's own POST, and removed solely by their
// own DELETE. No follow is ever seeded or fabricated.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, getNetworkSession, s } from "@/lib/network/shared";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

async function ensureIndexes(db: any) {
  await db
    .collection("follows")
    .createIndex(
      { userId: 1, businessId: 1 },
      { unique: true, name: "uniq_follows_user_business" },
    )
    .catch(() => null);
  await db
    .collection("follows")
    .createIndex({ businessId: 1 })
    .catch(() => null);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureIndexes(db);

  if (req.method === "GET") {
    const session = getNetworkSession(req);
    const mine = s(req.query.mine as string);

    if (mine) {
      if (!session) return res.status(401).json({ error: "Login required" });
      const rows = await db
        .collection("follows")
        .find({ userId: session.userId })
        .sort({ createdAt: -1 })
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
      const byId = new Map(
        businesses.map((doc: any) => [String(doc._id), doc]),
      );

      return res.status(200).json({
        businesses: rows
          .map((row: any) => {
            const doc = byId.get(s(row.businessId));
            if (!doc) return null;
            const profile = mapDirectoryProfileFromDoc(doc);
            return {
              businessId: s(row.businessId),
              followedAt:
                row.createdAt instanceof Date
                  ? row.createdAt.toISOString()
                  : row.createdAt || null,
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

    const businessId = s(req.query.businessId as string);
    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }
    if (!session) return res.status(200).json({ following: false, count: 0 });

    const [existing, count] = await Promise.all([
      db.collection("follows").findOne({ userId: session.userId, businessId }),
      db.collection("follows").countDocuments({ businessId }),
    ]);

    return res.status(200).json({ following: Boolean(existing), count });
  }

  if (req.method === "POST" || req.method === "DELETE") {
    const session = getNetworkSession(req);
    if (!session) return res.status(401).json({ error: "Login required" });

    // Phase 8 -- P8-08 Bot/Scraper/Fraud/Abuse Defense. No throttling
    // previously existed on follow/unfollow -- scriptable follow-count
    // manipulation and notification-spam-to-owner via rapid follow/unfollow
    // cycling were both unmitigated.
    await ensureApiRateLimitIndexes(db).catch(() => null);
    const ip = getClientIp(req);
    const userLimit = await hitApiRateLimit(
      db,
      `business-follow:user:${session.userId}`,
      30,
      10,
    );
    const ipLimit = await hitApiRateLimit(
      db,
      `business-follow:ip:${ip}`,
      60,
      10,
    );
    if (userLimit.blocked || ipLimit.blocked) {
      res.setHeader(
        "Retry-After",
        String(
          Math.max(userLimit.retryAfterSeconds, ipLimit.retryAfterSeconds),
        ),
      );
      return res
        .status(429)
        .json({ error: "Too many follow requests. Please try again shortly." });
    }

    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const businessId = s(body.businessId);
    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }

    const business = await db
      .collection("businesses")
      .findOne(buildIdFilter("_id", businessId) as any, {
        projection: { _id: 1 },
      });
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (req.method === "DELETE") {
      await db
        .collection("follows")
        .deleteOne({ userId: session.userId, businessId });
      const count = await db
        .collection("follows")
        .countDocuments({ businessId });
      return res.status(200).json({ following: false, count });
    }

    await db.collection("follows").updateOne(
      { userId: session.userId, businessId },
      {
        $setOnInsert: {
          userId: session.userId,
          businessId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    const count = await db.collection("follows").countDocuments({ businessId });
    return res.status(201).json({ following: true, count });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
