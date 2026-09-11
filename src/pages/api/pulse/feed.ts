// src/pages/api/pulse/feed.ts
//
// BWE Pulse -- the aggregated feed. Every building block this reads from
// already existed and already worked in isolation (follows, business_updates,
// user_follows, member_posts, the recommendation engine); nothing here
// invents new data, it just composes them into one personalized stream:
//
//   1. Real updates posted by businesses the caller follows
//      (business_updates, unchanged -- see src/pages/api/business/updates.ts)
//   2. Real posts from people the caller follows (member_posts, kept in
//      its own collection rather than folded into business_updates --
//      see src/pages/api/user/posts.ts)
//   3. A "Discover" rail using the existing recommendation engine
//      (src/lib/personalization/recommendations.ts) as a transparent
//      trending/personalized fallback so the feed is never empty for a
//      user who follows nothing yet.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, getNetworkSession, s } from "@/lib/network/shared";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";
import { resolveRecommendations } from "@/lib/personalization/recommendations";
import { findPersonById } from "@/lib/network/personLookup";
import { nameFromDoc, normalizeAsset } from "@/pages/api/profile";

const FEED_LIMIT = 30;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = getNetworkSession(req);
  if (!session) {
    return res.status(401).json({ error: "Login required" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const followRows = await db
      .collection("follows")
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const followedBusinessIds = Array.from(
      new Set(followRows.map((row: any) => s(row.businessId)).filter(Boolean)),
    );

    let items: any[] = [];
    if (followedBusinessIds.length) {
      const updates = await db
        .collection("business_updates")
        .find({ businessId: { $in: followedBusinessIds } })
        .sort({ createdAt: -1 })
        .limit(FEED_LIMIT)
        .toArray();

      const updateBusinessIds = Array.from(
        new Set(updates.map((u: any) => s(u.businessId))),
      );
      // business_updates.businessId is stored as a plain string (see
      // src/pages/api/business/updates.ts), but businesses._id is a real
      // ObjectId -- same $or-per-id pattern follow.ts uses for this exact
      // string-vs-ObjectId mismatch, not a naive $in.
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

      items = updates
        .map((u: any) => {
          const doc = businessesById.get(s(u.businessId));
          if (!doc) return null;
          const profile = mapDirectoryProfileFromDoc(doc);
          return {
            type: "business" as const,
            id: String(u._id),
            authorId: s(u.businessId),
            authorName: profile.displayName || "A business you follow",
            authorHref: `/business/${encodeURIComponent(doc.alias || doc.slug || String(doc._id))}`,
            authorAvatarUrl: null as string | null,
            title: u.title || "",
            body: u.body || "",
            createdAt:
              u.createdAt instanceof Date
                ? u.createdAt.toISOString()
                : u.createdAt || null,
          };
        })
        .filter(Boolean);
    }

    const personFollowRows = await db
      .collection("user_follows")
      .find({ followerId: session.userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const followedUserIds = Array.from(
      new Set(
        personFollowRows
          .map((row: any) => s(row.followingUserId))
          .filter(Boolean),
      ),
    );

    let personItems: any[] = [];
    if (followedUserIds.length) {
      const posts = await db
        .collection("member_posts")
        .find({ authorUserId: { $in: followedUserIds } })
        .sort({ createdAt: -1 })
        .limit(FEED_LIMIT)
        .toArray();

      personItems = (
        await Promise.all(
          posts.map(async (p: any) => {
            const found = await findPersonById(db, s(p.authorUserId));
            // A follow can still exist even if the author later made their
            // profile private again -- don't surface their content once
            // they've opted back out, same boundary as posting/following.
            if (!found || found.doc.profileVisibility !== "public") return null;
            const avatar = normalizeAsset(found.doc, "avatar");
            return {
              type: "person" as const,
              id: String(p._id),
              authorId: s(p.authorUserId),
              authorName: nameFromDoc(found.doc) || "A member you follow",
              authorHref: `/u/${s(p.authorUserId)}`,
              authorAvatarUrl: avatar?.url || null,
              title: "",
              body: p.body || "",
              createdAt:
                p.createdAt instanceof Date
                  ? p.createdAt.toISOString()
                  : p.createdAt || null,
            };
          }),
        )
      ).filter(Boolean);
    }

    const combined = [...items, ...personItems]
      .sort((a: any, b: any) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, FEED_LIMIT);

    const recommendations = await resolveRecommendations(db, {
      userId: session.userId,
      limit: 8,
    });

    return res.status(200).json({
      ok: true,
      followingCount: followedBusinessIds.length + followedUserIds.length,
      items: combined,
      discover: recommendations,
    });
  } catch (err) {
    console.error("[api/pulse/feed] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
