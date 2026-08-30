import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";
import { isPublicBusinessVisible } from "@/lib/directory/publicVisibility";

function s(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: unknown) {
  return s(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collapseNormalizedText(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "");
}

function toDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function singularizeNormalizedText(value: string) {
  if (!value || value.endsWith("ss")) return value;
  return value.endsWith("s") ? value.slice(0, -1) : value;
}

function buildSponsorLookupKeys(...values: unknown[]) {
  const keys = new Set<string>();

  for (const value of values) {
    const normalized = normalizeText(value);
    const collapsed = collapseNormalizedText(value);

    for (const candidate of [normalized, collapsed]) {
      if (!candidate) continue;
      keys.add(candidate);

      const singular = singularizeNormalizedText(candidate);
      if (singular && singular !== candidate) {
        keys.add(singular);
      }
    }
  }

  return Array.from(keys);
}

export type SponsorCampaignRecord = {
  campaignId: string;
  businessId: string;
  sponsorName: string;
  tagline?: string;
  imageUrl?: string;
  source: "featured_sponsor_schedule" | "advertising_requests";
  paidAt?: Date | null;
  weekStart?: Date | null;
  queueStatus?: string | null;
  inventoryTier?: number;
};

export type SponsorListingLink = {
  campaignId: string;
  businessId: string;
  sponsorName: string;
  businessName: string;
  alias: string;
  tagline: string;
  imageUrl: string;
  source: "featured_sponsor_schedule" | "advertising_requests";
  weekStart: Date | null;
  queueStatus: string | null;
  inventoryTier: number;
  searchAliases: string[];
  business: Record<string, any>;
};

export type SponsorLinkValidation =
  | {
      ok: true;
      businessId: string;
      alias: string;
      business: Record<string, any>;
    }
  | {
      ok: false;
      reason:
        | "missing_business_id"
        | "business_not_found"
        | "business_not_publicly_visible"
        | "business_missing_public_route";
    };

export function isSponsorScheduleRowFallbackEligible(
  row: Record<string, any> | null | undefined,
  now = new Date(),
) {
  const status = s(row?.status).toLowerCase();
  const weekEnd = toDate(row?.weekEnd);

  if (weekEnd) {
    return weekEnd >= now;
  }

  return status === "active";
}

export function buildSponsorPublicHref(aliasOrSlug: string) {
  const key = s(aliasOrSlug);
  return key ? `/business/${encodeURIComponent(key)}` : "";
}

export function buildSponsorSearchAliases(
  sponsorName: string,
  businessName: string,
  alias: string,
) {
  const variants = new Set<string>();
  for (const value of [sponsorName, businessName, alias]) {
    const trimmed = s(value);
    if (!trimmed) continue;
    variants.add(trimmed);
    const normalized = normalizeText(trimmed);
    if (normalized) variants.add(normalized);
    const collapsed = collapseNormalizedText(trimmed);
    if (collapsed) variants.add(collapsed);
  }
  return Array.from(variants);
}

export function matchesSponsorSearchAlias(
  search: string,
  aliases: string[],
): boolean {
  const query = normalizeText(search);
  if (!query) return false;

  return aliases.some((alias) => {
    const normalizedAlias = normalizeText(alias);
    const collapsedAlias = collapseNormalizedText(alias);
    if (!normalizedAlias) return false;
    const collapsedQuery = collapseNormalizedText(query);
    return (
      normalizedAlias === query ||
      normalizedAlias.includes(query) ||
      query.includes(normalizedAlias) ||
      Boolean(
        collapsedAlias &&
        collapsedQuery &&
        (collapsedAlias === collapsedQuery ||
          collapsedAlias.includes(collapsedQuery) ||
          collapsedQuery.includes(collapsedAlias)),
      )
    );
  });
}

export function applySponsorSearchMetadata<T extends Record<string, any>>(
  item: T,
  sponsorLink?: SponsorListingLink | null,
) {
  const existingAliases = Array.isArray(item?.__sponsorAliases)
    ? item.__sponsorAliases
    : [];

  return {
    ...item,
    isSponsored: item?.isSponsored === true || Boolean(sponsorLink),
    __sponsorAliases: sponsorLink?.searchAliases || existingAliases,
    __sponsorCampaignId:
      sponsorLink?.campaignId || item?.__sponsorCampaignId || undefined,
  };
}

export function findSponsorLinkForBusiness(
  item: Record<string, any> | null | undefined,
  sponsorLinks: SponsorListingLink[],
) {
  if (!item) return null;

  const businessId = s(item?._id || item?.businessId);
  const alias = s(item?.alias || item?.slug);
  const businessName = s(item?.business_name || item?.name);

  return (
    sponsorLinks.find((link) => {
      if (businessId && link.businessId === businessId) return true;
      if (alias && link.alias === alias) return true;
      return Boolean(
        businessName &&
        matchesSponsorSearchAlias(businessName, link.searchAliases),
      );
    }) || null
  );
}

function chooseBetterCampaign(
  current: SponsorListingLink | undefined,
  candidate: SponsorListingLink,
) {
  if (!current) return candidate;
  if (candidate.inventoryTier !== current.inventoryTier) {
    return candidate.inventoryTier < current.inventoryTier
      ? candidate
      : current;
  }

  const currentWeek = current.weekStart?.getTime() || 0;
  const candidateWeek = candidate.weekStart?.getTime() || 0;
  if (candidateWeek !== currentWeek) {
    return candidateWeek > currentWeek ? candidate : current;
  }

  return candidate.campaignId > current.campaignId ? candidate : current;
}

export function resolveSponsorBusinessLinks(
  campaigns: SponsorCampaignRecord[],
  businesses: Array<Record<string, any>>,
) {
  const businessesById = new Map(
    businesses.map((business) => [String(business?._id || ""), business]),
  );
  const businessesByLookupKey = new Map<string, Record<string, any> | null>();
  for (const business of businesses) {
    if (!isPublicBusinessVisible(business)) continue;

    const alias = s((business as any).alias || (business as any).slug);
    if (!alias) continue;

    const profile = mapDirectoryProfileFromDoc(business);
    const businessName = s(
      profile.displayName ||
        (business as any).business_name ||
        (business as any).name,
    );

    for (const key of buildSponsorLookupKeys(alias, businessName)) {
      const hasCurrent = businessesByLookupKey.has(key);
      const current = businessesByLookupKey.get(key);
      if (!hasCurrent) {
        businessesByLookupKey.set(key, business);
        continue;
      }

      if (
        current &&
        String(current._id || "") !== String((business as any)._id || "")
      ) {
        businessesByLookupKey.set(key, null);
      }
    }
  }
  const resolvedByBusinessId = new Map<string, SponsorListingLink>();

  for (const campaign of campaigns) {
    const businessId = s(campaign.businessId);
    let business = businessId ? businessesById.get(businessId) : null;

    if (!business) {
      for (const key of buildSponsorLookupKeys(campaign.sponsorName)) {
        const candidate = businessesByLookupKey.get(key);
        if (!candidate) continue;
        business = candidate;
        break;
      }
    }

    if (!business) continue;
    if (!isPublicBusinessVisible(business)) continue;

    const alias = s((business as any).alias || (business as any).slug);
    if (!alias) continue;

    const profile = mapDirectoryProfileFromDoc(business);
    const businessName = s(
      profile.displayName || (business as any).business_name,
    );
    const sponsorName = s(campaign.sponsorName) || businessName;
    const resolvedBusinessId = String((business as any)._id || businessId);
    const candidate: SponsorListingLink = {
      campaignId: s(campaign.campaignId),
      businessId: resolvedBusinessId,
      sponsorName,
      businessName,
      alias,
      tagline: s(campaign.tagline) || "Featured on Black Wealth Exchange",
      imageUrl: s(campaign.imageUrl),
      source: campaign.source,
      weekStart: campaign.weekStart || null,
      queueStatus: s(campaign.queueStatus) || null,
      inventoryTier: Number(campaign.inventoryTier || 2),
      searchAliases: buildSponsorSearchAliases(
        sponsorName,
        businessName,
        alias,
      ),
      business,
    };

    resolvedByBusinessId.set(
      resolvedBusinessId,
      chooseBetterCampaign(
        resolvedByBusinessId.get(resolvedBusinessId),
        candidate,
      ),
    );
  }

  return Array.from(resolvedByBusinessId.values());
}

export function buildSponsorBusinessIdFilter(value: string) {
  const raw = s(value);
  if (!raw) return null;
  if (ObjectId.isValid(raw)) {
    return { $or: [{ _id: new ObjectId(raw) }, { _id: raw as any }] };
  }
  return { _id: raw as any };
}

export async function findSponsorBusinessesByIds(
  db: Db,
  businessIds: string[],
  projection?: Record<string, number>,
) {
  const uniqueIds = Array.from(
    new Set(businessIds.map((businessId) => s(businessId)).filter(Boolean)),
  );

  const businesses = await Promise.all(
    uniqueIds.map((businessId) => {
      const filter = buildSponsorBusinessIdFilter(businessId);
      if (!filter) return null;
      return db
        .collection("businesses")
        .findOne(filter, projection ? { projection } : undefined);
    }),
  );

  return businesses.filter(Boolean) as Record<string, any>[];
}

export async function validateSponsorBusinessLink(
  db: Db,
  businessId: string,
): Promise<SponsorLinkValidation> {
  const normalizedBusinessId = s(businessId);
  if (!normalizedBusinessId) {
    return { ok: false, reason: "missing_business_id" };
  }

  const filter = buildSponsorBusinessIdFilter(normalizedBusinessId);
  const business = filter
    ? await db.collection("businesses").findOne(filter)
    : null;

  if (!business) {
    return { ok: false, reason: "business_not_found" };
  }

  const alias = s((business as any).alias || (business as any).slug);
  if (!alias) {
    return { ok: false, reason: "business_missing_public_route" };
  }

  if (!isPublicBusinessVisible(business)) {
    return { ok: false, reason: "business_not_publicly_visible" };
  }

  return {
    ok: true,
    businessId: String((business as any)._id || normalizedBusinessId),
    alias,
    business,
  };
}
