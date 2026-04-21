import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { FEATURED_JOB_TOP_CAP } from "@/lib/advertising/placementDefinitions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(db, `jobs:list:ip:${ip}`, 180, 5);
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const limitRaw = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(300, Math.floor(limitRaw)))
      : 100;

    const jobsRaw = await db
      .collection("jobs")
      .find({ status: "approved" }) // ✅ Only approved jobs
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const now = Date.now();
    let featuredVisibleCount = 0;

    const jobs = jobsRaw.map((job: any) => {
      const featureEndMs = job?.featureEndDate
        ? new Date(job.featureEndDate).getTime()
        : NaN;
      const featuredActiveRaw =
        Boolean(job?.isFeatured) &&
        (!Number.isFinite(featureEndMs) || featureEndMs > now);

      const canShowFeatured =
        featuredActiveRaw && featuredVisibleCount < FEATURED_JOB_TOP_CAP;
      if (canShowFeatured) featuredVisibleCount += 1;

      return {
        ...job,
        isFeatured: canShowFeatured,
      };
    });

    res.setHeader("X-Result-Limit", String(limit));
    res.setHeader("X-Featured-Job-Cap", String(FEATURED_JOB_TOP_CAP));

    return res.status(200).json({
      jobs,
      meta: {
        featuredJobTopCap: FEATURED_JOB_TOP_CAP,
      },
    });
  } catch (error) {
    console.error("Failed to fetch job listings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
