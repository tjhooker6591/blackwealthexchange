// src/pages/api/pulse/public-teaser.ts
//
// Public, unauthenticated preview of real Pulse activity for a visitor with
// no account. Before this route existed, a logged-out homepage visitor saw
// nothing in this slot at all -- HomepagePulsePreview is gated to `user`
// and /api/pulse/feed itself requires a session (401 for anyone else).
// But the whole point of Pulse is to pull people INTO the conversation
// before they join, not just reward them with a feed after signing up
// ("if a user does not have an account... he needs to see something that
// will make him want to join to be a part of the conversation").
//
// Reuses the exact same platform-wide public query /api/pulse/feed already
// runs for its `publicItems` field (business_updates + member_posts, same
// profileVisibility enforcement for person posts) -- just unauthenticated,
// capped to a tiny sample, and cached at the edge since every anonymous
// visitor hits this.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, s } from "@/lib/network/shared";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";
import { findPersonById } from "@/lib/network/personLookup";
import { nameFromDoc, normalizeAsset } from "@/pages/api/profile";

const SAMPLE_LIMIT = 3;
const FETCH_LIMIT = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=300",
  );

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const since = new Date(Date.now() - WEEK_MS);

    const [updates, posts, weekUpdateCount, weekPostCount] = await Promise.all([
      db
        .collection("business_updates")
        .find({})
        .sort({ createdAt: -1 })
        .limit(FETCH_LIMIT)
        .toArray(),
      db
        .collection("member_posts")
        .find({})
        .sort({ createdAt: -1 })
        .limit(FETCH_LIMIT)
        .toArray(),
      db
        .collection("business_updates")
        .countDocuments({ createdAt: { $gte: since } }),
      db
        .collection("member_posts")
        .countDocuments({ createdAt: { $gte: since } }),
    ]);

    const updateBusinessIds = Array.from(
      new Set(updates.map((u: any) => s(u.businessId)).filter(Boolean)),
    );
    const idFilter = updateBusinessIds.length
      ? {
          $or: updateBusinessIds
            .map((id) => buildIdFilter("_id", id))
            .filter(Boolean) as any[],
        }
      : null;
    const businesses = idFilter
      ? await db
          .collection("businesses")
          .find(idFilter as any)
          .toArray()
      : [];
    const businessesById = new Map(
      businesses.map((doc: any) => [String(doc._id), doc]),
    );

    const businessItems = updates
      .map((u: any) => {
        const doc = businessesById.get(s(u.businessId));
        if (!doc) return null;
        const profile = mapDirectoryProfileFromDoc(doc);
        return {
          type: "business" as const,
          authorName: profile.displayName || "A BWE business",
          authorAvatarUrl: null as string | null,
          body: String(u.body || "").slice(0, 120),
          createdAt:
            u.createdAt instanceof Date
              ? u.createdAt.toISOString()
              : u.createdAt || null,
        };
      })
      .filter(Boolean);

    const personItems = (
      await Promise.all(
        posts.map(async (p: any) => {
          const found = await findPersonById(db, s(p.authorUserId));
          if (!found || found.doc.profileVisibility !== "public") return null;
          const avatar = normalizeAsset(found.doc, "avatar");
          return {
            type: "person" as const,
            authorName: nameFromDoc(found.doc) || "A BWE member",
            authorAvatarUrl: avatar?.url || null,
            body: String(p.body || "").slice(0, 120),
            createdAt:
              p.createdAt instanceof Date
                ? p.createdAt.toISOString()
                : p.createdAt || null,
          };
        }),
      )
    ).filter(Boolean);

    const sample = [...businessItems, ...personItems]
      .sort((a: any, b: any) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, SAMPLE_LIMIT);

    return res.status(200).json({
      ok: true,
      weeklyActivityCount: weekUpdateCount + weekPostCount,
      sample,
    });
  } catch (err) {
    console.error("[api/pulse/public-teaser] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
