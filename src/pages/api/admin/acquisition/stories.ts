import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { createStory, listStoriesForBusiness } from "@/lib/acquisition/stories";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const businessId = String(req.query.businessId || "");
    if (!businessId) {
      return res
        .status(400)
        .json({
          ok: false,
          code: "MISSING_BUSINESS_ID",
          message: "businessId is required.",
        });
    }
    const rows = await listStoriesForBusiness(db, businessId);
    return res.status(200).json({ ok: true, stories: rows });
  }

  if (req.method === "POST") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const result = await createStory(db, {
      businessId: body.businessId,
      snapshotId: body.snapshotId,
      period: body.period,
      actionsTaken: body.actionsTaken,
      observedOutcomes: body.observedOutcomes,
      sourceReferences: body.sourceReferences,
      limitations: body.limitations,
      salesFigureText: body.salesFigureText,
      comparisonText: body.comparisonText,
      actorId: admin.userId || admin.email || "admin",
    });
    if (!result.ok) return res.status(400).json(result);
    return res.status(201).json({ ok: true, story: result.story });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
