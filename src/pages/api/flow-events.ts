import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeEventType(body: Record<string, unknown>) {
  const raw =
    s(body.eventType) ||
    s(body.event) ||
    s(body.action) ||
    s(body.name);

  if (!raw) return "";

  return raw.slice(0, 100);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const eventType = normalizeEventType(body);

    // Keep validation, but do not restrict to the old search-only allowlist.
    if (!eventType || !/^[a-zA-Z0-9._:-\s]{2,100}$/.test(eventType)) {
      return res.status(400).json({ error: "Invalid eventType" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);

    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(db, `flow-event:ip:${ip}`, 300, 5);
    if (ipLimit.blocked) {
      return res.status(429).json({ error: "Too many requests" });
    }

    await db.collection("flow_events").insertOne({
      eventType,

      businessId: s(body.businessId) || null,
      businessAlias: s(body.businessAlias) || null,
      source: s(body.source) || null,
      query: s(body.query) || null,
      category: s(body.category) || null,
      state: s(body.state) || null,
      path: s(body.path) || req.url || null,

      // homepage / guided-flow useful context
      surface: s(body.surface) || null,
      location: s(body.location) || null,
      cta: s(body.cta) || null,
      label: s(body.label) || null,
      target: s(body.target) || null,
      href: s(body.href) || null,

      createdAt: new Date(),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("flow-events error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}