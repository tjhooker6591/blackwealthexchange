import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { createReportSnapshot } from "@/lib/acquisition/stories";

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
  if (!body.businessId || !body.windowStart || !body.windowEnd) {
    return res.status(400).json({
      ok: false,
      code: "MISSING_FIELDS",
      message: "businessId, windowStart, and windowEnd are required.",
    });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const snapshot = await createReportSnapshot(db, {
    businessId: body.businessId,
    windowStart: body.windowStart,
    windowEnd: body.windowEnd,
  });
  return res.status(201).json({ ok: true, snapshot });
}
