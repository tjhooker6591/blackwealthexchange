import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

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

    const jobs = await db
      .collection("jobs")
      .find({ status: "approved" }) // ✅ Only approved jobs
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.setHeader("X-Result-Limit", String(limit));

    return res.status(200).json({ jobs });
  } catch (error) {
    console.error("Failed to fetch job listings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
