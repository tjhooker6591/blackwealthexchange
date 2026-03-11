import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

const ALLOWED = new Set([
  "search_performed",
  "result_click",
  "business_detail_view",
  "outbound_website_click",
  "directions_click",
  "no_results_shown",
  "rescue_action_clicked",
  "filter_relaxed",
  "suggested_category_clicked",
]);

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

    const eventType = String(body.eventType || "").trim();
    if (!ALLOWED.has(eventType)) {
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
      businessId: typeof body.businessId === "string" ? body.businessId : null,
      businessAlias:
        typeof body.businessAlias === "string" ? body.businessAlias : null,
      source: typeof body.source === "string" ? body.source : null,
      query: typeof body.query === "string" ? body.query : null,
      category: typeof body.category === "string" ? body.category : null,
      state: typeof body.state === "string" ? body.state : null,
      path: typeof body.path === "string" ? body.path : req.url || null,
      createdAt: new Date(),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("flow-events error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
