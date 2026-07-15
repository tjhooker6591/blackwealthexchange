import { performance } from "node:perf_hooks";
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import {
  normalizeFoundingClaimStage,
  resolveFoundingOwnershipState,
} from "@/lib/founding-membership-state";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { getAdminDecodedFromRequest, isAdminDecoded } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";
import { computeListingCompleteness } from "@/lib/directory/completeness";
import { publicBusinessBaseQuery } from "@/lib/directory/publicBusinessQuery";
import { isPublicBusinessVisible } from "@/lib/directory/publicVisibility";

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function makeRequestId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : "";
}

function normalizeSearchTokens(search: string) {
  const stopwords = new Set([
    "owned",
    "owner",
    "business",
    "businesses",
    "company",
    "companies",
    "near",
    "me",
    "help",
    "find",
  ]);

  const phraseTokens = [
    "los angeles",
    "new york",
    "san francisco",
    "washington dc",
  ];

  let normalized = search.toLowerCase().trim().replace(/[-_]+/g, " ");
  for (const phrase of phraseTokens) {
    const phraseRx = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi");
    normalized = normalized.replace(phraseRx, phrase.replace(/\s+/g, "_"));
  }

  return normalized
    .split(/\s+/)
    .map((t) => t.trim().replace(/_/g, " "))
    .filter(Boolean)
    .filter((t) => !stopwords.has(t))
    .slice(0, 8);
}

const CITY_STATE_ALIASES: Record<string, string> = {
  atlanta: "GA",
  houston: "TX",
  chicago: "IL",
  dallas: "TX",
  miami: "FL",
  "los angeles": "CA",
  "new york": "NY",
  "san francisco": "CA",
  "washington dc": "DC",
};

function tokenPatterns(token: string): string[] {
  const normalized = token.toLowerCase().trim();
  if (!normalized) return [];

  if (normalized in CITY_STATE_ALIASES) {
    return [normalized, CITY_STATE_ALIASES[normalized].toLowerCase()];
  }

  if (normalized === "dentist") return ["dentist", "dental", "dentistry"];
  if (normalized === "restaurant") {
    return ["restaurant", "restaurants", "cafe", "eatery"];
  }
  if (normalized === "nonprofit") {
    return ["nonprofit", "non-profit", "non profit", "charity", "foundation"];
  }

  return [normalized];
}

function isLocationToken(token: string) {
  const t = token.toLowerCase().trim();
  if (!t) return false;
  if (t in CITY_STATE_ALIASES) return true;
  return /^[a-z]{2}$/.test(t);
}

function scoreTokenMatch(text: string, token: string) {
  if (!text || !token) return 0;
  if (text === token) return 35;
  if (text.startsWith(token)) return 18;
  if (text.includes(token)) return 10;
  return 0;
}

function buildLocationTokenConditions(token: string, fields: string[]) {
  const t = token.toLowerCase().trim();
  if (!t) return [];

  if (t in CITY_STATE_ALIASES) {
    const cityRx = new RegExp(escapeRegex(t), "i");
    const stateCode = CITY_STATE_ALIASES[t].toUpperCase();
    const conditions: any[] = [];

    if (fields.includes("city")) conditions.push({ city: cityRx });
    if (fields.includes("address")) conditions.push({ address: cityRx });
    if (fields.includes("country")) conditions.push({ country: cityRx });
    if (fields.includes("state")) conditions.push({ state: stateCode });

    return conditions;
  }

  if (/^[a-z]{2}$/.test(t)) {
    return fields.includes("state") ? [{ state: t.toUpperCase() }] : [];
  }

  const rx = new RegExp(escapeRegex(t), "i");
  return fields.map((field) => ({ [field]: rx }));
}

function buildTokenSearchClause(tokens: string[], fields: string[]) {
  if (!tokens.length) return null;
  const locationFields = ["city", "state", "address", "country"];
  return {
    $and: tokens.map((token) => {
      if (isLocationToken(token)) {
        const locationConditions = buildLocationTokenConditions(
          token,
          locationFields,
        );
        return { $or: locationConditions };
      }

      const regexes = tokenPatterns(token).map(
        (p) => new RegExp(escapeRegex(p), "i"),
      );
      return {
        $or: regexes.flatMap((rx) => fields.map((field) => ({ [field]: rx }))),
      };
    }),
  };
}

function buildTokenAnyClause(tokens: string[], fields: string[]) {
  if (!tokens.length) return null;
  return {
    $or: tokens.map((token) => {
      const regexes = tokenPatterns(token).map(
        (p) => new RegExp(escapeRegex(p), "i"),
      );
      return {
        $or: regexes.flatMap((rx) => fields.map((field) => ({ [field]: rx }))),
      };
    }),
  };
}

