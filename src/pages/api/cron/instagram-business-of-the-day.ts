// src/pages/api/cron/instagram-business-of-the-day.ts
//
// Runs once a day (vercel.json "crons"). Vercel calls it with
// "Authorization: Bearer <CRON_SECRET>"; anything else is refused. Posts the
// next approved Business of the Day feature to Instagram -- one per run --
// and does nothing when Instagram is not connected or nothing is waiting.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { isInstagramConfigured } from "@/lib/social/instagram";
import {
  nextFeatureToAutoPost,
  postFeatureToInstagram,
} from "@/lib/social/instagramFeature";

export const config = { maxDuration: 60 };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ ok: false, error: "CRON_SECRET is not set" });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    if (!(await isInstagramConfigured(db))) {
      return res
        .status(200)
        .json({ ok: true, posted: false, reason: "not_connected" });
    }
    const feature = await nextFeatureToAutoPost(db);
    if (!feature) {
      return res
        .status(200)
        .json({ ok: true, posted: false, reason: "nothing_waiting" });
    }
    const post = await postFeatureToInstagram(
      db,
      String(feature.businessId),
      "scheduled",
    );
    return res.status(200).json({
      ok: true,
      posted: true,
      businessName: feature.businessName || null,
      permalink: post.permalink,
    });
  } catch (err: any) {
    console.error("[api/cron/instagram-business-of-the-day] error:", err);
    return res
      .status(500)
      .json({
        ok: false,
        error: String(err?.message || "Internal server error"),
      });
  }
}
