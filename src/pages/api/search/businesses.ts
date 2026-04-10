import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { getAdminDecodedFromRequest, isAdminDecoded } from "@/lib/adminAuth";
import { getMongoDbName } from "@/lib/env";

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

function relevanceScore(item: any, search: string) {
  const q = search.toLowerCase().trim();
  if (!q) return 0;

  const name = safeText(item?.business_name).toLowerCase();
  const alias = safeText(item?.alias).toLowerCase();
  const category = `${safeText(item?.category)} ${safeText(item?.categories)} ${safeText(item?.display_categories)}`.toLowerCase();
  const description = safeText(item?.description).toLowerCase();
  const location = `${safeText(item?.city)} ${safeText(item?.state)} ${safeText(item?.address)}`.toLowerCase();

  let score = 0;
  if (name === q) score += 120;
  if (name.startsWith(q)) score += 65;
  if (name.includes(q)) score += 35;
  if (alias.includes(q)) score += 20;
  if (category.includes(q)) score += 22;
  if (description.includes(q)) score += 10;
  if (location.includes(q)) score += 8;

  if (item?.isVerified === true || item?.verified === true) score += 8;
  if (Number(item?.amountPaid || 0) > 0) score += 4;

  return score;
}

/**
 * GET /api/search/businesses
 * Query:
 *  - search (string)
 *  - category (string)
 *  - page (default 1)
 *  - limit (default 20, max 50)
 *  - includeAllStatuses=1  (optional; otherwise status="approved"/empty treated as public)
 *
 * Response:
 *  { status, requestId, tookMs, page, limit, total, hasMore, items }
 */
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

    // Small caching is OK for search (tune as needed)
    // If you want NO cache, remove this line.
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

    const col = db.collection("businesses");

    const searchRaw =
      typeof req.query.search === "string" ? req.query.search : "";
    const categoryRaw =
      typeof req.query.category === "string" ? req.query.category : "";

    const page = clampInt(req.query.page, 1, 9999, 1);
    const limit = clampInt(req.query.limit, 1, 50, 20);
    const skip = (page - 1) * limit;

    const search = searchRaw.trim().slice(0, 120);
    const category = categoryRaw.trim().slice(0, 60);

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

    // Public-safe status filter by default
    if (!includeAllStatuses) {
      and.push({
        $or: [
          { status: "approved" },
          { status: { $exists: false } },
          { status: "" },
          { status: null },
        ],
      });
    }

    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      and.push({
        $or: [
          { business_name: rx },
          { alias: rx },
          { description: rx },
          { categories: rx },
          { display_categories: rx },
          { category: rx },
          { address: rx },
          { state: rx },
          { country: rx },
        ],
      });
    }

    if (category && category !== "All") {
      const rx = new RegExp(escapeRegex(category), "i");
      and.push({
        $or: [{ categories: rx }, { display_categories: rx }, { category: rx }],
      });
    }

    const query = and.length ? { $and: and } : {};

    const total = await col.countDocuments(query);

    let items: any[] = [];

    if (search) {
      const candidateLimit = Math.max(limit * 8, 120);
      const candidates = await col
        .find(query)
        .sort({ createdAt: -1, business_name: 1 })
        .limit(candidateLimit)
        .toArray();

      const ranked = candidates
        .map((item) => ({ item, score: relevanceScore(item, search) }))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return Number(b.item?.amountPaid || 0) - Number(a.item?.amountPaid || 0);
        })
        .map((x) => x.item);

      items = ranked.slice(skip, skip + limit);
    } else {
      items = await col
        .find(query)
        // Sponsor-friendly + stable sort for broad browse
        .sort({ amountPaid: -1, createdAt: -1, business_name: 1 })
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
