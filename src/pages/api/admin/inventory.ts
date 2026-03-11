// src/pages/api/admin/inventory.ts
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
      `admin:inventory:ip:${ip}`,
      60,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const limitRaw = Number(req.query.limit ?? 500);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(1000, Math.floor(limitRaw)))
      : 500;

    const products = await db
      .collection("products")
      .find(
        {},
        {
          projection: {
            name: 1,
            price: 1,
            stock: 1,
            imageUrl: 1,
            isFeatured: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      )
      .sort({ stock: 1, name: 1 }) // low-stock first
      .limit(limit)
      .toArray();

    return res.status(200).json({
      ok: true,
      meta: { limit },
      products: products.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name || "",
        price: p.price ?? null,
        stock: typeof p.stock === "number" ? p.stock : 0,
        imageUrl: p.imageUrl || "",
        isFeatured: !!p.isFeatured,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
      })),
    });
  } catch (err) {
    console.error("[/api/admin/inventory] Error:", err);
    return res.status(500).json({ error: "Failed to load inventory." });
  }
}
