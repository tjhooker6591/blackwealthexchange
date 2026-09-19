// src/lib/acquisition/previews.ts
//
// Section 2 of the brief: personalized private preview. Saved separately
// from the live business profile -- this module never writes to the
// `businesses` collection. Access is an opaque, expiring, revocable token;
// internal/preview visits are tracked but explicitly excluded from any
// buyer/customer reporting (see reports.ts, which never reads this
// collection for owner-report metrics).

import { ObjectId, type Db } from "mongodb";
import crypto from "node:crypto";
import { COLLECTIONS, resolveCanonicalBusiness, s } from "./shared";
import type { AcquisitionPreview, PreviewField } from "./types";

function toStringId(id: unknown) {
  if (id instanceof ObjectId) return id.toString();
  return String(id);
}

const DEFAULT_TTL_DAYS = 14;

export type CreatePreviewInput = {
  prospectId: string;
  businessId: string;
  proposedFields: PreviewField[];
  missingFacts?: string[];
  ttlDays?: number;
  actorId: string;
};

export async function createPreview(
  db: Db,
  input: CreatePreviewInput,
): Promise<
  | { ok: true; preview: AcquisitionPreview }
  | { ok: false; code: string; message: string }
> {
  const canonical = await resolveCanonicalBusiness(db, input.businessId);
  if (!canonical) {
    return {
      ok: false,
      code: "BUSINESS_NOT_FOUND",
      message: "No canonical business matches this businessId.",
    };
  }

  // Preview text must be explicitly marked proposed vs. documented, and
  // owner verification is required before anything here reaches the live
  // profile -- this module has no publish path at all, by design.
  const fields = input.proposedFields.map((f) => ({
    field: s(f.field),
    value: s(f.value),
    isProposed: Boolean(f.isProposed),
  }));

  const now = new Date();
  const ttlDays =
    input.ttlDays && input.ttlDays > 0 ? input.ttlDays : DEFAULT_TTL_DAYS;
  const expiresAt = new Date(
    now.getTime() + ttlDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const doc: AcquisitionPreview = {
    prospectId: input.prospectId,
    businessId: canonical.businessId,
    proposedFields: fields,
    missingFacts: (input.missingFacts || []).map(s).filter(Boolean),
    accessToken: crypto.randomBytes(24).toString("base64url"),
    expiresAt,
    revoked: false,
    createdBy: input.actorId,
    createdAt: now.toISOString(),
    internalViewCount: 0,
  };

  const result = await db
    .collection(COLLECTIONS.previews)
    .insertOne(doc as any);
  return { ok: true, preview: { ...doc, _id: toStringId(result.insertedId) } };
}

export async function revokePreview(
  db: Db,
  previewId: string,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!ObjectId.isValid(previewId)) {
    return { ok: false, code: "INVALID_ID", message: "Invalid preview id." };
  }
  const result = await db
    .collection(COLLECTIONS.previews)
    .updateOne({ _id: new ObjectId(previewId) }, { $set: { revoked: true } });
  if (!result.matchedCount) {
    return { ok: false, code: "NOT_FOUND", message: "Preview not found." };
  }
  return { ok: true };
}

export type ResolvePreviewResult =
  | {
      ok: true;
      preview: {
        businessId: string;
        proposedFields: PreviewField[];
        missingFacts: string[];
        expiresAt: string;
      };
      current: { name: string; routeId: string | null } | null;
    }
  | { ok: false; code: "NOT_FOUND" | "EXPIRED" | "REVOKED" };

/**
 * Resolves a preview by its access token, for the public (no-auth)
 * preview page. Increments the internal view counter but returns nothing
 * that a caller could use to inflate customer-facing reporting -- there is
 * no businessId-level rollup of preview views exposed anywhere.
 */
export async function resolvePreviewByToken(
  db: Db,
  token: string,
): Promise<ResolvePreviewResult> {
  const doc = await db
    .collection(COLLECTIONS.previews)
    .findOne({ accessToken: s(token) });
  if (!doc) return { ok: false, code: "NOT_FOUND" };
  if ((doc as any).revoked) return { ok: false, code: "REVOKED" };
  if (new Date((doc as any).expiresAt).getTime() < Date.now()) {
    return { ok: false, code: "EXPIRED" };
  }

  await db
    .collection(COLLECTIONS.previews)
    .updateOne({ _id: (doc as any)._id }, { $inc: { internalViewCount: 1 } });

  const canonical = await resolveCanonicalBusiness(
    db,
    s((doc as any).businessId),
  );

  return {
    ok: true,
    preview: {
      businessId: s((doc as any).businessId),
      proposedFields: (doc as any).proposedFields || [],
      missingFacts: (doc as any).missingFacts || [],
      expiresAt: (doc as any).expiresAt,
    },
    current: canonical
      ? { name: canonical.name, routeId: canonical.routeId }
      : null,
  };
}

export async function listPreviewsForProspect(db: Db, prospectId: string) {
  const rows = await db
    .collection(COLLECTIONS.previews)
    .find({ prospectId })
    .sort({ createdAt: -1 })
    .toArray();
  return rows.map((r: any) => ({ ...r, _id: toStringId(r._id) }));
}
