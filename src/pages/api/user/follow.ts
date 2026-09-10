// src/pages/api/user/follow.ts
//
// BWE Pulse Phase 2 -- Follow a person. Mirrors the existing
// src/pages/api/business/follow.ts pattern exactly, in a separate
// `user_follows` collection rather than overloading the working
// `follows` (business) collection/index. Real follows only: a follow
// row is created solely by an authenticated user's own POST, and
// removed solely by their own DELETE.
//
// A person can only be followed if they've opted their profile into
// being public (see PATCH /api/profile's profileVisibility field) --
// enforced here, not just hidden client-side.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession, s } from "@/lib/network/shared";
import { findPersonById } from "@/lib/network/personLookup";
import { nameFromDoc, normalizeAsset } from "@/pages/api/profile";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

async function ensureIndexes(db: any) {
  await db
    .collection("user_follows")
    .createIndex(
      { followerId: 1, followingUserId: 1 },
      { unique: true, name: "uniq_user_follows_pair" },
    )
    .catch(() => null);
  await db
    .collection("user_follows")
    .createIndex({ followingUserId: 1 })
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
        .collection("user_follows")
        .find({ followerId: session.userId })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();

      const people = await Promise.all(
        rows.map(async (row: any) => {
          const found = await findPersonById(db, s(row.followingUserId));
          if (!found || found.doc.profileVisibility !== "public") return null;
          const avatar = normalizeAsset(found.doc, "avatar");
          return {
            userId: s(row.followingUserId),
            name: nameFromDoc(found.doc) || "BWE Member",
            avatarUrl: avatar?.url || null,
            followedAt:
              row.createdAt instanceof Date
                ? row.createdAt.toISOString()
                : row.createdAt || null,
          };
        }),
      );

      return res.status(200).json({ people: people.filter(Boolean) });
    }

    const targetUserId = s(req.query.userId as string);
    if (!targetUserId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!session) return res.status(200).json({ following: false, count: 0 });

    const [existing, count] = await Promise.all([
      db
        .collection("user_follows")
        .findOne({ followerId: session.userId, followingUserId: targetUserId }),
      db.collection("user_follows").countDocuments({
        followingUserId: targetUserId,
      }),
    ]);

    return res.status(200).json({ following: Boolean(existing), count });
  }

  if (req.method === "POST" || req.method === "DELETE") {
    const session = getNetworkSession(req);
    if (!session) return res.status(401).json({ error: "Login required" });

    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const targetUserId = s(body.userId);
    if (!targetUserId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (targetUserId === session.userId) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }

    if (req.method === "DELETE") {
      await db.collection("user_follows").deleteOne({
        followerId: session.userId,
        followingUserId: targetUserId,
      });
      const count = await db
        .collection("user_follows")
        .countDocuments({ followingUserId: targetUserId });
      return res.status(200).json({ following: false, count });
    }

    await ensureApiRateLimitIndexes(db).catch(() => null);
    const ip = getClientIp(req);
    const userLimit = await hitApiRateLimit(
      db,
      `user-follow:user:${session.userId}`,
      30,
      10,
    );
    const ipLimit = await hitApiRateLimit(db, `user-follow:ip:${ip}`, 60, 10);
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

    const found = await findPersonById(db, targetUserId);
    if (!found || found.doc.profileVisibility !== "public") {
      return res
        .status(404)
        .json({ error: "This member's profile isn't public." });
    }

    await db
      .collection("user_follows")
      .updateOne(
        { followerId: session.userId, followingUserId: targetUserId },
        { $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
    const count = await db
      .collection("user_follows")
      .countDocuments({ followingUserId: targetUserId });
    return res.status(200).json({ following: true, count });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
