import type { Collection, Filter, ObjectId } from "mongodb";
import {
  buildUniqueSlug,
  getCanonicalBusinessName,
  slugifyBusinessName,
} from "@/lib/businessSubmission";
import {
  deriveAdminBusinessStatus,
  getAdminBusinessBucketFilter,
} from "@/lib/adminBusinessStatus";

export class AdminApprovalValidationError extends Error {
  statusCode: number;
  kind: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      kind?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "AdminApprovalValidationError";
    this.statusCode = options?.statusCode ?? 422;
    this.kind = options?.kind ?? "approval_validation_error";
    this.details = options?.details;
  }
}

export type AdminApprovalRowKind =
  | "approvable_submission"
  | "imported_pending_record"
  | "malformed_pending_record";

export type NormalizedAdminApprovalRow = {
  _id: string;
  businessName: string;
  ownerName: string | null;
  email: string | null;
  submittedAt: string | null;
  status: string;
  kind: AdminApprovalRowKind;
  canApprove: boolean;
  canReject: boolean;
  missingFields: string[];
  sourceLabel: string;
  listingType: string | null;
  slug: string | null;
  alias: string | null;
};

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getSubmissionEmail(doc: any): string | null {
  return (
    safeString(doc?.email) ||
    safeString(doc?.ownerEmail) ||
    safeString(doc?.businessEmail) ||
    null
  );
}

function getSubmissionOwnerName(doc: any): string | null {
  return (
    safeString(doc?.ownerName) ||
    safeString(doc?.owner_name) ||
    safeString(doc?.contactName) ||
    safeString(doc?.fullName) ||
    null
  );
}

function getSubmissionDate(doc: any): string | null {
  return (
    toIso(doc?.submittedAt) ||
    toIso(doc?.createdAt) ||
    toIso(doc?.updatedAt) ||
    null
  );
}

function inferRowKind(doc: any): AdminApprovalRowKind {
  const canonicalName = getCanonicalBusinessName(doc);
  const email = getSubmissionEmail(doc);

  if (canonicalName && email) return "approvable_submission";
  if (canonicalName) return "imported_pending_record";
  return "malformed_pending_record";
}

export function normalizeAdminApprovalRow(
  doc: any,
): NormalizedAdminApprovalRow {
  const canonicalName = getCanonicalBusinessName(doc);
  const ownerName = getSubmissionOwnerName(doc);
  const email = getSubmissionEmail(doc);
  const submittedAt = getSubmissionDate(doc);
  const derivedStatus = deriveAdminBusinessStatus(doc);
  const kind = inferRowKind(doc);
  const missingFields: string[] = [];

  if (!canonicalName) missingFields.push("businessName");
  if (!email) missingFields.push("email");
  if (!submittedAt) missingFields.push("submittedAt");

  const canApprove = kind === "approvable_submission";
  const canReject = kind !== "malformed_pending_record";

  return {
    _id: String(doc?._id || ""),
    businessName:
      canonicalName ||
      (kind === "malformed_pending_record"
        ? "Malformed pending record"
        : "Unnamed Business"),
    ownerName,
    email,
    submittedAt,
    status: derivedStatus,
    kind,
    canApprove,
    canReject,
    missingFields,
    sourceLabel:
      safeString(doc?.source) ||
      safeString(doc?.importSource) ||
      safeString(doc?.listingType) ||
      "businesses",
    listingType: safeString(doc?.listingType),
    slug: safeString(doc?.slug),
    alias: safeString(doc?.alias),
  };
}

export function getPendingApprovalQueueFilter(): Filter<any> {
  return getAdminBusinessBucketFilter("pending");
}

// Approval-queue eligibility (2026-09-08): the "pending" bucket above is
// deliberately broad (used by dashboard tile counts and other consumers --
// see getAdminBusinessCounts) and includes every business that hasn't been
// approved/rejected yet, regardless of whether it actually has enough data
// to approve. That's correct for a raw status bucket, but /admin/
// business-approvals was showing that entire bucket (~1,632 records, ~66
// pages at 25/page) as if it were an actionable queue -- only the ~15 that
// satisfy normalizeAdminApprovalRow's own canApprove check (the SAME check
// approve-business.ts already uses to gate the actual approve action)
// could actually be approved if clicked; the rest would 422.
//
// These three buckets refine "pending" using that same, already-canonical
// eligibility function -- no new approval criteria invented, just applying
// the one the approve endpoint already enforces at the listing stage
// instead of only at click-time. `duplicate_pending_review` records are
// folded into review_exception regardless of kind, since that status is
// itself an existing, established "needs human judgment" signal.
export type ApprovalQueueBucket =
  | "approval_ready"
  | "needs_requirements"
  | "review_exception";

