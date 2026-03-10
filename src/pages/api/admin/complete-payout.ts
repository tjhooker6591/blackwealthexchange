// src/pages/api/admin/complete-affiliate-payout.ts
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

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const { payoutId } = body;

    if (!payoutId || !ObjectId.isValid(payoutId)) {
      return res.status(400).json({ error: "Valid payoutId is required" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(db, `admin:complete-payout:ip:${ip}`, 30, 5);
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const payouts = db.collection("affiliatePayouts");
    const affiliates = db.collection("affiliates");

    const payout = await payouts.findOne({ _id: new ObjectId(payoutId) });
    if (!payout) {
      return res.status(404).json({ error: "Payout not found" });
    }
    if (payout.status === "completed") {
      return res
        .status(409)
        .json({ error: "Payout already completed", payoutId });
    }

    const amount = Number(payout.amount || 0);
    const affiliateId = payout.affiliateId;
    const affiliateSelector =
      typeof affiliateId === "string" && ObjectId.isValid(affiliateId)
        ? { _id: new ObjectId(affiliateId) }
        : { _id: affiliateId as any };

    const result = await payouts.updateOne(
      { _id: new ObjectId(payoutId), status: { $ne: "completed" } },
      {
        $set: {
          status: "completed",
          processedAt: new Date(),
          completedAt: new Date(),
          completedBy: admin.email || admin.userId || "admin",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Payout not found or already completed" });
    }

    if (affiliateId && amount > 0) {
      await affiliates.updateOne(affiliateSelector, {
        $inc: { totalPaid: amount },
        $set: { updatedAt: new Date() },
      });
    }

    return res.status(200).json({
      success: true,
      payoutId,
      status: "completed",
      message: "Payout marked as completed.",
    });
  } catch (err) {
    console.error("[/api/admin/complete-affiliate-payout] Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
