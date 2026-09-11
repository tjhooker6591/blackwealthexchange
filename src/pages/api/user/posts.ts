// src/pages/api/user/posts.ts
//
// BWE Pulse Phase 2 -- member posts ("I just hired this business",
// recommendations, "need a contractor"). Kept in a separate
// `member_posts` collection rather than folding into business_updates,
// so the working, already-shipped business-update code is never at risk
// from this change -- the feed API merges the two at query time instead.
//
// Only accounts that opted their profile public (see PATCH /api/profile)
// can post, matching the same boundary as follow-a-person: if you keep
// your profile private, you're a consumer of the feed, not a publisher.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getNetworkSession, s } from "@/lib/network/shared";
import { findPersonById } from "@/lib/network/personLookup";
import { nameFromDoc } from "@/pages/api/profile";
import { notifyUserFollowers } from "@/lib/network/notifications";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

const MAX_BODY_LENGTH = 500;

async function ensureIndexes(db: any) {
  await db
    .collection("member_posts")
    .createIndex({ authorUserId: 1, createdAt: -1 })
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
    const authorUserId = s(req.query.userId as string);
    if (!authorUserId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const posts = await db
      .collection("member_posts")
      .find({ authorUserId })
      .sort({ createdAt: -1 })
      .limit(25)
      .toArray();

    return res.status(200).json({
      posts: posts.map((p: any) => ({
        id: String(p._id),
        body: p.body || "",
        createdAt:
          p.createdAt instanceof Date
            ? p.createdAt.toISOString()
            : p.createdAt || null,
      })),
    });
  }

  if (req.method === "POST") {
    const session = getNetworkSession(req);
    if (!session) return res.status(401).json({ error: "Login required" });

    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const postBody = s(body.body).slice(0, MAX_BODY_LENGTH);
    if (!postBody) {
      return res.status(400).json({ error: "body is required" });
    }

    const found = await findPersonById(db, session.userId);
    if (!found || found.doc.profileVisibility !== "public") {
      return res.status(403).json({
        error:
          "Make your profile public first (Profile settings) to post to BWE Pulse.",
      });
    }

    await ensureApiRateLimitIndexes(db).catch(() => null);
    const ip = getClientIp(req);
    const userLimit = await hitApiRateLimit(
      db,
      `member-post:user:${session.userId}`,
      10,
      10,
    );
    const ipLimit = await hitApiRateLimit(db, `member-post:ip:${ip}`, 20, 10);
    if (userLimit.blocked || ipLimit.blocked) {
      res.setHeader(
        "Retry-After",
        String(
          Math.max(userLimit.retryAfterSeconds, ipLimit.retryAfterSeconds),
        ),
      );
      return res
        .status(429)
        .json({ error: "Too many posts. Please try again shortly." });
    }

    const now = new Date();
    const result = await db.collection("member_posts").insertOne({
      authorUserId: session.userId,
      body: postBody,
      createdAt: now,
    });

    const authorName = nameFromDoc(found.doc) || "A member you follow";
    const notified = await notifyUserFollowers(db, {
      followingUserId: session.userId,
      excludeUserId: session.userId,
      type: "member_post",
      title: `${authorName} posted on BWE Pulse`,
      body: postBody,
      href: `/u/${session.userId}`,
    });

    return res.status(201).json({
      ok: true,
      post: {
        id: String(result.insertedId),
        body: postBody,
        createdAt: now.toISOString(),
      },
      followersNotified: notified,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
