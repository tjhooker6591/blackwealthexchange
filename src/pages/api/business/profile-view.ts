// src/pages/api/business/profile-view.ts
//
// Records one visit to a business page (see src/lib/profileViews.ts).
// Public: guests are counted by an anonymous browser session id only.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { parseSessionIdentity } from "@/lib/directoryOwnership";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { recordProfileView } from "@/lib/profileViews";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const businessId = String(body.businessId || "").trim();
    if (!businessId || businessId.length > 64) {
      return res
        .status(400)
        .json({ ok: false, error: "businessId is required" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const limit = await hitApiRateLimit(
      db,
      `profile-view:ip:${getClientIp(req)}`,
      120,
      5,
    );
    if (limit.blocked) {
      return res.status(429).json({ ok: false, error: "Too many requests" });
    }

    const session = parseSessionIdentity(req);
    const result = await recordProfileView(db, {
      businessId,
      viewer: session
        ? { userId: session.userId, accountType: session.accountType }
        : null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      page: body.page === "business" ? "business" : "directory",
      userAgent: req.headers["user-agent"] || null,
    });

    return res.status(200).json({ ok: true, recorded: result.recorded });
  } catch (err) {
    console.error("[api/business/profile-view] error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
