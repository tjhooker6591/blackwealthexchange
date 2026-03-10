// src/pages/api/admin/get-pending-products.ts
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
    const ipLimit = await hitApiRateLimit(db, `admin:unapproved-products:ip:${ip}`, 60, 5);
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const limitRaw = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.floor(limitRaw)))
      : 200;

    const unapprovedProducts = await db
      .collection("products")
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .project({
        name: 1,
        price: 1,
        imageUrl: 1,
        category: 1,
        sellerId: 1,
        status: 1,
        createdAt: 1,
      })
      .toArray();

    return res.status(200).json({
      ok: true,
      meta: { limit },
      products: unapprovedProducts.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name || "",
        price: p.price ?? null,
        imageUrl: p.imageUrl || "",
        category: p.category || "",
        sellerId: p.sellerId || "",
        status: p.status || "pending",
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("[/api/admin/get-pending-products] Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch unapproved products" });
  }
}
