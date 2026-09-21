import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  getProspect,
  setPaidStatus,
  setProspectLossState,
  transitionProspectStage,
} from "@/lib/acquisition/prospects";
import { activateProspect } from "@/lib/acquisition/onboarding";
import { sendInitialOutreach } from "@/lib/acquisition/outreach";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const id = String(req.query.id || "");
  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const prospect = await getProspect(db, id);
    if (!prospect) {
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Prospect not found." });
    }
    return res.status(200).json({ ok: true, prospect });
  }

  if (req.method === "PATCH") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const action = String(body.action || "");
    const actorId = admin.userId || "";
    const actorEmail = admin.email || "";

    if (action === "transition_stage") {
      const result = await transitionProspectStage(db, {
        prospectId: id,
        toStage: body.toStage,
        note: body.note,
        actorId,
        actorEmail,
      });
      return res.status(result.ok ? 200 : 400).json(result);
    }

    if (action === "activate") {
      const result = await activateProspect(db, {
        prospectId: id,
        actorId,
        actorEmail,
      });
      return res.status(result.ok ? 200 : 400).json(result);
    }

    if (action === "set_loss_state") {
      const result = await setProspectLossState(db, {
        prospectId: id,
        lossState: body.lossState,
        lossReason: body.lossReason,
        actorId,
        actorEmail,
      });
      return res.status(result.ok ? 200 : 400).json(result);
    }

    if (action === "send_outreach") {
      // Manual re-trigger for a prospect that already exists but never got
      // automatic outreach when it was created (e.g. a contact email was
      // added after the fact, or the send failed the first time -- SMTP
      // wasn't configured at all when several prospects were first added).
      // Only valid while still "researched" -- the same gate the automatic
      // path uses -- so this can never fire a second outreach email once a
      // prospect has actually moved forward.
      const current = await getProspect(db, id);
      if (!current) {
        return res
          .status(404)
          .json({
            ok: false,
            code: "NOT_FOUND",
            message: "Prospect not found.",
          });
      }
      const currentStage = (current as any).stage;
      if (currentStage !== "researched") {
        return res.status(400).json({
          ok: false,
          code: "ALREADY_CONTACTED",
          message: `This prospect is already past the initial-outreach stage (currently "${currentStage}").`,
        });
      }
      const result = await sendInitialOutreach(db, id);
      return res.status(result.ok ? 200 : 400).json(result);
    }

    if (action === "set_paid_status") {
      const result = await setPaidStatus(db, {
        prospectId: id,
        paidStatus: body.paidStatus,
        actorId,
        actorEmail,
      });
      return res.status(result.ok ? 200 : 400).json(result);
    }

    return res.status(400).json({
      ok: false,
      code: "UNKNOWN_ACTION",
      message: `Unknown action: ${action}`,
    });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
