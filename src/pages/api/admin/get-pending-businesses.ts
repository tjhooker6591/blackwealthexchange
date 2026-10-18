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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function emailsOf(b: any): string[] {
  return [b?.email, b?.businessEmail, b?.ownerEmail]
    .map((v) => s(v)?.toLowerCase())
    .filter((v): v is string => Boolean(v));
}

// What the applicant said about ownership, for the admin to check before
// ticking "Verified Black-owned".
function ownershipSubmission(b: any) {
  const owners = Array.isArray(b?.blackOwnedVerification?.owners)
    ? b.blackOwnedVerification.owners.map((o: any) => ({
        name: s(o?.ownerName),
        percent:
          typeof o?.ownershipPercentage === "number"
            ? o.ownershipPercentage
            : null,
        role: s(o?.controlRole) || s(o?.roleTitle),
        attestedBlackOwned: o?.isBlackAttested === true,
      }))
    : [];
  const claimant = b?.claimantVerification;
  return {
    owners,
    claimantName: s(claimant?.claimantName),
    claimantRelationship: s(claimant?.relationshipToBusiness),
    claimantRole: s(claimant?.claimantRoleTitle),
  };
}

// Other records with the same email or the same business name, so a
// signup and a separate add-listing submission are caught before approval.
async function findPossibleDuplicates(col: any, docs: any[]) {
  const out = new Map<string, any[]>();
  if (!docs.length) return out;
  const emails = [...new Set(docs.flatMap(emailsOf))];
  const names = [
    ...new Set(
      docs
        .map((d) => getCanonicalBusinessName(d)?.trim().toLowerCase())
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const or: any[] = [];
  for (const e of emails) {
    const rx = new RegExp(`^${escapeRegex(e)}$`, "i");
    or.push({ email: rx }, { businessEmail: rx }, { ownerEmail: rx });
  }
  for (const n of names) {
    const rx = new RegExp(`^\\s*${escapeRegex(n)}\\s*$`, "i");
    or.push({ business_name: rx }, { businessName: rx });
  }
  if (!or.length) return out;
  const candidates = await col
    .find(
      { $or: or, status: { $nin: ["rejected", "archived"] } },
      {
        projection: {
          business_name: 1,
          businessName: 1,
          title: 1,
          name: 1,
          email: 1,
          businessEmail: 1,
          ownerEmail: 1,
          status: 1,
          approved: 1,
          alias: 1,
          slug: 1,
          createdAt: 1,
        },
      },
    )
    .limit(500)
    .toArray();
  for (const d of docs) {
    const id = String(d._id);
    const myEmails = new Set(emailsOf(d));
    const myName = getCanonicalBusinessName(d)?.trim().toLowerCase() || "";
    const matches = candidates
      .filter((c: any) => String(c._id) !== id)
      .map((c: any) => {
        const sameEmail = emailsOf(c).some((e) => myEmails.has(e));
        const sameName =
          Boolean(myName) &&
          (getCanonicalBusinessName(c)?.trim().toLowerCase() || "") === myName;
        if (!sameEmail && !sameName) return null;
        return {
          _id: String(c._id),
          businessName: getCanonicalBusinessName(c) || "Unnamed Business",
          status: s(c.status),
          approved: c.approved === true,
          alias: s(c.alias) || s(c.slug),
          createdAt: iso(c.createdAt),
          matchedOn: [sameEmail ? "email" : null, sameName ? "name" : null]
            .filter(Boolean)
            .join(" + "),
        };
      })
      .filter(Boolean);
    if (matches.length) out.set(id, matches);
  }
  return out;
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

    const duplicatesById = await findPossibleDuplicates(
      businessesCol,
      businesses,
    );

    // ---- Normalize for UI use ----
    const rows = businesses.map(({ password: _password, ...b }: any) => {
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
        ownershipSubmission: ownershipSubmission(b),
        possibleDuplicates: duplicatesById.get(String(b._id)) || [],
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
