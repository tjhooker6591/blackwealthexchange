// src/pages/api/admin/get-pending-jobs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
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
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(db, `admin:unapproved-jobs:ip:${ip}`, 60, 5);
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const limitRaw = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.floor(limitRaw)))
      : 200;

    const jobs = await db
      .collection("jobs")
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .project({
        title: 1,
        company: 1,
        employerName: 1,
        employerEmail: 1,
        location: 1,
        jobType: 1,
        salary: 1,
        createdAt: 1,
        status: 1,
      })
      .toArray();

    return res.status(200).json({
      ok: true,
      meta: { limit },
      jobs: jobs.map((job: any) => ({
        _id: job._id.toString(),
        title: job.title || "",
        company: job.company || job.employerName || "",
        employerEmail: job.employerEmail || "",
        location: job.location || "",
        jobType: job.jobType || "",
        salary: job.salary ?? null,
        status: job.status || "pending",
        createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("[/api/admin/get-pending-jobs] Error:", error);
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }
}
