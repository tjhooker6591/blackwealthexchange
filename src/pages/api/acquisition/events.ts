// src/pages/api/acquisition/events.ts
//
// Public (unauthenticated) ingestion endpoint for buyer-acquisition events.
// The request body's `source` is IGNORED -- this route always calls
// recordAcquisitionEvent with source: "browser", which the lib layer
// restricts to the safe, non-revenue-declaring event types. inquiry_
// submitted and paid_order can only be recorded by trusted server-side
// callers that import lib/acquisition/events.ts directly (existing form
// handlers, the checkout/webhook path), never through this route.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { ensureAcquisitionIndexes } from "@/lib/acquisition/shared";
import { recordAcquisitionEvent } from "@/lib/acquisition/events";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    await ensureApiRateLimitIndexes(db);
    await ensureAcquisitionIndexes(db);

    const ip = getClientIp(req);
    const limit = await hitApiRateLimit(
      db,
      `acquisition-event:ip:${ip}`,
      300,
      5,
    );
    if (limit.blocked) {
      return res.status(429).json({ ok: false, error: "Too many requests" });
    }

    const result = await recordAcquisitionEvent(db, {
      eventType: String(body.eventType || ""),
      businessId: String(body.businessId || ""),
      eventTime:
        typeof body.eventTime === "string" ? body.eventTime : undefined,
      source: "browser",
      campaignId: typeof body.campaignId === "string" ? body.campaignId : null,
      sessionId:
        typeof body.sessionId === "string"
          ? body.sessionId.slice(0, 128)
          : null,
      dedupeKey:
        typeof body.dedupeKey === "string"
          ? body.dedupeKey.slice(0, 256)
          : null,
      demoFlag: Boolean(body.demoFlag),
      userAgent: req.headers["user-agent"] || null,
    });

    if (!result.ok) {
      return res.status(400).json(result);
    }
    return res
      .status(result.deduped ? 200 : 201)
      .json({ ok: true, deduped: result.deduped });
  } catch (err) {
    console.error("[api/acquisition/events] error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
