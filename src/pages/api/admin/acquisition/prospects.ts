import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ensureAcquisitionIndexes } from "@/lib/acquisition/shared";
import { createProspect, listProspects } from "@/lib/acquisition/prospects";
import { sendInitialOutreach } from "@/lib/acquisition/outreach";
import type { ProspectStage } from "@/lib/acquisition/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureAcquisitionIndexes(db);

  if (req.method === "GET") {
    const stage =
      typeof req.query.stage === "string"
        ? (req.query.stage as ProspectStage)
        : undefined;
    const lossState =
      typeof req.query.lossState === "string" ? req.query.lossState : undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const rows = await listProspects(db, { stage, lossState, q });
    return res.status(200).json({ ok: true, prospects: rows });
  }

  if (req.method === "POST") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const result = await createProspect(db, {
      businessId: body.businessId,
      externalProspectName: body.externalProspectName,
      sourceUrl: body.sourceUrl,
      contactRoute: body.contactRoute,
      contactEmail: body.contactEmail,
      evidenceNotes: body.evidenceNotes,
      targetOffer: body.targetOffer,
      assignedOperator: body.assignedOperator,
      priorityScore: body.priorityScore,
      actorId: admin.userId || "",
      actorEmail: admin.email || "",
    });
    if (!result.ok) {
      return res.status(400).json(result);
    }

    // One prospect at a time, added explicitly by an admin -- never a bulk
    // sender. Fires immediately, but a failure here (bad SMTP config, no
    // contact email on file) never blocks the prospect from being created;
    // it's just logged on the prospect's own activity history instead.
    let outreach: { ok: boolean; code?: string; message?: string } = {
      ok: false,
      code: "SKIPPED",
    };
    if (body.contactEmail && result.prospect._id) {
      outreach = await sendInitialOutreach(db, result.prospect._id);
    }

    return res
      .status(201)
      .json({ ok: true, prospect: result.prospect, outreach });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
