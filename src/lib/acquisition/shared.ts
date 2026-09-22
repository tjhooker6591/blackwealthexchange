// src/lib/acquisition/shared.ts
//
// Small shared helpers for the acquisition module -- collection name
// constants (so every file references the same literal) and a canonical
// business summary lookup using the exact same field-priority convention
// already established in src/lib/search/universalSearch.ts and
// src/lib/business360.ts, so a business resolved here always matches how
// it is resolved everywhere else in the app.

import { ObjectId, type Db } from "mongodb";
import crypto from "node:crypto";

export const COLLECTIONS = {
  prospects: "acquisition_prospects",
  activities: "acquisition_prospect_activities",
  previews: "acquisition_previews",
  onboarding: "acquisition_onboarding",
  campaigns: "acquisition_campaigns",
  events: "acquisition_events",
  offPlatformSales: "acquisition_off_platform_sales",
  reportSnapshots: "acquisition_report_snapshots",
  stories: "acquisition_stories",
} as const;

export function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function toId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof ObjectId) return value.toString();
  return "";
}

export function newId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export type CanonicalBusinessSummary = {
  businessId: string;
  name: string;
  routeId: string | null; // alias/slug for /business/<routeId>
  status: string | null;
};

export async function resolveCanonicalBusiness(
  db: Db,
  businessId: string,
): Promise<CanonicalBusinessSummary | null> {
  const id = s(businessId);
  if (!id || !ObjectId.isValid(id)) return null;

  const doc = await db.collection("businesses").findOne(
    { _id: new ObjectId(id) },
    {
      projection: {
        business_name: 1,
        businessName: 1,
        name: 1,
        alias: 1,
        slug: 1,
        status: 1,
      },
    },
  );
  if (!doc) return null;

  return {
    businessId: id,
    name:
      s((doc as any).business_name) ||
      s((doc as any).businessName) ||
      s((doc as any).name) ||
      "Business",
    routeId: s((doc as any).alias) || s((doc as any).slug) || null,
    status: s((doc as any).status) || null,
  };
}

/** Ensure the collections this module owns have the indexes their access
 * patterns need. Additive/idempotent -- safe to call on every request
 * (createIndexes is a no-op when the index already exists), matching the
 * pattern already used by scripts/audit-batch*-indexes.mjs. */
export async function ensureAcquisitionIndexes(db: Db) {
  await Promise.all([
    db
      .collection(COLLECTIONS.prospects)
      .createIndex({ businessId: 1 }, { sparse: true }),
    db.collection(COLLECTIONS.prospects).createIndex({ stage: 1 }),
    db.collection(COLLECTIONS.prospects).createIndex({ lastActivityAt: -1 }),
    db.collection(COLLECTIONS.activities).createIndex({ prospectId: 1 }),
    db
      .collection(COLLECTIONS.previews)
      .createIndex({ accessToken: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.onboarding)
      .createIndex({ prospectId: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.campaigns)
      .createIndex({ campaignId: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.events)
      .createIndex({ dedupeKey: 1 }, { unique: true }),
    db
      .collection(COLLECTIONS.events)
      .createIndex({ businessId: 1, eventTime: -1 }),
    db.collection(COLLECTIONS.offPlatformSales).createIndex({ businessId: 1 }),
    db.collection(COLLECTIONS.stories).createIndex({ businessId: 1 }),
  ]);
}
