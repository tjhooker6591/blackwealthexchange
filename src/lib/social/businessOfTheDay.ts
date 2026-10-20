// src/lib/social/businessOfTheDay.ts
//
// "Business of the Day" social feature. Everything a post says is built
// directly from the listing's own stored fields -- nothing is generated or
// inferred -- and nothing is published or emailed from here without an
// admin's explicit action in /admin/business-of-the-day.

import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { publicBusinessBaseQuery } from "@/lib/directory/publicBusinessQuery";
import { FOUNDING_MEMBERSHIP_PRICE_CENTS } from "@/lib/founding-membership";

export const SOCIAL_FEATURES_COLLECTION = "social_features";
const MIN_DESCRIPTION_LENGTH = 60;
const SUMMARY_MAX_LENGTH = 180;

export type FeatureListing = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  location: string;
  category: string;
  description: string;
  website: string;
  email: string;
  hasImage: boolean;
  claimed: boolean;
};

export type FeatureCard = {
  eyebrow: string;
  name: string;
  location: string;
  category: string;
  line: string;
  footer: string;
};

export type FeatureOwnerEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export function getSiteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    "https://www.blackwealthexchange.com";
  return raw.replace(/\/+$/, "");
}

// Imported listings sometimes carry a street address in `city` or a spelled
// out, upper-cased state. Anything that does not look like a place name is
// dropped rather than shown.
function cleanCity(value: unknown): string {
  const city = text(value);
  if (!city || /\d/.test(city) || city.length > 40) return "";
  return titleCase(city);
}

function cleanState(value: unknown): string {
  const state = text(value);
  if (!state || /\d/.test(state) || state.length > 30) return "";
  return state.length <= 3 ? state.toUpperCase() : titleCase(state);
}

function cleanCategory(value: unknown): string {
  const category = text(value).split(",")[0].replace(/[_-]+/g, " ").trim();
  if (!category || category.length > 40) return "";
  return titleCase(category);
}

export function toFeatureListing(doc: Record<string, any>): FeatureListing {
  const city = cleanCity(doc.city);
  const state = cleanState(doc.state);
  const claimStage = text(doc.claimStage).toLowerCase();
  return {
    id: String(doc._id),
    name: text(
      doc.business_name || doc.businessName || doc.title || doc.name || "",
    ),
    slug: text(doc.slug || doc.alias),
    city,
    state,
    location: [city, state].filter(Boolean).join(", "),
    category: cleanCategory(
      doc.display_categories || doc.category || doc.categories,
    ),
    description: text(doc.description).replace(/^["'\s]+|["'\s]+$/g, ""),
    website: text(doc.website),
    email: text(doc.email || doc.businessEmail).toLowerCase(),
    hasImage: Boolean(
      text(doc.image) || text(doc.logo) || text(doc.coverImage),
    ),
    claimed: ["ownership_verified", "verified"].includes(claimStage),
  };
}

// The first sentence(s) of the listing's own description, cut at a word
// boundary. Never rewritten.
export function summarizeDescription(
  description: string,
  maxLength = SUMMARY_MAX_LENGTH,
): string {
  const clean = text(description);
  if (clean.length <= maxLength) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [];
  let summary = "";
  for (const sentence of sentences) {
    if ((summary + sentence).trim().length > maxLength) break;
    summary += sentence;
  }
  if (summary.trim()) return summary.trim();
  const cut = clean.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "")}…`;
}

function hashtag(value: string): string {
  const tag = value.replace(/&/g, "And").replace(/[^A-Za-z0-9]/g, "");
  return tag ? `#${tag}` : "";
}

export function buildHashtags(listing: FeatureListing): string[] {
  return Array.from(
    new Set(
      [
        "#BWEBusinessOfTheDay",
        "#BlackWealthExchange",
        "#BuyBlack",
        hashtag(listing.city),
        hashtag(listing.category),
      ].filter(Boolean),
    ),
  );
}

export function getListingUrl(listing: FeatureListing): string {
  return `${getSiteBaseUrl()}/business/${listing.slug}`;
}

const OPENERS: Array<(name: string, where: string) => string> = [
  (name, where) => `Meet today's BWE Business of the Day: ${name}${where}.`,
  (name, where) => `Today's BWE Business of the Day is ${name}${where}.`,
  (name, where) =>
    `BWE Business of the Day: ${name}${where}. Have you heard of them?`,
];

