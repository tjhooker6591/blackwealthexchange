import { performance } from "node:perf_hooks";
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { FEATURED_JOB_TOP_CAP } from "@/lib/advertising/placementDefinitions";

type JobsListCacheEntry = { at: number; payload: string };
const JOBS_LIST_CACHE_TTL_MS = 60_000;
let rateLimitIndexesReadyPromise: Promise<unknown> | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const cacheKey = JSON.stringify(req.query || {});
    const cache =
      ((globalThis as any).__bweJobsListCache as
        | Map<string, JobsListCacheEntry>
        | undefined) || new Map<string, JobsListCacheEntry>();
    (globalThis as any).__bweJobsListCache = cache;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < JOBS_LIST_CACHE_TTL_MS) {
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=120",
      );
      res.setHeader("X-Jobs-Cache", "HIT");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(cached.payload);
    }

    const t0 = performance.now();
    const client = await clientPromise;
    const tAfterConnect = performance.now();
    const db = client.db(getMongoDbName());

    if (!rateLimitIndexesReadyPromise) {
      rateLimitIndexesReadyPromise = ensureApiRateLimitIndexes(db);
    }
    await rateLimitIndexesReadyPromise;
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

    const tBeforeFind = performance.now();
    const jobsRaw = await db
      .collection("jobs")
      .find(
        { status: "approved" },
        {
          projection: {
            _id: 1,
            title: 1,
            company: 1,
            location: 1,
            createdAt: 1,
            isFeatured: 1,
            featureEndDate: 1,
            salary: 1,
            employmentType: 1,
            applyUrl: 1,
            description: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    const tAfterFind = performance.now();

    const now = Date.now();
    let featuredVisibleCount = 0;

    const jobs = jobsRaw.map((job: any) => {
      const featureEndMs = job?.featureEndDate
        ? new Date(job.featureEndDate).getTime()
        : NaN;
      const hasPaidFeatureWindow = Number.isFinite(featureEndMs);
      const featuredActiveRaw =
        Boolean(job?.isFeatured) && hasPaidFeatureWindow && featureEndMs > now;

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

    const payload = {
      jobs,
      meta: {
        featuredJobTopCap: FEATURED_JOB_TOP_CAP,
        featuredRules: [
          "status must be approved",
          "isFeatured must be true",
          "featureEndDate must exist",
          "featureEndDate must be in the future",
          "result is capped by FEATURED_JOB_TOP_CAP",
        ],
      },
    } as any;

    const tBeforeSerialize = performance.now();
    const jsonString = JSON.stringify(payload);
    const tAfterSerialize = performance.now();

    res.setHeader(
      "Server-Timing",
      `connect;dur=${Math.round(tAfterConnect - t0)},query;dur=${Math.round(tAfterFind - tBeforeFind)},serialize;dur=${Math.round(tAfterSerialize - tBeforeSerialize)},total;dur=${Math.round(tAfterSerialize - t0)}`,
    );
    res.setHeader("X-Jobs-Cache", "MISS");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    cache.set(cacheKey, { at: Date.now(), payload: jsonString });
    return res.status(200).send(jsonString);
  } catch (error) {
    console.error("Failed to fetch job listings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
