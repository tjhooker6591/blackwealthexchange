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
import { getCanonicalBusinessName } from "@/lib/businessSubmission";
import {
  AdminApprovalValidationError,
  normalizeAdminApprovalRow,
  resolveUniqueBusinessSlugAndAlias,
} from "@/lib/adminBusinessApprovals";

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
    const existing = await businesses.findOne({
      _id: new ObjectId(businessId),
    });

    if (!existing || existing.approved === true) {
      return res
        .status(404)
        .json({ error: "Business not found or already approved" });
    }

    const normalized = normalizeAdminApprovalRow(existing);
    if (!normalized.canApprove) {
      return res.status(422).json({
        error:
          normalized.kind === "malformed_pending_record"
            ? "Business record is malformed and cannot be approved"
            : "Imported pending record cannot be approved from this queue",
        kind: normalized.kind,
        missingFields: normalized.missingFields,
      });
    }

    const canonicalName = getCanonicalBusinessName(existing);
    if (!canonicalName) {
      return res.status(422).json({
        error: "Business record is malformed: missing business name",
      });
    }

    const applyApprovalUpdate = async (options?: {
      ignoreExistingValues?: boolean;
    }) => {
      const slugResolution = await resolveUniqueBusinessSlugAndAlias({
        businesses,
        existingId: existing._id,
        canonicalName,
        existingSlug: existing.slug,
        existingAlias: existing.alias,
        ignoreExistingValues: options?.ignoreExistingValues ?? false,
      });

      const nextSlug = slugResolution.slug;
      const nextAlias = slugResolution.alias;

      const result = await businesses.updateOne(
        { _id: existing._id, approved: { $ne: true } },
        {
          $set: {
            business_name:
              canonicalName ||
              existing.business_name ||
              existing.businessName ||
              existing.title ||
              "",
            businessName:
              canonicalName ||
              existing.businessName ||
              existing.business_name ||
              existing.title ||
              "",
            title:
              canonicalName ||
              existing.title ||
              existing.business_name ||
              existing.businessName ||
              "",
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

      return { result, nextSlug, nextAlias };
    };

    let approvalWrite;
    try {
      approvalWrite = await applyApprovalUpdate();
    } catch (error: any) {
      if (error?.code === 11000) {
        try {
          approvalWrite = await applyApprovalUpdate({
            ignoreExistingValues: true,
          });
        } catch (retryError: any) {
          if (retryError?.code === 11000) {
            return res.status(409).json({
              error: "Business slug or alias already exists",
              kind: "duplicate_slug_or_alias",
            });
          }
          throw retryError;
        }
      } else {
        throw error;
      }
    }

    const { result, nextSlug, nextAlias } = approvalWrite;

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Business not found or already approved" });
    }

    return res.status(200).json({
      success: true,
      businessId,
      status: "active",
      slug: nextSlug,
      alias: nextAlias,
      message: "Business approved successfully",
    });
  } catch (error: any) {
    if (error instanceof AdminApprovalValidationError) {
      return res.status(error.statusCode).json({
        error: error.message,
        kind: error.kind,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        error: "Business slug or alias already exists",
        kind: "duplicate_slug_or_alias",
      });
    }

    console.error("[/api/admin/approve-business] Approval Error:", error);
    return res.status(500).json({
      error: error?.message || "Internal Server Error",
    });
  }
}
