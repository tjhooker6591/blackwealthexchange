// src/pages/api/user/public-profile.ts
//
// BWE Pulse Phase 2 -- read-only, public (no auth required to view). Only
// ever returns a profile that the account holder explicitly opted into
// making public (profileVisibility === "public", set only via PATCH
// /api/profile -- see src/pages/api/profile.ts). Never leaks whether a
// given id exists if it isn't public: same 404 either way.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { s } from "@/lib/network/shared";
import { findPersonById } from "@/lib/network/personLookup";
import { nameFromDoc, normalizeAsset } from "@/pages/api/profile";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = s(req.query.userId as string);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const found = await findPersonById(db, userId);

    if (!found || found.doc.profileVisibility !== "public") {
      return res.status(404).json({ error: "Profile not found" });
    }

    const avatar = normalizeAsset(found.doc, "avatar");

    return res.status(200).json({
      id: String(found.doc._id),
      name: nameFromDoc(found.doc) || "BWE Member",
      bio: found.doc.bio || "",
      avatar,
      memberSince:
        found.doc.createdAt instanceof Date
          ? found.doc.createdAt.toISOString()
          : found.doc.createdAt || null,
    });
  } catch (err) {
    console.error("[api/user/public-profile] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
