// src/pages/api/pulse/comments/reply.ts
//
// A business's reply to a comment on one of its own posts -- single-level,
// one reply per comment, owner-only. Not full threading (no one else can
// reply to a comment, and a comment can't have more than one reply) --
// deliberately scoped like a Yelp/Google review reply rather than an open
// chat thread. Stored directly on the pulse_comments document as
// `businessReply` rather than a separate collection since it's a 1:1
// relationship with the comment it belongs to.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, getNetworkSession, s } from "@/lib/network/shared";
import { nameFromDoc } from "@/pages/api/profile";
import { findPersonById } from "@/lib/network/personLookup";
import { resolvePostAuthor } from "@/pages/api/pulse/comments";
import { createNotification } from "@/lib/network/notifications";
import { ensureApiRateLimitIndexes, hitApiRateLimit } from "@/lib/apiRateLimit";

const MAX_REPLY_LENGTH = 500;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const session = getNetworkSession(req);
  if (!session) return res.status(401).json({ error: "Login required" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const body: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const commentId = s(body.commentId);
  if (!commentId) {
    return res.status(400).json({ error: "commentId is required" });
  }

  const comment = await db
    .collection("pulse_comments")
    .findOne(buildIdFilter("_id", commentId) as any);
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }
  if (comment.postType !== "business") {
    return res
      .status(400)
      .json({ error: "Only comments on a business post can get a reply" });
  }

  const postAuthor = await resolvePostAuthor(
    db,
    comment.postType,
    s(comment.postId),
  );
  if (!postAuthor || postAuthor.userId !== session.userId) {
    return res
      .status(403)
      .json({ error: "Only this business's owner can reply" });
  }

  if (req.method === "DELETE") {
    await db
      .collection("pulse_comments")
      .updateOne(buildIdFilter("_id", commentId) as any, {
        $unset: { businessReply: "" },
      });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "PATCH") {
    const replyBody = s(body.body).slice(0, MAX_REPLY_LENGTH);
    if (!replyBody) {
      return res.status(400).json({ error: "body is required" });
    }

    await ensureApiRateLimitIndexes(db).catch(() => null);
    const limit = await hitApiRateLimit(
      db,
      `pulse-reply:user:${session.userId}`,
      30,
      10,
    );
    if (limit.blocked) {
      res.setHeader("Retry-After", String(limit.retryAfterSeconds));
      return res
        .status(429)
        .json({ error: "Too many replies. Please try again shortly." });
    }

    const now = new Date();
    const isFirstReply = !comment.businessReply;
    await db
      .collection("pulse_comments")
      .updateOne(buildIdFilter("_id", commentId) as any, {
        $set: {
          businessReply: { body: replyBody, createdAt: now },
        },
      });

    // Only notify on the first reply -- an edit shouldn't re-notify the
    // commenter every time the business tweaks wording.
    if (isFirstReply && s(comment.authorUserId) !== session.userId) {
      const owner = await findPersonById(db, session.userId);
      const ownerName = owner
        ? nameFromDoc(owner.doc) || "The business"
        : "The business";
      await createNotification(db, {
        userId: s(comment.authorUserId),
        type: "business_reply",
        title: `${ownerName} replied to your comment`,
        body: replyBody,
        href: postAuthor.href,
      });
    }

    return res.status(200).json({
      ok: true,
      businessReply: { body: replyBody, createdAt: now.toISOString() },
    });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
