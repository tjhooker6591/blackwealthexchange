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
    canApprove: kind === "approvable_submission",
    canReject: true,
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