function buildLocationClause(tokens: string[]) {
  if (!tokens.length) return null;
  const locationFields = ["city", "state", "address", "country"];
  const conditions = tokens.flatMap((token) =>
    buildLocationTokenConditions(token, locationFields),
  );

  return conditions.length ? { $or: conditions } : null;
}

function relevanceScoreBusiness(item: any, search: string) {
  const q = search.toLowerCase().trim();
  if (!q) return 0;

  const tokens = normalizeSearchTokens(q);

  const name = safeText(item?.business_name).toLowerCase();
  const alias = safeText(item?.alias).toLowerCase();
  const category =
    `${safeText(item?.category)} ${safeText(item?.categories)} ${safeText(item?.display_categories)}`.toLowerCase();
  const description = safeText(item?.description).toLowerCase();
  const location =
    `${safeText(item?.city)} ${safeText(item?.state)} ${safeText(item?.address)}`.toLowerCase();

  let score = 0;
  if (name === q) score += 120;
  if (name.startsWith(q)) score += 70;
  if (name.includes(q)) score += 40;

  for (const token of tokens) {
    const tokenWeight = token === "black" ? 0.35 : 1;
    score += scoreTokenMatch(name, token) * 2 * tokenWeight;
    score += scoreTokenMatch(alias, token) * tokenWeight;
    score += scoreTokenMatch(category, token) * 1.4 * tokenWeight;
    score += scoreTokenMatch(description, token) * 0.8 * tokenWeight;
    score += scoreTokenMatch(location, token) * 0.8 * tokenWeight;
  }

  if (item?.isVerified === true || item?.verified === true) score += 10;
  if (Number(item?.amountPaid || 0) > 0) score += 4;

  return score;
}

function textHasPattern(text: string, token: string) {
  if (!text || !token) return false;
  return tokenPatterns(token).some((pattern) =>
    new RegExp(escapeRegex(pattern), "i").test(text),
  );
}

function getMatchQuality(
  item: any,
  intentTokens: string[],
  locationTokens: string[],
) {
  if (intentTokens.length === 0 && locationTokens.length === 0) {
    return "close";
  }
  const name = safeText(item?.business_name || item?.name).toLowerCase();
  const alias = safeText(item?.alias).toLowerCase();
  const category =
    `${safeText(item?.category)} ${safeText(item?.categories)} ${safeText(item?.display_categories)} ${safeText(item?.orgType)} ${safeText(item?.denomination)}`.toLowerCase();
  const description = safeText(item?.description).toLowerCase();
  const location =
    `${safeText(item?.city)} ${safeText(item?.state)} ${safeText(item?.address)} ${safeText(item?.country)}`.toLowerCase();

  const intentHits = intentTokens.filter((token) =>
    [name, alias, category, description].some((text) =>
      textHasPattern(text, token),
    ),
  ).length;
  const locationHits = locationTokens.filter((token) =>
    textHasPattern(location, token),
  ).length;

  const intentCoverage = intentTokens.length
    ? intentHits / intentTokens.length
    : 0;
  const locationCoverage = locationTokens.length
    ? locationHits / locationTokens.length
    : 0;

  const exactIntent = intentTokens.length > 0 && intentCoverage === 1;
  const exactLocation = locationTokens.length === 0 || locationCoverage === 1;

  if (exactIntent && exactLocation) return "exact";
  if (exactIntent || (intentCoverage >= 0.5 && locationCoverage >= 0.5)) {
    return "close";
  }
  return "approximate";
}

function matchQualityRank(quality: string) {
  if (quality === "exact") return 3;
  if (quality === "close") return 2;
  return 1;
}

function listingStrength(item: any) {
  const completeness = computeListingCompleteness(item).completenessScore;
  const hasDescription = safeText(item?.description).trim().length >= 30;
  const hasLocation =
    Boolean(safeText(item?.city).trim()) ||
    Boolean(safeText(item?.state).trim()) ||
    Boolean(safeText(item?.address).trim());
  const hasCategory =
    Boolean(safeText(item?.category).trim()) ||
    Boolean(safeText(item?.categories).trim()) ||
    Boolean(safeText(item?.display_categories).trim()) ||
    Boolean(safeText(item?.orgType).trim());
  const hasContact =
    Boolean(safeText(item?.website).trim()) ||
    Boolean(safeText(item?.phone).trim());

  let strength = completeness;
  if (hasDescription) strength += 8;
  if (hasLocation) strength += 10;
  if (hasCategory) strength += 10;
  if (hasContact) strength += 6;

  return Math.max(0, Math.min(140, strength));
}

