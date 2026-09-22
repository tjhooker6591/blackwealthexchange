import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  getOrCreateOnboarding,
  updateOnboardingChecklist,
  updateOnboardingNotes,
} from "@/lib/acquisition/onboarding";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const prospectId = String(req.query.prospectId || "");
  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const record = await getOrCreateOnboarding(db, prospectId);
    if (!record) {
      return res
        .status(404)
        .json({
          ok: false,
          code: "NOT_FOUND",
          message: "No onboarding record for this prospect.",
        });
    }
    return res.status(200).json({ ok: true, onboarding: record });
  }

  if (req.method === "PATCH") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    if (body.notes) {
      const result = await updateOnboardingNotes(
        db,
        prospectId,
        body.notes,
        body.aiSummaryDraft,
      );
      if (!result.ok) return res.status(400).json(result);
    }
    if (body.checklist) {
      const result = await updateOnboardingChecklist(
        db,
        prospectId,
        body.checklist,
      );
      if (!result.ok) return res.status(400).json(result);
    }
    const record = await getOrCreateOnboarding(db, prospectId);
    return res.status(200).json({ ok: true, onboarding: record });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
