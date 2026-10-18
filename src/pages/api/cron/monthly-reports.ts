// src/pages/api/cron/monthly-reports.ts
//
// Runs on the 1st of each month (vercel.json "crons"). Vercel calls it with
// "Authorization: Bearer <CRON_SECRET>"; anything else is refused. Sends
// last month's report to every active Founding member, once each, then a
// summary to the site owner.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { sendMonthlyReports, sendOwnerSummary } from "@/lib/monthlyReport";

export const config = { maxDuration: 60 };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ ok: false, error: "CRON_SECRET is not set" });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const summary = await sendMonthlyReports(db);
    await sendOwnerSummary(summary);
    return res.status(200).json({ ok: true, ...summary });
  } catch (err) {
    console.error("[api/cron/monthly-reports] error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
