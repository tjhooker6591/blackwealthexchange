import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { getAdminDecodedFromRequest, isAdminDecoded } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";
import { computeListingCompleteness } from "@/lib/directory/completeness";

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

  return search
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !stopwords.has(t))
    .slice(0, 8);
}

const CITY_STATE_ALIASES: Record<string, string> = {
  atlanta: "GA",
  houston: "TX",
  chicago: "IL",
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
    const ipLimit = await hitApiRateLimit(
      db,
      `search:businesses:ip:${ip}`,
      120,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({
        status: "error",
        requestId,
        error: { code: "RATE_LIMITED", message: "Too many search requests" },
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
    const skip = (page - 1) * limit;

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
      and.push({
        $or: [
          { isComplete: true },
          { completenessScore: { $gte: 70 } },
          { qualityScore: { $gte: 70 } },
        ],
      });
    }

    const strictQuery = and.length ? { $and: and } : {};
    let query: any = strictQuery;
    let total = await col.countDocuments(query);

    if (search && total === 0) {
      const baseAnd = searchTokenClause
        ? and.filter((clause) => clause !== searchTokenClause)
        : and;

      if (intentTokens.length && locationTokens.length) {
        const intentAnyClause = buildTokenAnyClause(intentTokens, searchFields);
        const locationClause = buildLocationClause(locationTokens);
        if (intentAnyClause && locationClause) {
          query = { $and: [...baseAnd, intentAnyClause, locationClause] };
          total = await col.countDocuments(query);
        }
      }

      if (total === 0 && locationTokens.length) {
        const locationClause = buildLocationClause(locationTokens);
        if (locationClause) {
          query = { $and: [...baseAnd, locationClause] };
          total = await col.countDocuments(query);
        }
      }

      if (total === 0 && intentTokens.length) {
        const intentAnyClause = buildTokenAnyClause(intentTokens, searchFields);
        if (intentAnyClause) {
          query = { $and: [...baseAnd, intentAnyClause] };
          total = await col.countDocuments(query);
        }
      }
    }

    let items: any[] = [];

    if (search || sort === "relevance") {
      const candidateLimit = Math.max(skip + limit * 10, 150);
      const candidates = await col
        .find(query)
        .sort(
          isOrganizations
            ? { createdAt: -1, name: 1 }
            : { createdAt: -1, business_name: 1 },
        )
        .limit(candidateLimit)
        .toArray();

      const ranked = candidates
        .map((item) => ({
          item,
          score: isOrganizations
            ? relevanceScoreOrg(item, search)
            : relevanceScoreBusiness(item, search),
          completeness: computeListingCompleteness(item).completenessScore,
        }))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
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
        .map((x) => x.item);

      items = ranked.slice(skip, skip + limit);
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

      items = await col
        .find(query)
        .sort(baseSort)
        .skip(skip)
        .limit(limit)
        .toArray();
    }

    const tookMs = Date.now() - t0;

    return res.status(200).json({
      status: "ok",
      requestId,
      tookMs,
      page,
      limit,
      total,
      hasMore: page * limit < total,
      type: isOrganizations ? "organizations" : "businesses",
      sort,
      items,
    });
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