function normalizeResultItem(item: any, isOrganizations: boolean) {
  const title = isOrganizations
    ? safeText(item?.name || item?.business_name)
    : safeText(item?.business_name || item?.name);
  const primaryCategory = isOrganizations
    ? safeText(item?.orgType || item?.denomination || item?.category)
    : safeText(item?.display_categories || item?.category || item?.categories);
  const city = safeText(item?.city);
  const state = safeText(item?.state).toUpperCase();
  const address = safeText(item?.address);
  const locationDisplay = [city, state].filter(Boolean).join(", ") || address;
  const listingStatus = safeText(
    item?.status || item?.trustStatus,
  ).toLowerCase();
  const slug = safeText(item?.alias) || safeText(item?._id);
  const ownershipState = isOrganizations
    ? { isOwnershipVerified: false, canonicalState: null }
    : resolveFoundingOwnershipState({
        business: item,
        publicListingStatus: item?.publicListingStatus,
        claimStage: item?.claimStage,
        ownershipReviewStatus: item?.ownershipReviewStatus,
      });
  const normalizedClaimStage = isOrganizations
    ? null
    : ownershipState.canonicalState ||
      normalizeFoundingClaimStage(item?.claimStage) ||
      normalizeFoundingClaimStage(item?.publicListingStatus) ||
      (listingStatus === "verified" ? "ownership_verified" : "unclaimed");

  const isVerified =
    item?.isVerified === true ||
    item?.verified === true ||
    listingStatus === "verified" ||
    ownershipState.isOwnershipVerified;

  const isSponsored =
    item?.isSponsored === true || Number(item?.amountPaid || 0) > 0;

  const isComplete = isPublicBusinessVisible(item);

  return {
    ...item,
    kind: isOrganizations ? "organization" : "business",
    title,
    primaryCategory,
    locationDisplay,
    listingStatus,
    isVerified,
    isSponsored,
    isComplete,
    slug,
    claimStage: normalizedClaimStage,
    publicListingStatus: isOrganizations
      ? null
      : normalizeFoundingClaimStage(item?.publicListingStatus),
    ownershipReviewStatus: isOrganizations
      ? null
      : normalizeFoundingClaimStage(item?.ownershipReviewStatus),
  };
}

type SearchCacheEntry = { at: number; payload: string };
const SEARCH_CACHE_TTL_MS = 60_000;
const SESSION_CAP_TTL_MS = 1000 * 60 * 60 * 6;

type SponsoredPlacement = {
  _id: string;
  name: string;
  business_name: string;
  description: string;
  category: string;
  primaryCategory: string;
  locationDisplay: string;
  city?: string;
  state?: string;
  address?: string;
  alias: string;
  website?: string;
  isSponsored: true;
  __sponsoredPlacement: true;
  __kind: "business";
  __sponsorCampaignId: string;
  _matchQuality: "exact" | "close";
};

function buildQueryFamilyKey(intentTokens: string[], locationTokens: string[]) {
  const i = [...intentTokens].sort().join("+") || "all-intent";
  const l = [...locationTokens].sort().join("+") || "all-locations";
  return `${i}::${l}`;
}

function insertionBudgetForCount(count: number) {
  if (count <= 7) return 0;
  if (count <= 19) return 1;
  if (count <= 39) return 2;
  return 3;
}

function densityCapForCount(count: number) {
  return Math.floor(count * 0.15);
}

