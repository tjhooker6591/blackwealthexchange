// src/pages/api/admin/approve-business.ts
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
import { buildUniqueSlug, getCanonicalBusinessName, slugifyBusinessName } from "@/lib/businessSubmission";

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

  const { businessId } = body;

  if (!businessId || !ObjectId.isValid(businessId)) {
    return res.status(400).json({ error: "Valid businessId is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      db,
      `admin:approve-business:ip:${ip}`,
      30,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const businesses = db.collection("businesses");
    const existing = await businesses.findOne({ _id: new ObjectId(businessId) });

    if (!existing || existing.approved === true) {
      return res
        .status(404)
        .json({ error: "Business not found or already approved" });
    }

    const canonicalName = getCanonicalBusinessName(existing);
    const slugBase = slugifyBusinessName(canonicalName || "business");
    const desiredSlug =
      typeof existing.slug === "string" && existing.slug.trim()
        ? existing.slug.trim()
        : slugBase;
    const desiredAlias =
      typeof existing.alias === "string" && existing.alias.trim()
        ? existing.alias.trim()
        : desiredSlug;

    let nextSlug = desiredSlug;
    let nextAlias = desiredAlias;

    if (canonicalName && (!desiredSlug || !desiredAlias)) {
      const existingWithSlug = await businesses.countDocuments({
        _id: { $ne: existing._id },
        slug: { $regex: `^${slugBase}(-\\d+)?$`, $options: "i" },
      });
      nextSlug = buildUniqueSlug(slugBase, existingWithSlug) || slugBase;
      nextAlias = nextSlug;
    }

    const result = await businesses.updateOne(
      { _id: existing._id, approved: { $ne: true } },
      {
        $set: {
          business_name: canonicalName || existing.business_name || existing.businessName || existing.title || "",
          businessName: canonicalName || existing.businessName || existing.business_name || existing.title || "",
          title: canonicalName || existing.title || existing.business_name || existing.businessName || "",
          slug: nextSlug,
          alias: nextAlias,
          approved: true,
          status: "active",
          approvedAt: new Date(),
          approvedBy: admin.email || admin.userId || "admin",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Business not found or already approved" });
    }

    return res.status(200).json({
      success: true,
      businessId,
      status: "active",
      message: "Business approved successfully",
    });
  } catch (error) {
    console.error("[/api/admin/approve-business] Approval Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
