// src/pages/api/admin/get-pending-businesses.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getCanonicalBusinessName } from "@/lib/businessSubmission";
import {
  deriveAdminBusinessStatus,
  getAdminBusinessBucketFilter,
  getAdminBusinessCounts,
} from "@/lib/adminBusinessStatus";
import {
  deriveApprovalQueueBucket,
  getApprovalIneligibilityReasons,
  getApprovalQueueBaseFilter,
  normalizeAdminApprovalRow,
  type ApprovalQueueBucket,
} from "@/lib/adminBusinessApprovals";

const APPROVAL_QUEUE_BUCKETS: ApprovalQueueBucket[] = [
  "approval_ready",
  "needs_requirements",
  "review_exception",
];

function isApprovalQueueBucket(value: string): value is ApprovalQueueBucket {
  return (APPROVAL_QUEUE_BUCKETS as string[]).includes(value);
}

function parseIntSafe(v: unknown, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function iso(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

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
    const {
      page = "1",
      limit = "25",
      q,
      status = "approval_ready", // approval_ready | needs_requirements | review_exception | pending | approved | rejected | all
      source = "mixed", // mixed | status | approved
    } = req.query as Record<string, string>;

    const pageNum = parseIntSafe(page, 1);
    const limitNum = Math.min(parseIntSafe(limit, 25), 200);
    const skip = (pageNum - 1) * limitNum;

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const businessesCol = db.collection("businesses");

    // ---- Search (business name/email/category/owner/etc.) ----
    const searchOr: any[] = [];
    if (q && q.trim()) {
      const query = q.trim();

      searchOr.push(
        { business_name: { $regex: query, $options: "i" } },
        { businessName: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { companyName: { $regex: query, $options: "i" } },
        { legalName: { $regex: query, $options: "i" } },
        { dba: { $regex: query, $options: "i" } },
        { title: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { ownerName: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { businessCategory: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      );

      if (ObjectId.isValid(query)) {
        searchOr.push({ _id: new ObjectId(query) });
      }
    }

    function withSearch(baseFilter: any): any {
      if (!searchOr.length) return baseFilter;
      if (baseFilter.$and) {
        return { $and: [...baseFilter.$and, { $or: searchOr }] };
      }
      if (baseFilter.$or) {
        return { $and: [{ $or: baseFilter.$or }, { $or: searchOr }] };
      }
      return { ...baseFilter, $or: searchOr };
    }

    let total: number;
    let businesses: any[];
    let approvalQueueCounts: {
      approval_ready: number;
      needs_requirements: number;
      review_exception: number;
    } | null = null;

    if (isApprovalQueueBucket(status)) {
      // Eligibility depends on which of several possible name/email field
      // names a document has, which isn't cleanly expressible as one
      // indexed Mongo condition -- fetch the (already narrow) base
      // population and classify with the same function approve-business.ts
      // itself uses to gate the actual approve action, then bucket, sort,
      // and paginate in memory. Base population is a few thousand
      // documents at most, fine for an admin-only page.
      const baseFilter = withSearch(getApprovalQueueBaseFilter());
      const basePopulation = await businessesCol.find(baseFilter).toArray();

      const counts = {
        approval_ready: 0,
        needs_requirements: 0,
        review_exception: 0,
      };
      const bucketed: any[] = [];
      for (const doc of basePopulation) {
        const bucket = deriveApprovalQueueBucket(doc);
        counts[bucket]++;
        if (bucket === status) bucketed.push(doc);
      }
      approvalQueueCounts = counts;

      bucketed.sort((a, b) => {
        const aDate = new Date(a.createdAt || a.submittedAt || 0).getTime();
        const bDate = new Date(b.createdAt || b.submittedAt || 0).getTime();
        return bDate - aDate;
      });

      total = bucketed.length;
      businesses = bucketed.slice(skip, skip + limitNum);
    } else {
      const filter: any = withSearch(
        status === "all"
          ? {}
          : status === "pending" ||
              status === "approved" ||
              status === "rejected"
            ? getAdminBusinessBucketFilter(status)
            : { status },
      );

      total = await businessesCol.countDocuments(filter);
      businesses = await businessesCol
        .find(filter)
        .sort({ createdAt: -1, submittedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();
    }

    // ---- Normalize for UI use ----
    const rows = businesses.map((b: any) => {
      const businessName = getCanonicalBusinessName(b) || "Unnamed Business";

      const derivedStatus = deriveAdminBusinessStatus(b);
      const normalizedApproval = normalizeAdminApprovalRow(b);

      return {
        ...b,
        id: String(b._id),
        businessName,
        displayEmail: s(b.email),
        displayPhone: s(b.phone) || s(b.businessPhone),
        displayCategory: s(b.category) || s(b.businessCategory),
        derivedStatus,
        queueKind: normalizedApproval.kind,
        canApprove: normalizedApproval.canApprove,
        canReject: normalizedApproval.canReject,
        missingFields: normalizedApproval.missingFields,
        ineligibilityReasons: getApprovalIneligibilityReasons(b),
        approvalQueueBucket: deriveApprovalQueueBucket(b),
        automationDisposition:
          typeof b?.blackOwnedVerification?.decision?.disposition === "string"
            ? b.blackOwnedVerification.decision.disposition
            : null,
        automationSummary:
          typeof b?.blackOwnedVerification?.decision?.summary === "string"
            ? b.blackOwnedVerification.decision.summary
            : null,
        requiredActions: Array.isArray(
          b?.blackOwnedVerification?.decision?.requiredActions,
        )
          ? b.blackOwnedVerification.decision.requiredActions
          : [],
        createdAtIso: iso(b.createdAt),
        submittedAtIso: iso(b.submittedAt),
        updatedAtIso: iso(b.updatedAt),
      };
    });

    // Optional extra summaries for dashboard tiles
    const {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      duplicateReview: duplicateReviewCount,
      total: totalBusinesses,
    } = await getAdminBusinessCounts(db);

    // approvalQueueCounts is only computed on the in-memory path above (it
    // needs the classified base population); compute it the same way for
    // any other status value too, so tab counts stay accurate no matter
    // which tab is currently selected.
    if (!approvalQueueCounts) {
      const baseFilter = getApprovalQueueBaseFilter();
      const basePopulation = await businessesCol
        .find(baseFilter)
        .project({
          business_name: 1,
          businessName: 1,
          name: 1,
          companyName: 1,
          legalName: 1,
          dba: 1,
          title: 1,
          email: 1,
          ownerEmail: 1,
          businessEmail: 1,
          status: 1,
        })
        .toArray();
      const counts = {
        approval_ready: 0,
        needs_requirements: 0,
        review_exception: 0,
      };
      for (const doc of basePopulation)
        counts[deriveApprovalQueueBucket(doc)]++;
      approvalQueueCounts = counts;
    }

    return res.status(200).json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      businesses: rows,
      summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        approvalReady: approvalQueueCounts.approval_ready,
        needsRequirements: approvalQueueCounts.needs_requirements,
        reviewException: approvalQueueCounts.review_exception,
        duplicateReview: duplicateReviewCount,
        totalBusinesses,
      },
      filters: {
        status,
        q: q || "",
        source,
      },
    });
  } catch (error) {
    console.error("[/api/admin/get-pending-businesses] error:", error);
    return res.status(500).json({ error: "Error fetching pending businesses" });
  }
}
