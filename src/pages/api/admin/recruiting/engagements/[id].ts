// src/pages/api/admin/recruiting/engagements/[id].ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Admin-only
// get/update for a single recruiting engagement. Status and the agreed
// fee amount are only ever settable by an authenticated admin -- never
// by the employer/candidate request body (P8-hardened requireAdminFromRequest,
// same helper protecting the other ~80 admin routes).

import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { RECRUITING_ENGAGEMENT_STATES } from "./index";
import { calculateRecruitingFee } from "@/lib/recruiting/fee";

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const id = s(req.query.id as string);
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, error: "Invalid engagement id" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const col = db.collection("recruiting_engagements");
  const _id = new ObjectId(id);

  if (req.method === "GET") {
    const doc = await col.findOne({ _id });
    if (!doc) return res.status(404).json({ ok: false, error: "Not found" });
    return res
      .status(200)
      .json({ ok: true, engagement: { ...doc, _id: String(doc._id) } });
  }

  if (req.method === "PATCH") {
    const existing = await col.findOne({ _id });
    if (!existing)
      return res.status(404).json({ ok: false, error: "Not found" });

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const now = new Date();
    const update: Record<string, unknown> = { updatedAt: now };
    const historyEntry: Record<string, unknown> = {
      at: now,
      byAdminEmail: admin.email || null,
    };
    let statusChanged = false;

    const nextStatus = s(body.status);
    if (nextStatus) {
      if (
        !(RECRUITING_ENGAGEMENT_STATES as readonly string[]).includes(
          nextStatus,
        )
      ) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }
      update.status = nextStatus;
      historyEntry.status = nextStatus;
      statusChanged = true;

      // The placement/hire trigger is explicitly admin-confirmed here --
      // never self-declared by an employer request body (see the audit's
      // "candidate applied" / "interview occurred" must NOT recognize
      // revenue requirement).
      if (nextStatus === "placement_confirmed") {
        update.placementConfirmedAt = now;
        update.placementConfirmedByAdminEmail = admin.email || null;
      }
    }

    if (body.compensationBasisCents !== undefined) {
      const comp = Number(body.compensationBasisCents);
      if (!Number.isFinite(comp) || comp < 0) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid compensationBasisCents" });
      }
      const compCents = Math.round(comp);
      update.compensationBasisCents = compCents;
      update.calculatedStandardFeeCents = calculateRecruitingFee(compCents);
      // Only re-derive the agreed fee from the standard calc if the
      // admin has not already set a negotiated override for this
      // engagement -- an existing agreedFeeCents override is preserved.
      if (
        existing.agreedFeeCents === existing.calculatedStandardFeeCents ||
        existing.agreedFeeCents == null
      ) {
        update.agreedFeeCents = update.calculatedStandardFeeCents;
      }
    }

    if (body.agreedFeeCents !== undefined) {
      const fee = Number(body.agreedFeeCents);
      if (!Number.isFinite(fee) || fee < 0) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid agreedFeeCents" });
      }
      update.agreedFeeCents = Math.round(fee);
      historyEntry.agreedFeeCentsSetTo = update.agreedFeeCents;
    }

    if (body.notes !== undefined) {
      update.notes = s(body.notes).slice(0, 2000) || null;
    }

    if (Object.keys(update).length <= 1) {
      return res.status(400).json({ ok: false, error: "No changes provided" });
    }

    const updateOperators: Record<string, unknown> = { $set: update };
    if (statusChanged || body.agreedFeeCents !== undefined) {
      updateOperators.$push = { statusHistory: historyEntry };
    }
    await col.updateOne({ _id }, updateOperators as any);

    const updated = await col.findOne({ _id });
    return res.status(200).json({
      ok: true,
      engagement: { ...updated, _id: String(updated!._id) },
    });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