export function buildCaption(listing: FeatureListing, variant = 0): string {
  const where = listing.location ? ` in ${listing.location}` : "";
  const opener = OPENERS[Math.abs(variant) % OPENERS.length](
    listing.name,
    where,
  );
  return [
    opener,
    summarizeDescription(listing.description),
    `Find them on Black Wealth Exchange: ${getListingUrl(listing)}`,
    buildHashtags(listing).join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildCard(listing: FeatureListing): FeatureCard {
  return {
    eyebrow: "BWE BUSINESS OF THE DAY",
    name: listing.name,
    location: listing.location,
    category: listing.category,
    line: summarizeDescription(listing.description, 120),
    footer: "Find them on blackwealthexchange.com",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildOwnerEmail(listing: FeatureListing): FeatureOwnerEmail {
  const listingUrl = getListingUrl(listing);
  const claimUrl = `${getSiteBaseUrl()}/founding-membership?businessId=${encodeURIComponent(listing.id)}`;
  const price = `$${(FOUNDING_MEMBERSHIP_PRICE_CENTS / 100).toFixed(0)}`;
  const paragraphs = [
    "Hello,",
    `We featured ${listing.name} as today's Business of the Day on Black Wealth Exchange.`,
    `Your listing: ${listingUrl}`,
    "Please feel free to share it with your customers.",
    listing.claimed
      ? ""
      : `If you haven't claimed your listing yet, you can do that here: ${claimUrl}\nClaiming is done through our founding membership (${price} per month). It confirms you as the verified owner and lets you manage the page yourself. There's no obligation, and your listing stays live either way.`,
    "If anything on the listing is wrong, reply to this email and we'll correct it.",
    "Thomas\nBlack Wealth Exchange",
  ].filter(Boolean);

  const html =
    '<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111; max-width: 640px;">' +
    paragraphs
      .map((paragraph) => {
        const body = escapeHtml(paragraph)
          .replace(
            /(https?:\/\/[^\s<]+)/g,
            (url) => `<a href="${url}">${url}</a>`,
          )
          .replace(/\n/g, "<br>");
        return `<p style="margin: 0 0 16px;">${body}</p>`;
      })
      .join("") +
    "</div>";

  return {
    to: listing.email,
    subject: `${listing.name} is today's BWE Business of the Day`,
    text: paragraphs.join("\n\n"),
    html,
  };
}

function toObjectIds(ids: string[]): ObjectId[] {
  return ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
}

export async function getDecidedBusinessIds(db: Db): Promise<string[]> {
  const rows = await db
    .collection(SOCIAL_FEATURES_COLLECTION)
    .find({}, { projection: { businessId: 1 } })
    .toArray();
  return rows.map((row) => String(row.businessId));
}

function candidateQuery(decidedIds: string[], city: string) {
  const and: Record<string, any>[] = [
    publicBusinessBaseQuery(),
    {
      description: {
        $type: "string",
        $regex: `\\S[\\s\\S]{${MIN_DESCRIPTION_LENGTH - 1},}`,
      },
    },
    { _id: { $nin: toObjectIds(decidedIds) } },
  ];
  if (city) {
    and.push({
      city: {
        $regex: city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      },
    });
  }
  return { $and: and };
}

export async function pickCandidate(
  db: Db,
  options: { city?: string } = {},
): Promise<{ listing: FeatureListing | null; remaining: number }> {
  const decidedIds = await getDecidedBusinessIds(db);
  const query = candidateQuery(decidedIds, text(options.city));
  const businesses = db.collection("businesses");
  const [doc, remaining] = await Promise.all([
    businesses
      .find(query)
      .sort({ completenessScore: -1, _id: 1 })
      .limit(1)
      .next(),
    businesses.countDocuments(query),
  ]);
  return { listing: doc ? toFeatureListing(doc) : null, remaining };
}

export async function findListingById(
  db: Db,
  businessId: string,
): Promise<FeatureListing | null> {
  if (!ObjectId.isValid(businessId)) return null;
  const doc = await db.collection("businesses").findOne({
    $and: [{ _id: new ObjectId(businessId) }, publicBusinessBaseQuery()],
  });
  return doc ? toFeatureListing(doc) : null;
}

export async function recordDecision(
  db: Db,
  args: {
    listing: FeatureListing;
    status: "approved" | "skipped";
    caption?: string;
    decidedBy: string;
  },
) {
  const now = new Date();
  await db.collection(SOCIAL_FEATURES_COLLECTION).updateOne(
    { businessId: args.listing.id },
    {
      $set: {
        businessId: args.listing.id,
        businessName: args.listing.name,
        slug: args.listing.slug,
        status: args.status,
        caption: args.status === "approved" ? args.caption || "" : "",
        decidedAt: now,
        decidedBy: args.decidedBy,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

export async function listRecentFeatures(db: Db, limit = 15) {
  const rows = await db
    .collection(SOCIAL_FEATURES_COLLECTION)
    .find({})
    .sort({ decidedAt: -1 })
    .limit(limit)
    .toArray();
  return rows.map((row) => ({
    businessId: String(row.businessId),
    businessName: String(row.businessName || ""),
    slug: String(row.slug || ""),
    status: String(row.status || ""),
    decidedAt: row.decidedAt || null,
    ownerEmailSentAt: row.ownerEmailSentAt || null,
    ownerEmailTo: row.ownerEmailTo || null,
    instagramPostedAt: row.instagramPostedAt || null,
    instagramPermalink: row.instagramPermalink || null,
    instagramLastError: row.instagramMediaId
      ? null
      : row.instagramLastError || null,
  }));
}

export type PublicFeature = {
  businessId: string;
  name: string;
  slug: string;
  location: string;
  category: string;
  line: string;
  featuredAt: string;
};

const CURRENT_FEATURE_MAX_AGE_DAYS = 7;

// The most recently approved feature, for the public homepage spot. Hidden
// once it is more than a week old so the site never shows a stale "of the
// day", and hidden if the listing is no longer publicly visible.
export async function getCurrentFeature(db: Db): Promise<PublicFeature | null> {
  const since = new Date(
    Date.now() - CURRENT_FEATURE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  );
  const row = await db
    .collection(SOCIAL_FEATURES_COLLECTION)
    .find({ status: "approved", decidedAt: { $gte: since } })
    .sort({ decidedAt: -1 })
    .limit(1)
    .next();
  if (!row) return null;
  const listing = await findListingById(db, String(row.businessId));
  if (!listing) return null;
  return {
    businessId: listing.id,
    name: listing.name,
    slug: listing.slug,
    location: listing.location,
    category: listing.category,
    line: summarizeDescription(listing.description),
    featuredAt: new Date(row.decidedAt).toISOString(),
  };
}

// When a given business was featured, for the badge on its listing page.
export async function getFeaturedDateForBusiness(
  db: Db,
  args: { businessId?: string; slug?: string },
): Promise<string | null> {
  const or: Record<string, string>[] = [];
  if (args.businessId) or.push({ businessId: args.businessId });
  if (args.slug) or.push({ slug: args.slug });
  if (!or.length) return null;
  const row = await db
    .collection(SOCIAL_FEATURES_COLLECTION)
    .findOne({ status: "approved", $or: or });
  return row?.decidedAt ? new Date(row.decidedAt).toISOString() : null;
}

// Local-only preview: the listing that would be proposed next, shaped like a
// live feature. Reads only -- nothing is recorded as featured.
export async function getPreviewFeature(
  db: Db,
  city = "",
): Promise<PublicFeature | null> {
  const { listing } = await pickCandidate(db, { city });
  if (!listing) return null;
  return {
    businessId: listing.id,
    name: listing.name,
    slug: listing.slug,
    location: listing.location,
    category: listing.category,
    line: summarizeDescription(listing.description),
    featuredAt: new Date().toISOString(),
  };
}

// Instagram fetches the card itself, so the address must be the public site
// even when the admin page is being used from localhost.
export function getPublicCardUrl(businessId: string): string {
  const base = getSiteBaseUrl();
  const origin = /localhost|127\.0\.0\.1/.test(base)
    ? "https://www.blackwealthexchange.com"
    : base;
  return `${origin}/api/social/card/${encodeURIComponent(businessId)}.jpg`;
}
