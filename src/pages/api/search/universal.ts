import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import {
  resolveUniversalSearch,
  type UniversalSearchDomain,
  type UniversalSearchResponse,
} from "@/lib/search/universalSearch";

let rateLimitIndexesReadyPromise: Promise<unknown> | null = null;

const VALID_DOMAINS: UniversalSearchDomain[] = [
  "business",
  "product",
  "job",
  "opportunity",
];

function parseDomains(value: unknown): UniversalSearchDomain[] | undefined {
  const raw = Array.isArray(value) ? value.join(",") : String(value || "");
  const requested = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry): entry is UniversalSearchDomain =>
      VALID_DOMAINS.includes(entry as UniversalSearchDomain),
    );
  return requested.length ? requested : undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    UniversalSearchResponse | { ok: false; message: string }
  >,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    if (!rateLimitIndexesReadyPromise) {
      rateLimitIndexesReadyPromise = ensureApiRateLimitIndexes(db);
    }
    await rateLimitIndexesReadyPromise;
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      db,
      `search:universal:ip:${ip}`,
      180,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({
        ok: false,
        message: "Too many searches. Please try again shortly.",
      });
    }

    const q = String(req.query.q || req.query.search || "").trim();
    const domains = parseDomains(req.query.domains);
    const limitRaw = Number(req.query.limit ?? 20);
    const limitPerDomain = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(50, Math.floor(limitRaw)))
      : 20;

    const result = await resolveUniversalSearch(db, {
      query: q,
      domains,
      limitPerDomain,
    });

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
    return res.status(200).json(result);
  } catch (error) {
    console.error("[api/search/universal]", error);
    return res.status(500).json({
      ok: false,
      message:
        "Search is temporarily unavailable. Please try again in a moment.",
    });
  }
}
