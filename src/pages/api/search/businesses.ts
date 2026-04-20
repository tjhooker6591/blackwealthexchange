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
    "black",
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

function scoreTokenMatch(text: string, token: string) {
  if (!text || !token) return 0;
  if (text === token) return 35;
  if (text.startsWith(token)) return 18;
  if (text.includes(token)) return 10;
  return 0;
}

function buildTokenSearchClause(tokens: string[], fields: string[]) {
  if (!tokens.length) return null;
  return {
    $and: tokens.map((token) => {
      const rx = new RegExp(escapeRegex(token), "i");
      return { $or: fields.map((field) => ({ [field]: rx })) };
    }),
  };
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
    score += scoreTokenMatch(name, token) * 2;
    score += scoreTokenMatch(alias, token);
    score += scoreTokenMatch(category, token) * 1.4;
    score += scoreTokenMatch(description, token) * 0.8;
    score += scoreTokenMatch(location, token) * 0.8;
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
    score += scoreTokenMatch(name, token) * 2;
    score += scoreTokenMatch(alias, token);
    score += scoreTokenMatch(orgType, token) * 1.5;
    score += scoreTokenMatch(denomination, token);
    score += scoreTokenMatch(description, token) * 0.8;
    score += scoreTokenMatch(location, token) * 0.8;
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

    if (search) {
      const tokens = normalizeSearchTokens(search);
      const tokenClause = buildTokenSearchClause(
        tokens,
        isOrganizations
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
            ],
      );
      if (tokenClause) and.push(tokenClause);
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

    const query = and.length ? { $and: and } : {};
    const total = await col.countDocuments(query);

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
