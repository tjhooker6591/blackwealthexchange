// src/pages/api/pulse/comments.ts
//
// BWE Pulse -- comments on a feed post (either a business_updates entry or
// a member_posts entry -- keyed generically by the same postType/postId
// shape the feed API already uses, so one comment store works for both
// without needing to touch either of those collections).
//
// Commenting requires an opted-in public profile, same boundary as
// posting/following -- if your identity is going to be attached to
// something visible to others, you've chosen that.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, getNetworkSession, s } from "@/lib/network/shared";
import { findPersonById } from "@/lib/network/personLookup";
import { nameFromDoc, normalizeAsset } from "@/pages/api/profile";
import { createNotification } from "@/lib/network/notifications";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

const MAX_BODY_LENGTH = 500;
const VALID_POST_TYPES = new Set(["business", "person"]);
const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 20;

async function ensureIndexes(db: any) {
  await db
    .collection("pulse_comments")
    .createIndex({ postType: 1, postId: 1, createdAt: 1 })
    .catch(() => null);
}

export async function resolvePostAuthor(
  db: any,
  postType: string,
  postId: string,
): Promise<{ userId: string; title: string; href: string } | null> {
  if (postType === "person") {
    const post = await db
      .collection("member_posts")
      .findOne(buildIdFilter("_id", postId) as any);
    if (!post) return null;
    return {
      userId: s(post.authorUserId),
      title: "your BWE Pulse post",
      href: `/u/${s(post.authorUserId)}`,
    };
  }

  const update = await db
    .collection("business_updates")
    .findOne(buildIdFilter("_id", postId) as any);
  if (!update) return null;
  const business = await db
    .collection("businesses")
    .findOne(buildIdFilter("_id", s(update.businessId)) as any, {
      projection: { claimedByUserId: 1, managedByUserId: 1, alias: 1, slug: 1 },
    });
  const ownerUserId =
    s(business?.claimedByUserId) || s(business?.managedByUserId) || "";
  if (!ownerUserId) return null;
  return {
    userId: ownerUserId,
    title: "your business update",
    href:
      business?.alias || business?.slug
        ? `/business/${encodeURIComponent(business.alias || business.slug)}`
        : "/pulse",
  };
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
    const postType = s(req.query.postType as string);
    const postId = s(req.query.postId as string);
    if (!VALID_POST_TYPES.has(postType) || !postId) {
      return res
        .status(400)
        .json({ error: "postType and postId are required" });
    }

    // Newest-first, paged (2026-09-12): a post used to return every
    // comment it ever had in one call -- fine at low volume, but a
    // guaranteed problem once a popular business or post has hundreds of
    // them. "before" is an ISO date cursor -- comments strictly older
    // than it -- so paging stays correct even as new comments arrive.
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_SIZE),
    );
    const before = s(req.query.before as string);
    const filter: any = { postType, postId };
    if (before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    const [page, totalCount] = await Promise.all([
      db
        .collection("pulse_comments")
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .toArray(),
      db.collection("pulse_comments").countDocuments({ postType, postId }),
    ]);

    const hasMore = page.length > limit;
    const comments = hasMore ? page.slice(0, limit) : page;
    const nextCursor = hasMore
      ? comments[comments.length - 1].createdAt instanceof Date
        ? comments[comments.length - 1].createdAt.toISOString()
        : comments[comments.length - 1].createdAt
      : null;

    // Business-reply eligibility (2026-09-12): only the business's own
    // owner can reply, and only on comments attached to a business post --
    // resolved once per request rather than per comment since it's the
    // same business for every comment on this post.
    let canReply = false;
    if (postType === "business") {
      const session = getNetworkSession(req);
      if (session) {
        const postAuthor = await resolvePostAuthor(db, postType, postId);
        canReply = !!postAuthor && postAuthor.userId === session.userId;
      }
    }

    const authorIds = Array.from(
      new Set(comments.map((c: any) => s(c.authorUserId)).filter(Boolean)),
    );
    const authorsById = new Map<string, any>();
    for (const authorId of authorIds) {
      const found = await findPersonById(db, authorId);
      if (found) authorsById.set(authorId, found.doc);
    }

    return res.status(200).json({
      totalCount,
      hasMore,
      nextCursor,
      canReply,
      comments: comments.map((c: any) => {
        const authorDoc = authorsById.get(s(c.authorUserId));
        const avatar = authorDoc ? normalizeAsset(authorDoc, "avatar") : null;
        return {
          id: String(c._id),
          authorUserId: s(c.authorUserId),
          authorName: authorDoc
            ? nameFromDoc(authorDoc) || "BWE Member"
            : "BWE Member",
          authorAvatarUrl: avatar?.url || null,
          body: c.body || "",
          createdAt:
            c.createdAt instanceof Date
              ? c.createdAt.toISOString()
              : c.createdAt || null,
          businessReply: c.businessReply
            ? {
                body: c.businessReply.body || "",
                createdAt:
                  c.businessReply.createdAt instanceof Date
                    ? c.businessReply.createdAt.toISOString()
                    : c.businessReply.createdAt || null,
              }
            : null,
        };
      }),
    });
  }

  if (req.method === "POST") {
    const session = getNetworkSession(req);
    if (!session) return res.status(401).json({ error: "Login required" });

    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const postType = s(body.postType);
    const postId = s(body.postId);
    const commentBody = s(body.body).slice(0, MAX_BODY_LENGTH);

    if (!VALID_POST_TYPES.has(postType) || !postId || !commentBody) {
      return res
        .status(400)
        .json({ error: "postType, postId, and body are required" });
    }

    const found = await findPersonById(db, session.userId);
    if (!found || found.doc.profileVisibility !== "public") {
      return res.status(403).json({
        error:
          "Make your profile public first (Profile settings) to comment on BWE Pulse.",
      });
    }

    await ensureApiRateLimitIndexes(db).catch(() => null);
    const ip = getClientIp(req);
    const userLimit = await hitApiRateLimit(
      db,
      `pulse-comment:user:${session.userId}`,
      30,
      10,
    );
    const ipLimit = await hitApiRateLimit(db, `pulse-comment:ip:${ip}`, 60, 10);
    if (userLimit.blocked || ipLimit.blocked) {
      res.setHeader(
        "Retry-After",
        String(
          Math.max(userLimit.retryAfterSeconds, ipLimit.retryAfterSeconds),
        ),
      );
      return res
        .status(429)
        .json({ error: "Too many comments. Please try again shortly." });
    }

    const now = new Date();
    const result = await db.collection("pulse_comments").insertOne({
      postType,
      postId,
      authorUserId: session.userId,
      body: commentBody,
      createdAt: now,
    });

    const postAuthor = await resolvePostAuthor(db, postType, postId);
    if (postAuthor && postAuthor.userId !== session.userId) {
      const commenterName = nameFromDoc(found.doc) || "A BWE member";
      await createNotification(db, {
        userId: postAuthor.userId,
        type: "comment_received",
        title: `${commenterName} commented on ${postAuthor.title}`,
        body: commentBody,
        href: postAuthor.href,
      });
    }

    return res.status(201).json({
      ok: true,
      comment: {
        id: String(result.insertedId),
        authorUserId: session.userId,
        authorName: nameFromDoc(found.doc) || "BWE Member",
        authorAvatarUrl: normalizeAsset(found.doc, "avatar")?.url || null,
        body: commentBody,
        createdAt: now.toISOString(),
      },
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