function relevanceScoreOrg(item: any, search: string) {
  const q = search.toLowerCase().trim();
  if (!q) return 0;

  const tokens = normalizeSearchTokens(q);

  const name = safeText(item?.name).toLowerCase();
  const alias = safeText(item?.alias).toLowerCase();
  const orgType = safeText(item?.orgType).toLowerCase();
  const denomination = safeText(item?.denomination).toLowerCase();
  const description = safeText(item?.description).toLowerCase();
  const location =
    `${safeText(item?.city)} ${safeText(item?.state)} ${safeText(item?.address)}`.toLowerCase();

  let score = 0;
  if (name === q) score += 120;
  if (name.startsWith(q)) score += 70;
  if (name.includes(q)) score += 40;

  for (const token of tokens) {
    const tokenWeight = token === "black" ? 0.35 : 1;
    score += scoreTokenMatch(name, token) * 2 * tokenWeight;
    score += scoreTokenMatch(alias, token) * tokenWeight;
    score += scoreTokenMatch(orgType, token) * 1.5 * tokenWeight;
    score += scoreTokenMatch(denomination, token) * tokenWeight;
    score += scoreTokenMatch(description, token) * 0.8 * tokenWeight;
    score += scoreTokenMatch(location, token) * 0.8 * tokenWeight;
  }

  if (item?.isVerified === true || item?.verified === true) score += 8;
  return score;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const requestId = makeRequestId();
  const t0 = Date.now();
  const t0Perf = performance.now();
  const cacheKey = JSON.stringify(req.query || {});
  const cache =
    ((globalThis as any).__bweSearchBusinessesCache as
      | Map<string, SearchCacheEntry>
      | undefined) || new Map<string, SearchCacheEntry>();
  (globalThis as any).__bweSearchBusinessesCache = cache;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < SEARCH_CACHE_TTL_MS) {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    res.setHeader("X-Search-Cache", "HIT");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(cached.payload);
  }

  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({
        status: "error",
        requestId,
        error: { code: "METHOD_NOT_ALLOWED", message: "Use GET" },
      });
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=10, stale-while-revalidate=30",
    );

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const searchRate = await hitApiRateLimit(
      db,
      `search:businesses:ip:${ip}`,
      120,
      5,
    );
    if (searchRate.blocked) {
      res.setHeader("Retry-After", String(searchRate.retryAfterSeconds));
      return res.status(429).json({
        status: "error",
        requestId,
        error: {
          code: "RATE_LIMITED",
          message: "Too many search requests. Please try again shortly.",
        },
      });
    }

    const typeRaw =
      typeof req.query.type === "string"
        ? req.query.type
        : typeof req.query.scope === "string"
          ? req.query.scope
          : "businesses";
    const normalizedType = String(typeRaw).toLowerCase();
    const isOrganizations =
      normalizedType === "organization" ||
      normalizedType === "organizations" ||
      normalizedType === "org" ||
      normalizedType === "orgs";

    const col = db.collection(isOrganizations ? "organizations" : "businesses");
    const exposureCol = db.collection("sponsor_search_exposure");
    const sessionCapCol = db.collection("sponsor_search_session_caps");

    const searchRaw =
      typeof req.query.search === "string"
        ? req.query.search
        : typeof req.query.q === "string"
          ? req.query.q
          : "";
    const categoryRaw =
      typeof req.query.category === "string" ? req.query.category : "";
    const stateRaw = typeof req.query.state === "string" ? req.query.state : "";
    const sortRaw =
      typeof req.query.sort === "string" ? req.query.sort : "relevance";
    const verifiedOnly = req.query.verifiedOnly === "1";
    const sponsoredFirst = req.query.sponsoredFirst === "1";
    const includeIncomplete = req.query.includeIncomplete === "1";

    const page = clampInt(req.query.page, 1, 9999, 1);
    const limit = clampInt(req.query.limit, 1, 50, 20);

    const search = searchRaw.trim().slice(0, 120);
    const category = categoryRaw.trim().slice(0, 60);
    const state = stateRaw.trim().toUpperCase().slice(0, 2);
    const sort = ["relevance", "newest", "completeness"].includes(sortRaw)
      ? sortRaw
      : "relevance";

    const includeAllStatusesRequested = req.query.includeAllStatuses === "1";
    let includeAllStatuses = false;
    if (includeAllStatusesRequested) {
      const decoded = getAdminDecodedFromRequest(req);
      if (!decoded || !isAdminDecoded(decoded)) {
        return res.status(403).json({
          status: "error",
          requestId,
          error: {
            code: "FORBIDDEN",
            message: "includeAllStatuses is restricted to admin sessions",
          },
        });
      }
      includeAllStatuses = true;
    }

    const and: any[] = [];
    const searchFields = isOrganizations
      ? [
          "name",
          "alias",
          "description",
          "orgType",
          "denomination",
          "address",
          "city",
          "state",
        ]
      : [
          "business_name",
          "alias",
          "description",
          "categories",
          "display_categories",
          "category",
          "address",
          "city",
          "state",
          "country",
        ];

    if (!includeAllStatuses) {
      if (isOrganizations) {
        and.push({
          $or: [
            { status: "approved" },
            { status: "verified" },
            { status: "active" },
            { status: { $exists: false } },
            { status: "" },
            { status: null },
          ],
        });
      } else {
        and.push(publicBusinessBaseQuery());
      }
    }

    const searchTokens = search ? normalizeSearchTokens(search) : [];
    const strictTokens = searchTokens.filter((t) => t !== "black");
    const locationTokens = strictTokens.filter((t) => isLocationToken(t));
    const intentTokens = strictTokens.filter((t) => !isLocationToken(t));

    let searchTokenClause: any = null;
    if (search && strictTokens.length) {
      searchTokenClause = buildTokenSearchClause(strictTokens, searchFields);
      if (searchTokenClause) and.push(searchTokenClause);
    }

    if (!isOrganizations && category && category !== "All") {
      const rx = new RegExp(escapeRegex(category), "i");
      and.push({
        $or: [{ categories: rx }, { display_categories: rx }, { category: rx }],
      });
    }

    if (state) and.push({ state });

    if (verifiedOnly) {
      and.push({
        $or: [
          { isVerified: true },
          { verified: true },
          { trustStatus: "verified" },
          { status: "verified" },
        ],
      });
    }

    if (!includeIncomplete && !isOrganizations) {
      // completeness/visibility guard already comes from publicBusinessBaseQuery()
      // for the default public business search path.
    }

    const strictQuery = and.length ? { $and: and } : {};
    let query: any = strictQuery;
    let total = -1;
    let queryMode:
      | "strict"
      | "fallback_intent_location"
      | "fallback_location"
      | "fallback_intent" = "strict";

    if (search && strictTokens.length === 0) {
      queryMode = "fallback_intent";
    }

    const shouldAttemptFallback = Boolean(search) && strictTokens.length >= 2;
    let hasStrictResults = true;

    if (shouldAttemptFallback) {
      hasStrictResults = Boolean(
        await col.findOne(strictQuery, { projection: { _id: 1 } }),
      );
    }

    if (shouldAttemptFallback && !hasStrictResults) {
      const baseAnd = searchTokenClause
        ? and.filter((clause) => clause !== searchTokenClause)
        : and;

      // location-first fallback order when location intent exists:
      // 1) location + intent, 2) location-only, 3) intent-only
      if (locationTokens.length) {
        if (intentTokens.length) {
          const intentAnyClause = buildTokenAnyClause(
            intentTokens,
            searchFields,
          );
          const locationClause = buildLocationClause(locationTokens);
          if (intentAnyClause && locationClause) {
            query = { $and: [...baseAnd, intentAnyClause, locationClause] };
            const hasFallback = await col.findOne(query, {
              projection: { _id: 1 },
            });
            if (hasFallback) queryMode = "fallback_intent_location";
          }
        }

        if (queryMode === "strict") {
          const locationClause = buildLocationClause(locationTokens);
          if (locationClause) {
            query = { $and: [...baseAnd, locationClause] };
            const hasFallback = await col.findOne(query, {
              projection: { _id: 1 },
            });
            if (hasFallback) queryMode = "fallback_location";
          }
        }
      }

      if (queryMode === "strict" && intentTokens.length) {
        const intentAnyClause = buildTokenAnyClause(intentTokens, searchFields);
        if (intentAnyClause) {
          query = { $and: [...baseAnd, intentAnyClause] };
          const hasFallback = await col.findOne(query, {
            projection: { _id: 1 },
          });
          if (hasFallback) queryMode = "fallback_intent";
        }
      }
    }

    const tAfterPrep = performance.now();
    const effectivePage = Math.max(1, page);
    const effectiveSkip = (effectivePage - 1) * limit;

    let items: any[] = [];

    const resultProjection = {
      _id: 1,
      business_name: 1,
      name: 1,
      alias: 1,
      category: 1,
      categories: 1,
      display_categories: 1,
      description: 1,
      city: 1,
      state: 1,
      address: 1,
      country: 1,
      amountPaid: 1,
      createdAt: 1,
      updatedAt: 1,
      isVerified: 1,
      verified: 1,
      trustStatus: 1,
      status: 1,
      claimStage: 1,
      publicListingStatus: 1,
      ownershipReviewStatus: 1,
      isComplete: 1,
      completenessScore: 1,
      qualityScore: 1,
      directoryVisibilityApproved: 1,
      orgType: 1,
      denomination: 1,
      logo: 1,
      image: 1,
      website: 1,
      phone: 1,
    };

    if (search) {
      const candidateLimit = Math.min(
        Math.max(effectiveSkip + limit + 1, limit + 24),
        80,
      );
      const candidates = await col
        .find(query, { projection: resultProjection })
        .limit(candidateLimit)
        .toArray();

      const tBeforeFind = performance.now();
      const ranked = candidates
        .map((item) => {
          const matchQuality = getMatchQuality(
            item,
            intentTokens,
            locationTokens,
          );
          const strength = listingStrength(item);
          const baseScore = isOrganizations
            ? relevanceScoreOrg(item, search)
            : relevanceScoreBusiness(item, search);
          const matchTier = matchQualityRank(matchQuality);

          const locationText =
            `${safeText(item?.city)} ${safeText(item?.state)} ${safeText(item?.address)} ${safeText(item?.country)}`.toLowerCase();
          const locationHitCount = locationTokens.filter((token) =>
            textHasPattern(locationText, token),
          ).length;
          const locationBoost =
            locationTokens.length > 0
              ? (locationHitCount / locationTokens.length) * 35
              : 0;

          const categoryText =
            `${safeText(item?.category)} ${safeText(item?.categories)} ${safeText(item?.display_categories)} ${safeText(item?.orgType)}`.toLowerCase();
          const intentCategoryHits = intentTokens.filter((token) =>
            textHasPattern(categoryText, token),
          ).length;

          let score = baseScore + strength * 0.15 + locationBoost;
          if (queryMode !== "strict" && matchQuality === "approximate") {
            score -= 18;
          }
          if (
            queryMode !== "strict" &&
            intentTokens.length > 0 &&
            intentCategoryHits === 0
          ) {
            score -= 65;
          }

          return {
            item,
            score,
            baseScore,
            strength,
            completeness: computeListingCompleteness(item).completenessScore,
            matchQuality,
            matchTier,
          };
        })
        .sort((a, b) => {
          if (b.matchTier !== a.matchTier) return b.matchTier - a.matchTier;
          if (b.score !== a.score) return b.score - a.score;
          if (b.strength !== a.strength) return b.strength - a.strength;
          if (sort === "completeness" && b.completeness !== a.completeness) {
            return b.completeness - a.completeness;
          }
          if (!isOrganizations && sponsoredFirst) {
            const paidDiff =
              Number(b.item?.amountPaid || 0) - Number(a.item?.amountPaid || 0);
            if (paidDiff !== 0) return paidDiff;
          }
          return (
            Number(b.item?.amountPaid || 0) - Number(a.item?.amountPaid || 0)
          );
        })
        .map((x) =>
          normalizeResultItem(
            {
              ...x.item,
              _matchQuality: x.matchQuality,
              _listingStrength: x.strength,
            },
            isOrganizations,
          ),
        );

      const tAfterRank = performance.now();
      const rankedWindow = ranked.slice(
        effectiveSkip,
        effectiveSkip + limit + 1,
      );
      items = rankedWindow.slice(0, limit);

      if (!isOrganizations && items.length > 0) {
        const queryFamily = buildQueryFamilyKey(intentTokens, locationTokens);
        const organicCount = items.length;
        const bandBudget = insertionBudgetForCount(organicCount);
        const densityCap = densityCapForCount(organicCount);
        const insertionCap = Math.min(bandBudget, Math.max(0, densityCap));

        if (insertionCap > 0) {
          const now = new Date();
          const sponsorScheduleRaw = await db
            .collection("featured_sponsor_schedule")
            .find({
              placement: "homepage-featured-sponsor",
              status: { $in: ["scheduled", "active"] },
            })
            .sort({ weekStart: -1, sortOrder: 1, createdAt: -1 })
            .limit(40)
            .toArray();

          const sponsorFallbackRaw = await db
            .collection("advertising_requests")
            .find({
              option: "featured-sponsor",
              paymentStatus: "paid",
              reviewStatus: "approved",
              status: { $in: ["approved", "active"] },
            })
            .sort({ paidAt: -1, updatedAt: -1, createdAt: -1 })
            .limit(40)
            .toArray();

          const sponsorCandidatesRaw = [
            ...sponsorFallbackRaw.map((s: any) => ({
              ...s,
              __source: "advertising_requests",
              __inventoryTier: 1,
            })),
            ...sponsorScheduleRaw.map((s: any) => ({
              _id: s.campaignId || s._id,
              business: s.businessName,
              details: s.tagline,
              businessId: s.businessId || s.campaignId || s._id,
              targetUrl: s.targetUrl || s.website,
              placement: s.placement,
              city: s.city,
              state: s.state,
              address: s.address,
              paidAt: s.weekStart || s.createdAt,
              durationDays: 30,
              __source: "featured_sponsor_schedule",
              __inventoryTier: 2,
            })),
          ];

          const sessionKey = `${ip}:${queryFamily}:${search.toLowerCase()}`;
          const visibleIds = new Set(items.map((x: any) => String(x._id)));
          const eligibleSponsors = sponsorCandidatesRaw
            .map((c: any) => {
              const paidAt = c?.paidAt ? new Date(c.paidAt) : null;
              const duration = Math.max(1, Number(c?.durationDays || 30));
              if (!paidAt || Number.isNaN(paidAt.getTime())) return null;
              const expiresAt = new Date(
                paidAt.getTime() + duration * 24 * 60 * 60 * 1000,
              );
              if (expiresAt <= now) return null;

              const title = safeText(c?.business || c?.businessName).trim();
              if (!title) return null;
              const alias = safeText(c?.businessId || c?._id);
              const mm = getMatchQuality(
                {
                  business_name: title,
                  description: safeText(c?.details),
                  category: safeText(c?.placement),
                  city: safeText(c?.city),
                  state: safeText(c?.state),
                  address: safeText(c?.address),
                },
                intentTokens,
                locationTokens,
              );
              if (mm === "approximate") return null;
              if (visibleIds.has(String(c?.businessId || c?._id))) return null;

              return {
                campaignId: String(c._id),
                title,
                description:
                  safeText(c?.details).slice(0, 180) ||
                  "Sponsored partner listing.",
                category: safeText(c?.placement || "Sponsored"),
                website: safeText(c?.targetUrl || c?.website),
                alias,
                matchQuality: mm as "exact" | "close",
                paidAt,
                inventoryTier: Number(c?.__inventoryTier || 2),
              };
            })
            .filter(Boolean) as any[];

          const recentExposure = await exposureCol
            .aggregate([
              {
                $match: {
                  queryFamily,
                  at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
              },
              { $group: { _id: "$sponsorId", c: { $sum: "$count" } } },
            ])
            .toArray();
          const exposureMap = new Map<string, number>(
            recentExposure.map((r: any) => [String(r._id), Number(r.c || 0)]),
          );

          const rankedSponsors = eligibleSponsors.sort((a, b) => {
            const mq =
              matchQualityRank(b.matchQuality) -
              matchQualityRank(a.matchQuality);
            if (mq !== 0) return mq;
            if (a.inventoryTier !== b.inventoryTier) {
              return a.inventoryTier - b.inventoryTier;
            }
            const ea = exposureMap.get(a.campaignId) || 0;
            const eb = exposureMap.get(b.campaignId) || 0;
            if (ea !== eb) return ea - eb;
            return b.paidAt.getTime() - a.paidAt.getTime();
          });

          const selected: any[] = [];
          for (const s of rankedSponsors) {
            if (selected.length >= insertionCap) break;
            const sess = await sessionCapCol.findOne({
              sessionKey,
              sponsorId: s.campaignId,
              expiresAt: { $gt: now },
            });
            if (sess && Number(sess.count || 0) >= 2) continue;
            selected.push(s);
          }

          const merged: any[] = [...items];
          const insertionPositions = [4, 10, 16];
          selected.forEach((s, i) => {
            const pos = Math.min(
              insertionPositions[i] ?? merged.length,
              merged.length,
            );
            const sponsorCard: SponsoredPlacement = {
              _id: `sponsored:${s.campaignId}`,
              name: s.title,
              business_name: s.title,
              description: s.description,
              category: s.category,
              primaryCategory: s.category,
              locationDisplay: "Sponsored Placement",
              alias: s.alias,
              website: s.website,
              isSponsored: true,
              __sponsoredPlacement: true,
              __kind: "business",
              __sponsorCampaignId: s.campaignId,
              _matchQuality: s.matchQuality,
            };
            merged.splice(pos, 0, sponsorCard);
          });

          if (selected.length) {
            await Promise.all(
              selected.map((s) =>
                exposureCol.insertOne({
                  sponsorId: s.campaignId,
                  queryFamily,
                  at: now,
                  count: 1,
                }),
              ),
            );
            await Promise.all(
              selected.map((s) =>
                sessionCapCol.updateOne(
                  { sessionKey, sponsorId: s.campaignId },
                  {
                    $set: {
                      expiresAt: new Date(Date.now() + SESSION_CAP_TTL_MS),
                    },
                    $inc: { count: 1 },
                  },
                  { upsert: true },
                ),
              ),
            );
          }

          items = merged;
        }
      }

      total = await col.countDocuments(query);
      const tAfterSlice = performance.now();

      const debugPerf = {
        prepMs: Math.round(tAfterPrep - t0Perf),
        findCandidatesMs: Math.round(tBeforeFind - tAfterPrep),
        rankMs: Math.round(tAfterRank - tBeforeFind),
        sliceMs: Math.round(tAfterSlice - tAfterRank),
        candidatesCount: candidates.length,
      };

      const categoryPageText = items
        .map((it) =>
          `${safeText((it as any)?.category)} ${safeText((it as any)?.categories)} ${safeText((it as any)?.display_categories)} ${safeText((it as any)?.orgType)}`.toLowerCase(),
        )
        .join(" ");
      const noExactCategoryMatchInLocation =
        queryMode !== "strict" &&
        intentTokens.length > 0 &&
        !intentTokens.some((token) => textHasPattern(categoryPageText, token));

      const payload = {
        status: "ok",
        requestId,
        tookMs: Date.now() - t0,
        page: effectivePage,
        limit,
        total,
        hasMore: items.length === limit && total > effectiveSkip + items.length,
        type: isOrganizations ? "organizations" : "businesses",
        sort,
        queryMode,
        searchMeta: {
          strictTokens,
          intentTokens,
          locationTokens,
          usedFallback: queryMode !== "strict",
          noExactCategoryMatchInLocation,
        },
        items,
      } as any;

      const tBeforeJson = performance.now();
      if (String(req.query.debugPerf || "") === "1") payload._perf = debugPerf;
      const jsonString = JSON.stringify(payload);
      const tAfterJson = performance.now();
      res.setHeader(
        "Server-Timing",
        `prep;dur=${debugPerf.prepMs},find;dur=${debugPerf.findCandidatesMs},rank;dur=${debugPerf.rankMs},serialize;dur=${Math.round(tAfterJson - tBeforeJson)}`,
      );
      cache.set(cacheKey, { at: Date.now(), payload: jsonString });
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=120",
      );
      res.setHeader("X-Search-Cache", "MISS");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(jsonString);
    } else {
      const baseSort =
        sort === "newest"
          ? { createdAt: -1, updatedAt: -1 }
          : sort === "completeness"
            ? { completenessScore: -1, qualityScore: -1, createdAt: -1 }
            : isOrganizations
              ? { createdAt: -1, name: 1 }
              : sponsoredFirst
                ? { amountPaid: -1, createdAt: -1, business_name: 1 }
                : { createdAt: -1, business_name: 1 };

      const rows = await col
        .find(query, { projection: resultProjection })
        .sort(baseSort as any)
        .skip(effectiveSkip)
        .limit(limit + 1)
        .toArray();
      items = rows.slice(0, limit).map((item) =>
        normalizeResultItem(
          {
            ...item,
            _matchQuality: getMatchQuality(item, intentTokens, locationTokens),
          },
          isOrganizations,
        ),
      );
      total = await col.countDocuments(query);
    }

    const tAfterFindMap = performance.now();
    const tookMs = Date.now() - t0;

    const categoryPageText = items
      .map((it) =>
        `${safeText((it as any)?.category)} ${safeText((it as any)?.categories)} ${safeText((it as any)?.display_categories)} ${safeText((it as any)?.orgType)}`.toLowerCase(),
      )
      .join(" ");
    const noExactCategoryMatchInLocation =
      queryMode !== "strict" &&
      intentTokens.length > 0 &&
      !intentTokens.some((token) => textHasPattern(categoryPageText, token));

    const payload = {
      status: "ok",
      requestId,
      tookMs,
      page: effectivePage,
      limit,
      total,
      hasMore: items.length === limit && total > effectiveSkip + items.length,
      type: isOrganizations ? "organizations" : "businesses",
      sort,
      queryMode,
      searchMeta: {
        strictTokens,
        intentTokens,
        locationTokens,
        usedFallback: queryMode !== "strict",
        noExactCategoryMatchInLocation,
      },
      items,
    } as any;

    const tBeforeJson = performance.now();
    if (String(req.query.debugPerf || "") === "1") {
      payload._perf = {
        prepMs: Math.round(tAfterPrep - t0Perf),
        findAndMapMs: Math.round(tAfterFindMap - tAfterPrep),
      };
    }
    const jsonString = JSON.stringify(payload);
    const tAfterJson = performance.now();
    res.setHeader(
      "Server-Timing",
      `prep;dur=${Math.round(tAfterPrep - t0Perf)},find;dur=${Math.round(tAfterFindMap - tAfterPrep)},serialize;dur=${Math.round(tAfterJson - tBeforeJson)}`,
    );
    cache.set(cacheKey, { at: Date.now(), payload: jsonString });
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    res.setHeader("X-Search-Cache", "MISS");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(jsonString);
  } catch (error: any) {
    console.error("Search Error:", error);
    return res.status(500).json({
      status: "error",
      requestId,
      error: {
        code: "SEARCH_FAILED",
        message: error?.message || "Search failed",
      },
    });
  }
}
