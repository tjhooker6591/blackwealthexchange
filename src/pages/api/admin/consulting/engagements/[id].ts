// src/pages/api/admin/consulting/engagements/[id].ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Admin-only
// get/update for a single consulting engagement. agreedAmountCents is
// the sole source of truth for what a client owes -- it is set only by
// an authenticated admin here, never accepted from a client-facing
// request body. There is no universal percentage anywhere in this file.

import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { CONSULTING_ENGAGEMENT_STATES } from "./index";

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
  const col = db.collection("consulting_engagements");
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
        !(CONSULTING_ENGAGEMENT_STATES as readonly string[]).includes(
          nextStatus,
        )
      ) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }
      update.status = nextStatus;
      historyEntry.status = nextStatus;
      statusChanged = true;
    }

    if (body.agreedAmountCents !== undefined) {
      const amt = Number(body.agreedAmountCents);
      if (!Number.isFinite(amt) || amt < 0) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid agreedAmountCents" });
      }
      update.agreedAmountCents = Math.round(amt);
      historyEntry.agreedAmountCentsSetTo = update.agreedAmountCents;
    }

    if (body.pricingModel !== undefined) {
      update.pricingModel = s(body.pricingModel) || null;
    }

    if (body.notes !== undefined) {
      update.notes = s(body.notes).slice(0, 2000) || null;
    }

    if (Object.keys(update).length <= 1) {
      return res.status(400).json({ ok: false, error: "No changes provided" });
    }

    const updateOperators: Record<string, unknown> = { $set: update };
    if (statusChanged || body.agreedAmountCents !== undefined) {
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
