// src/pages/api/admin/users.ts
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
    const ipLimit = await hitApiRateLimit(
      db,
      `admin:get-users:ip:${ip}`,
      60,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(200, Math.floor(limitRaw)))
      : 50;

    const users = await db
      .collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .project({
        email: 1,
        name: 1,
        firstName: 1,
        lastName: 1,
        accountType: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .toArray();

    return res.status(200).json({
      ok: true,
      meta: { limit },
      users: users.map((u: any) => ({
        _id: u._id.toString(),
        email: u.email || "",
        name:
          u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || "",
        accountType: u.accountType || "user",
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("[/api/admin/users] Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users." });
  }
}
