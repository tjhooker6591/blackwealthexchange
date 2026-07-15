// src/pages/api/admin/get-pending-businesses.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getCanonicalBusinessName } from "@/lib/businessSubmission";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import {
  deriveAdminBusinessStatus,
  getAdminBusinessBucketFilter,
} from "@/lib/adminBusinessStatus";

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
    const ipLimit = await hitApiRateLimit(
      db,
      `admin:unapproved-businesses:ip:${ip}`,
      60,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const limitRaw = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.floor(limitRaw)))
      : 200;

    const unapprovedBusinesses = await db
      .collection("businesses")
      .find(getAdminBusinessBucketFilter("pending"))
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(limit)
      .project({
        business_name: 1,
        businessName: 1,
        name: 1,
        companyName: 1,
        legalName: 1,
        dba: 1,
        title: 1,
        ownerName: 1,
        email: 1,
        approved: 1,
        status: 1,
        submittedAt: 1,
        createdAt: 1,
      })
      .toArray();

    return res.status(200).json({
      ok: true,
      meta: { limit },
      businesses: unapprovedBusinesses.map((b: any) => ({
        _id: b._id.toString(),
        businessName: getCanonicalBusinessName(b) || "",
        ownerName: b.ownerName || "",
        email: b.email || "",
        approved: deriveAdminBusinessStatus(b) === "approved",
        status: deriveAdminBusinessStatus(b),
        submittedAt: b.submittedAt
          ? new Date(b.submittedAt).toISOString()
          : b.createdAt
            ? new Date(b.createdAt).toISOString()
            : null,
      })),
    });
  } catch (error) {
    console.error("[/api/admin/get-pending-businesses] Error:", error);
    return res.status(500).json({ error: "Failed to fetch businesses" });
  }
}
