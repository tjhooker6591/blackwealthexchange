// src/pages/api/admin/approve-product.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const { productId } = body;

  if (!productId || !ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Valid productId is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(db, `admin:approve-product:ip:${ip}`, 30, 5);
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(productId), status: "pending" },
      {
        $set: {
          status: "active",
          isPublished: true,
          approvedAt: new Date(),
          approvedBy: admin.email || admin.userId || "admin",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Product not found or already approved" });
    }

    return res.status(200).json({
      success: true,
      productId,
      status: "active",
      message: "Product approved successfully",
    });
  } catch (error) {
    console.error("[/api/admin/approve-product] Approval Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
