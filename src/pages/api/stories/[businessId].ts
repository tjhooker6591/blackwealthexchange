// src/pages/api/stories/[businessId].ts
//
// Public-safe read: only ever returns stories in state "published" (see
// getPublishedStoriesForBusiness in lib/acquisition/stories.ts). No draft,
// owner_reviewed, or approved-but-unpublished content is ever reachable
// through this route.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getPublishedStoriesForBusiness } from "@/lib/acquisition/stories";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const businessId = String(req.query.businessId || "");
  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const stories = await getPublishedStoriesForBusiness(db, businessId);
  return res.status(200).json({ ok: true, stories });
}
