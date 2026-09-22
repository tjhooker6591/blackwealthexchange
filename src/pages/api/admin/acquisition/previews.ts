import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  createPreview,
  listPreviewsForProspect,
  revokePreview,
} from "@/lib/acquisition/previews";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const prospectId = String(req.query.prospectId || "");
    if (!prospectId) {
      return res
        .status(400)
        .json({
          ok: false,
          code: "MISSING_PROSPECT_ID",
          message: "prospectId is required.",
        });
    }
    const rows = await listPreviewsForProspect(db, prospectId);
    return res.status(200).json({ ok: true, previews: rows });
  }

  if (req.method === "POST") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const result = await createPreview(db, {
      prospectId: body.prospectId,
      businessId: body.businessId,
      proposedFields: Array.isArray(body.proposedFields)
        ? body.proposedFields
        : [],
      missingFacts: Array.isArray(body.missingFacts) ? body.missingFacts : [],
      ttlDays: body.ttlDays,
      actorId: admin.userId || "",
    });
    if (!result.ok) return res.status(400).json(result);
    return res.status(201).json({ ok: true, preview: result.preview });
  }

  if (req.method === "DELETE") {
    const previewId = String(req.query.previewId || "");
    const result = await revokePreview(db, previewId);
    return res.status(result.ok ? 200 : 400).json(result);
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
