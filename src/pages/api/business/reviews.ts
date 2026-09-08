// src/pages/api/business/reviews.ts
//
// Phase 5 -- Business Reviews. Distinct from the existing marketplace
// product reviews (src/pages/api/marketplace/reviews.ts, `product_reviews`
// collection, P3-03) -- this is a review of a directory business as a
// whole, not of a single product. Same GET (public list + average) / POST
// (authenticated upsert) shape, new `business_reviews` collection.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, getNetworkSession, s } from "@/lib/network/shared";
import { createNotification } from "@/lib/network/notifications";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

const MAX_COMMENT_LENGTH = 1000;

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] || "BWE member";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 40);
}

async function ensureIndexes(db: any) {
  await db
    .collection("business_reviews")
    .createIndex(
      { businessId: 1, userId: 1 },
      { unique: true, name: "uniq_business_reviews_business_user" },
    )
    .catch(() => null);
  await db
    .collection("business_reviews")
    .createIndex({ businessId: 1, createdAt: -1 })
    .catch(() => null);
}

async function notifyBusinessOwners(
  db: any,
  businessId: string,
  reviewerUserId: string,
  input: { title: string; body: string; href: string },
) {
  const business = await db
    .collection("businesses")
    .findOne(buildIdFilter("_id", businessId) as any, {
      projection: { claimedByUserId: 1, managedByUserId: 1, ownerUserIds: 1 },
    });
  if (!business) return;

  const ownerIds = new Set<string>();
  if (business.claimedByUserId) ownerIds.add(s(business.claimedByUserId));
  if (business.managedByUserId) ownerIds.add(s(business.managedByUserId));
  if (Array.isArray(business.ownerUserIds)) {
    for (const id of business.ownerUserIds) ownerIds.add(s(id));
  }
  ownerIds.delete(reviewerUserId);
  ownerIds.delete("");

  for (const ownerId of ownerIds) {
    await createNotification(db, {
      userId: ownerId,
      type: "review_received",
      title: input.title,
      body: input.body,
      href: input.href,
    });
  }
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
    const businessId = s(req.query.businessId as string);
    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }

    const reviews = await db
      .collection("business_reviews")
      .find({ businessId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const ratings = reviews.map((r: any) => Number(r.rating) || 0);
    const count = ratings.length;
    const averageRating = count
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10
      : 0;

    return res.status(200).json({
      businessId,
      count,
      averageRating,
      reviews: reviews.map((r: any) => ({
        id: String(r._id),
        userName: r.userName || "BWE member",
        rating: Number(r.rating) || 0,
        comment: r.comment || null,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : r.createdAt || null,
      })),
    });
  }

  if (req.method === "POST") {
    const session = getNetworkSession(req);
    if (!session) return res.status(401).json({ error: "Login required" });

    // Phase 8 -- P8-08 Bot/Scraper/Fraud/Abuse Defense. Business reviews had
    // no rate limiting at all: the per-(business,user) unique index stops
    // spamming the SAME business repeatedly, but nothing stopped one
    // authenticated session from posting review-bombing/fake reviews across
    // many DIFFERENT businesses in rapid succession.
    await ensureApiRateLimitIndexes(db).catch(() => null);
    const ip = getClientIp(req);
    const userLimit = await hitApiRateLimit(
      db,
      `business-review:user:${session.userId}`,
      10,
      10,
    );
    const ipLimit = await hitApiRateLimit(
      db,
      `business-review:ip:${ip}`,
      20,
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
        .json({ error: "Too many reviews. Please try again shortly." });
    }

    const body: any =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const businessId = s(body.businessId);
    const ratingRaw = Number(body.rating);
    const comment = s(body.comment).slice(0, MAX_COMMENT_LENGTH);

    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }
    if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
      return res
        .status(400)
        .json({ error: "rating must be a whole number from 1 to 5" });
    }

    const business = await db
      .collection("businesses")
      .findOne(buildIdFilter("_id", businessId) as any, {
        projection: { _id: 1, alias: 1, slug: 1 },
      });
    if (!business) return res.status(404).json({ error: "Business not found" });

    const userName = session.email
      ? displayNameFromEmail(session.email)
      : "BWE member";

    const now = new Date();
    await db.collection("business_reviews").updateOne(
      { businessId, userId: session.userId },
      {
        $set: {
          businessId,
          userId: session.userId,
          userName,
          rating: ratingRaw,
          comment: comment || null,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    const saved = await db
      .collection("business_reviews")
      .findOne({ businessId, userId: session.userId });

    const publicHref =
      business.alias || business.slug
        ? `/business/${encodeURIComponent(business.alias || business.slug)}`
        : "/business-directory";

    await notifyBusinessOwners(db, businessId, session.userId, {
      title: `New review: ${ratingRaw}/5 stars`,
      body: comment || `${userName} left a ${ratingRaw}/5 review.`,
      href: publicHref,
    }).catch(() => null);

    return res.status(201).json({
      ok: true,
      review: saved
        ? {
            id: String(saved._id),
            userName: saved.userName,
            rating: saved.rating,
            comment: saved.comment,
            createdAt:
              saved.createdAt instanceof Date
                ? saved.createdAt.toISOString()
                : saved.createdAt,
          }
        : null,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
