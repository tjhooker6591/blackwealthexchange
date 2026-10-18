// src/pages/api/admin/monthly-reports.ts
//
// Admin controls for the monthly member report:
//   { action: "test", membershipId }  -> last month's report for that
//     membership, sent to the signed-in admin only (marked [TEST]).
//   { action: "send_now" }            -> the real monthly send, in case the
//     scheduled run was missed. Members who already got this month's report
//     are skipped.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { sendMonthlyReports, sendOwnerSummary } from "@/lib/monthlyReport";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    if (body.action === "test") {
      const membershipId = String(body.membershipId || "").trim();
      if (!membershipId || !admin.email) {
        return res
          .status(400)
          .json({ ok: false, error: "membershipId is required" });
      }
      const summary = await sendMonthlyReports(db, {
        membershipId,
        testTo: admin.email,
      });
      return res.status(200).json({ ok: true, ...summary });
    }

    if (body.action === "send_now") {
      const summary = await sendMonthlyReports(db);
      await sendOwnerSummary(summary);
      return res.status(200).json({ ok: true, ...summary });
    }

    return res.status(400).json({ ok: false, error: "Unknown action" });
  } catch (err) {
    console.error("[api/admin/monthly-reports] error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
