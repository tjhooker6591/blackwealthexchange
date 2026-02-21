import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

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

    const dbName = process.env.MONGODB_DB || "bwes-database";
    const client = await clientPromise;
    const db = client.db(dbName);
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

    const includeAllStatuses = req.query.includeAllStatuses === "1";

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

    const items = await col
      .find(query)
      // Sponsor-friendly + stable sort (uses your new index)
      .sort({ amountPaid: -1, createdAt: -1, business_name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

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
