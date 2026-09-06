// src/pages/api/business/updates.ts
//
// Phase 5 -- Business Updates. A verified business owner/manager can post
// a real update about their business; every real follower (from the new
// `follows` collection) gets a real notification. Ownership is verified
// through the existing personBusinessRelationships resolver
// (src/lib/personBusinessRelationships.ts) rather than re-deriving
// ownership rules here.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, getNetworkSession, s } from "@/lib/network/shared";
import { notifyBusinessFollowers } from "@/lib/network/notifications";
import { resolvePersonBusinessRelationship } from "@/lib/personBusinessRelationships";

const MAX_TITLE_LENGTH = 140;
const MAX_BODY_LENGTH = 2000;

async function ensureIndexes(db: any) {
  await db
    .collection("business_updates")
    .createIndex({ businessId: 1, createdAt: -1 })
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
    const businessId = s(req.query.businessId as string);
    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }

    const updates = await db
      .collection("business_updates")
      .find({ businessId })
      .sort({ createdAt: -1 })
      .limit(25)
      .toArray();

    return res.status(200).json({
      updates: updates.map((u: any) => ({
        id: String(u._id),
        title: u.title || "",
        body: u.body || "",
        createdAt:
          u.createdAt instanceof Date
            ? u.createdAt.toISOString()
            : u.createdAt || null,
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
    const businessId = s(body.businessId);
    const title = s(body.title).slice(0, MAX_TITLE_LENGTH);
    const updateBody = s(body.body).slice(0, MAX_BODY_LENGTH);

    if (!businessId || !title || !updateBody) {
      return res
        .status(400)
        .json({ error: "businessId, title, and body are required" });
    }

    const relationship = await resolvePersonBusinessRelationship(db, {
      userId: session.userId,
      businessId,
    });

    const canPost =
      relationship.ok &&
      relationship.relationship &&
      (relationship.relationship.relationshipTypes.includes("OWNER") ||
        relationship.relationship.relationshipTypes.includes(
          "VERIFIED_REPRESENTATIVE",
        ) ||
        relationship.relationship.relationshipTypes.includes("MANAGER"));

    if (!canPost) {
      return res.status(403).json({
        error:
          "Only a verified owner, representative, or manager of this business can post updates.",
      });
    }

    const business = await db
      .collection("businesses")
      .findOne(buildIdFilter("_id", businessId) as any, {
        projection: {
          alias: 1,
          slug: 1,
          businessName: 1,
          business_name: 1,
          name: 1,
        },
      });
    if (!business) return res.status(404).json({ error: "Business not found" });

    const now = new Date();
    const result = await db.collection("business_updates").insertOne({
      businessId,
      authorUserId: session.userId,
      title,
      body: updateBody,
      createdAt: now,
    });

    const publicHref =
      business.alias || business.slug
        ? `/business/${encodeURIComponent(business.alias || business.slug)}`
        : "/business-directory";
    const businessName =
      business.businessName ||
      business.business_name ||
      business.name ||
      "A business you follow";

    const notified = await notifyBusinessFollowers(db, {
      businessId,
      excludeUserId: session.userId,
      type: "business_update",
      title: `${businessName}: ${title}`,
      body: updateBody,
      href: publicHref,
    });

    return res.status(201).json({
      ok: true,
      update: {
        id: String(result.insertedId),
        title,
        body: updateBody,
        createdAt: now.toISOString(),
      },
      followersNotified: notified,
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method Not Allowed" });
}