export function deriveApprovalQueueBucket(doc: any): ApprovalQueueBucket {
  const status = String(doc?.status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (status === "duplicate_pending_review") return "review_exception";

  const { kind } = normalizeAdminApprovalRow(doc);
  if (kind === "approvable_submission") return "approval_ready";
  if (kind === "imported_pending_record") return "needs_requirements";
  return "review_exception";
}

/**
 * Human-readable reason(s) a record isn't approval-ready, derived only
 * from the existing canonical fields above -- not a new rule set.
 */
export function getApprovalIneligibilityReasons(doc: any): string[] {
  const status = String(doc?.status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (status === "duplicate_pending_review") {
    return ["Flagged as a possible duplicate of an existing listing"];
  }

  const normalized = normalizeAdminApprovalRow(doc);
  const reasons: string[] = [];
  if (normalized.missingFields.includes("businessName")) {
    reasons.push("Missing required business name");
  }
  if (normalized.missingFields.includes("email")) {
    reasons.push("Missing required contact/profile email");
  }
  if (
    normalized.kind === "malformed_pending_record" &&
    !normalized.missingFields.includes("businessName")
  ) {
    reasons.push("Business record is malformed and cannot be approved as-is");
  }
  return reasons;
}

/**
 * Base MongoDB filter for the approval-queue tabs: the existing "pending"
 * bucket plus the existing "duplicate_pending_review" status (which the
 * plain "pending" bucket filter excludes) -- everything that could
 * possibly land in one of the three ApprovalQueueBucket states. Bucket
 * classification itself still has to happen in memory (see
 * deriveApprovalQueueBucket) since it depends on multiple possible
 * name/email field names that aren't cleanly expressible as one indexed
 * Mongo condition -- this filter just keeps the initial fetch to the
 * relevant few thousand documents instead of the whole collection.
 */
export function getApprovalQueueBaseFilter(): Filter<any> {
  return {
    $or: [
      getAdminBusinessBucketFilter("pending"),
      {
        status: {
          $regex: "^duplicate[\\s_-]?pending[\\s_-]?review$",
          $options: "i",
        },
      },
    ],
  };
}

export async function resolveUniqueBusinessSlugAndAlias(args: {
  businesses: Collection<any>;
  existingId: ObjectId;
  canonicalName: string;
  existingSlug?: string | null;
  existingAlias?: string | null;
  ignoreExistingValues?: boolean;
}) {
  const {
    businesses,
    existingId,
    canonicalName,
    existingSlug,
    existingAlias,
    ignoreExistingValues = false,
  } = args;

  const trimmedCanonicalName = canonicalName.trim();
  if (!trimmedCanonicalName) {
    throw new AdminApprovalValidationError(
      "Business record is malformed: missing canonical business name",
      {
        kind: "missing_canonical_business_name",
      },
    );
  }

  const slugBase = slugifyBusinessName(trimmedCanonicalName);
  if (!slugBase) {
    throw new AdminApprovalValidationError(
      "Business record is malformed: invalid canonical business name for slug generation",
      {
        kind: "invalid_canonical_business_name",
        details: { canonicalName: trimmedCanonicalName },
      },
    );
  }

  const hasExistingSlug =
    !ignoreExistingValues &&
    typeof existingSlug === "string" &&
    existingSlug.trim().length > 0;
  const hasExistingAlias =
    !ignoreExistingValues &&
    typeof existingAlias === "string" &&
    existingAlias.trim().length > 0;

  const currentSlug = hasExistingSlug ? existingSlug!.trim() : slugBase;
  const currentAlias = hasExistingAlias ? existingAlias!.trim() : currentSlug;

  const conflictFilter = {
    _id: { $ne: existingId },
    $or: [{ slug: currentSlug }, { alias: currentAlias }],
  };

  const conflict = await businesses.findOne(conflictFilter, {
    projection: { _id: 1, approved: 1, status: 1, slug: 1, alias: 1 },
  });

  if (!conflict) {
    return { slug: currentSlug, alias: currentAlias, slugBase, conflict: null };
  }

  const existingWithSlug = await businesses.countDocuments({
    _id: { $ne: existingId },
    $or: [
      { slug: { $regex: `^${slugBase}(-\\d+)?$`, $options: "i" } },
      { alias: { $regex: `^${slugBase}(-\\d+)?$`, $options: "i" } },
    ],
  });

  const uniqueSlug = buildUniqueSlug(slugBase, existingWithSlug) || slugBase;
  return {
    slug: uniqueSlug,
    alias: uniqueSlug,
    slugBase,
    conflict: {
      _id: String(conflict._id),
      approved: conflict.approved ?? null,
      status: safeString(conflict.status),
      slug: safeString(conflict.slug),
      alias: safeString(conflict.alias),
    },
  };
}
