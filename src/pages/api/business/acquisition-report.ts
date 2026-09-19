// src/pages/api/business/acquisition-report.ts
//
// Owner-facing results report (brief section 5). Re-uses the exact same
// business-access authorization as the Phase 4 Growth Command Center
// (src/pages/api/personalization/business-growth.ts) -- a verified
// representative with an ordinary "user" accountType sees only their own
// managed business's report; an unrelated user cannot read it by changing
// the businessId query param (acceptance check #1).

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  getPersonalizationSession,
  resolveRequestedBusinessId,
} from "@/lib/personalization/session";
import { resolveOwnerReport } from "@/lib/acquisition/reports";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const session = getPersonalizationSession(req);
  if (!session) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const businessId = await resolveRequestedBusinessId(
      db,
      session,
      String(req.query.businessId || ""),
    );
    if (!businessId) {
      return res.status(403).json({
        ok: false,
        code: "NO_AUTHORIZED_BUSINESS",
        message: "No business found for this account.",
      });
    }

    const windowEnd =
      typeof req.query.windowEnd === "string"
        ? req.query.windowEnd
        : new Date().toISOString();
    const windowStart =
      typeof req.query.windowStart === "string"
        ? req.query.windowStart
        : new Date(
            new Date(windowEnd).getTime() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString();

    const report = await resolveOwnerReport(db, {
      businessId,
      windowStart,
      windowEnd,
    });
    return res.status(200).json({ ok: true, report });
  } catch (err) {
    console.error("[api/business/acquisition-report] error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
