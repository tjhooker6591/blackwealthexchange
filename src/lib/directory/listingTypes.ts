// src/lib/directory/listingTypes.ts
//
// One listing model: businesses and organizations (churches, nonprofits,
// ...) are all listings in the `businesses` collection; organizations carry
// listingType "organization" and a typeLabel ("Church", "Nonprofit", ...).
// Until scripts/unify-organizations-into-listings.mjs has run, organizations
// still live in the old `organizations` collection, so readers check which
// state the database is in.

import type { Db } from "mongodb";

export const ORGANIZATION_LISTING = { listingType: "organization" } as const;
export const NOT_ORGANIZATION_LISTING = {
  listingType: { $ne: "organization" },
} as const;

let unifiedCache: { at: number; value: boolean } | null = null;

export async function organizationsAreUnified(db: Db): Promise<boolean> {
  if (unifiedCache && Date.now() - unifiedCache.at < 60_000)
    return unifiedCache.value;
  const value = Boolean(
    await db
      .collection("businesses")
      .findOne(ORGANIZATION_LISTING, { projection: { _id: 1 } }),
  );
  unifiedCache = { at: Date.now(), value };
  return value;
}

export function isOrganizationListing(
  doc: Record<string, any> | null | undefined,
) {
  return (
    doc?.listingType === "organization" || doc?.entityType === "organization"
  );
}

export function listingTypeLabel(doc: Record<string, any> | null | undefined) {
  if (!isOrganizationListing(doc)) return "Business";
  const raw = String(doc?.typeLabel || doc?.orgType || "").trim();
  return raw
    ? raw.replace(/[_-]+/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase())
    : "Organization";
}
