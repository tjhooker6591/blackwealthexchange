// src/pages/api/admin/dashboard.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

type Business = {
  _id: string;
  businessName: string;
  email: string;
  address: string;
  approved: boolean;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    { ok: true; businesses: Business[] } | { error: string }
  >,
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
    const ipLimit = await hitApiRateLimit(db, `admin:dashboard:ip:${ip}`, 60, 5);
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const limitRaw = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.floor(limitRaw)))
      : 200;

    const businesses = await db
      .collection("businesses")
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .project({
        businessName: 1,
        email: 1,
        address: 1,
        approved: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .toArray();

    const formattedBusinesses: Business[] = businesses.map((business: any) => ({
      _id: business._id.toString(),
      businessName: business.businessName || "",
      email: business.email || "",
      address: business.address || "",
      approved: !!business.approved,
      status: business.status || (business.approved ? "active" : "pending"),
      createdAt: business.createdAt
        ? new Date(business.createdAt).toISOString()
        : null,
      updatedAt: business.updatedAt
        ? new Date(business.updatedAt).toISOString()
        : null,
    }));

    return res.status(200).json({
      ok: true,
      meta: { limit },
      businesses: formattedBusinesses,
    });
  } catch (error) {
    console.error("[/api/admin/dashboard] Error fetching businesses:", error);
    return res.status(500).json({ error: "Error fetching businesses" });
  }
}
