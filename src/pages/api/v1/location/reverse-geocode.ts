// src/pages/api/v1/location/reverse-geocode.ts
//
// Phase 7 -- Location-Aware Discovery. Stateless server-side proxy for
// src/lib/location/reverseGeocode.ts: the client sends coordinates the
// browser's opt-in Geolocation API already gave it (never coordinates BWE
// invented), this returns city/state text, and nothing is written to any
// collection. Rate-limited with the existing shared limiter
// (src/lib/apiRateLimit.ts) since this proxies a third-party free service
// that has its own usage policy.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { reverseGeocode } from "@/lib/location/reverseGeocode";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "POST only" },
    });
  }

  const body: any =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "INVALID_COORDINATES",
        message: "lat/lng are required and must be valid.",
      },
    });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureApiRateLimitIndexes(db).catch(() => null);

  const ip = getClientIp(req);
  const limit = await hitApiRateLimit(db, `reverse-geocode:ip:${ip}`, 20, 5);
  if (limit.blocked) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      error: { code: "RATE_LIMITED", message: "Too many location requests." },
    });
  }

  try {
    const result = await reverseGeocode(lat, lng);
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    console.error("[api/v1/location/reverse-geocode] failed:", error);
    return res.status(502).json({
      ok: false,
      error: {
        code: "GEOCODE_FAILED",
        message: "Could not resolve location.",
      },
    });
  }
}
