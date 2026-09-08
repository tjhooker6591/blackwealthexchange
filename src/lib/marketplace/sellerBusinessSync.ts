import type { Db } from "mongodb";
import {
  buildUniqueSlug,
  getCanonicalBusinessName,
  slugifyBusinessName,
} from "@/lib/businessSubmission";

type SellerBusinessSyncInput = {
  email: string;
  businessName: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  ownerName?: string;
  source: "seller_create_existing_user" | "seller_create_signup";
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isBlank(value: unknown): boolean {
  return normalizeText(value).length === 0;
}

async function buildAvailableSlug(
  db: Db,
  preferredName: string,
  existingDoc?: Record<string, unknown> | null,
) {
  const existingSlug = normalizeText(existingDoc?.slug);
  const existingAlias = normalizeText(existingDoc?.alias);
  if (existingSlug || existingAlias) {
    return {
      slug: existingSlug || existingAlias,
      alias: existingAlias || existingSlug,
    };
  }

  const slugBase = slugifyBusinessName(preferredName);
  if (!slugBase) return { slug: "", alias: "" };

  const collisionCount = await db.collection("businesses").countDocuments({
    $or: [{ slug: { $regex: `^${slugBase}(-\\d+)?$`, $options: "i" } }],
  });
  const slug = buildUniqueSlug(slugBase, collisionCount) || slugBase;
  return { slug, alias: slug };
}

export async function syncSellerToBusinessListing(
  db: Db,
  input: SellerBusinessSyncInput,
) {
  const email = normalizeText(input.email).toLowerCase();
  const businessName = normalizeText(input.businessName);
  const description = normalizeText(input.description);
  const website = normalizeText(input.website);
  const phone = normalizeText(input.phone);
  const address = normalizeText(input.address);
  const ownerName = normalizeText(input.ownerName);

  if (!email || !businessName) {
    return { action: "skipped_missing_identity" as const };
  }

  const businesses = db.collection("businesses");
  const existing = await businesses.findOne({
    $or: [{ email }, { businessEmail: email }],
  });

  const now = new Date();

  if (existing) {
    const canonicalName = getCanonicalBusinessName(existing) || businessName;
    const slugState = await buildAvailableSlug(db, canonicalName, existing);
    const set: Record<string, unknown> = { updatedAt: now };

    if (isBlank(existing.business_name)) set.business_name = canonicalName;
    if (isBlank(existing.businessName)) set.businessName = canonicalName;
    if (isBlank(existing.title)) set.title = canonicalName;
    if (isBlank(existing.alias) && slugState.alias) set.alias = slugState.alias;
    if (isBlank(existing.slug) && slugState.slug) set.slug = slugState.slug;
    if (isBlank(existing.description) && description)
      set.description = description;
    if (isBlank(existing.website) && website) set.website = website;
    if (isBlank(existing.phone) && phone) set.phone = phone;
    if (isBlank(existing.businessPhone) && phone) set.businessPhone = phone;
    if (isBlank(existing.address) && address) set.address = address;
    if (isBlank(existing.businessAddress) && address) {
      set.businessAddress = address;
    }
    if (isBlank(existing.email)) set.email = email;
    if (isBlank(existing.businessEmail)) set.businessEmail = email;
    if (isBlank(existing.ownerName) && ownerName) set.ownerName = ownerName;
    if (isBlank(existing.accountType)) set.accountType = "business";
    if (isBlank(existing.listingType)) set.listingType = "local";

    const setKeys = Object.keys(set);
    if (setKeys.length === 1 && set.updatedAt) {
      return {
        action: "matched_no_change" as const,
        businessId: String(existing._id),
      };
    }

    await businesses.updateOne({ _id: existing._id }, { $set: set });
    return {
      action: "updated_existing" as const,
      businessId: String(existing._id),
      fieldsUpdated: setKeys.filter((key) => key !== "updatedAt"),
    };
  }

  const slugState = await buildAvailableSlug(db, businessName, null);
  const doc: Record<string, unknown> = {
    email,
    businessEmail: email,
    accountType: "business",
    business_name: businessName,
    businessName,
    title: businessName,
    description,
    website,
    phone,
    businessPhone: phone,
    address,
    businessAddress: address,
    ownerName,
    slug: slugState.slug,
    alias: slugState.alias,
    status: "active",
    approved: false,
    listingType: "local",
    completenessVersion: 2,
    completenessScore: 0,
    isComplete: false,
    dataComplete: false,
    createdAt: now,
    updatedAt: now,
    syncSource: input.source,
  };

  const result = await businesses.insertOne(doc);
  return {
    action: "created_business_shell" as const,
    businessId: String(result.insertedId),
  };
}
