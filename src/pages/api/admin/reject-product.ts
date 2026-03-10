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

  const productId = String(body?.productId || "").trim();
  const reason = String(body?.reason || "").trim();

  if (!productId || !ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Valid productId is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(db, `admin:reject-product:ip:${ip}`, 30, 5);
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(productId), status: "pending" },
      {
        $set: {
          status: "rejected",
          isPublished: false,
          rejectedAt: new Date(),
          rejectedBy: admin.email || admin.userId || "admin",
          rejectionReason: reason || null,
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Product not found or no longer pending" });
    }

    return res.status(200).json({
      success: true,
      productId,
      status: "rejected",
      message: "Product rejected successfully",
    });
  } catch (error) {
    console.error("[/api/admin/reject-product] error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
