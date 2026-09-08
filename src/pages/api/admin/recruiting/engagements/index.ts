// src/pages/api/admin/recruiting/engagements/index.ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Admin-only list +
// create for recruiting_engagements -- the commercial layer that did not
// exist before this MVP (existing employer/talent intake --
// consulting_intake, consulting_interest, employer_consultant_pipeline
// -- had no engagement/fee/payment record at all). This does not
// replace that intake; an engagement may optionally reference the
// intake record it originated from via sourceIntakeId.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  calculateRecruitingFee,
  RECRUITING_STANDARD_FEE_PERCENT,
} from "@/lib/recruiting/fee";

export const RECRUITING_ENGAGEMENT_STATES = [
  "new",
  "contacted",
  "engaged",
  "placement_confirmed",
  "payment_due",
  "paid",
  "closed",
  "cancelled",
] as const;

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

async function ensureIndexes(db: any) {
  await db
    .collection("recruiting_engagements")
    .createIndex({ createdAt: -1 })
    .catch(() => null);
  await db
    .collection("recruiting_engagements")
    .createIndex({ status: 1, createdAt: -1 })
    .catch(() => null);
  await db
    .collection("recruiting_engagements")
    .createIndex({ contactEmail: 1 })
    .catch(() => null);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureIndexes(db);
  const col = db.collection("recruiting_engagements");

  if (req.method === "GET") {
    const status = s(req.query.status as string);
    const filter: Record<string, unknown> = {};
    if (
      status &&
      (RECRUITING_ENGAGEMENT_STATES as readonly string[]).includes(status)
    ) {
      filter.status = status;
    }
    const rows = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    return res.status(200).json({
      ok: true,
      engagements: rows.map((r: any) => ({ ...r, _id: String(r._id) })),
    });
  }

  if (req.method === "POST") {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const employerCompany = s(body.employerCompany);
    const contactName = s(body.contactName);
    const contactEmail = s(body.contactEmail).toLowerCase();
    const role = s(body.role);

    if (!employerCompany || !contactName || !contactEmail || !role) {
      return res.status(400).json({
        ok: false,
        error:
          "employerCompany, contactName, contactEmail, and role are required",
      });
    }

    const compensationBasisCents =
      Number.isFinite(Number(body.compensationBasisCents)) &&
      Number(body.compensationBasisCents) > 0
        ? Math.round(Number(body.compensationBasisCents))
        : null;

    const calculatedStandardFeeCents = compensationBasisCents
      ? calculateRecruitingFee(compensationBasisCents)
      : null;

    const now = new Date();
    const doc = {
      employerCompany,
      contactName,
      contactEmail,
      contactPhone: s(body.contactPhone) || null,
      role,
      location: s(body.location) || null,
      hiringTimeframe: s(body.hiringTimeframe) || null,
      notes: s(body.notes).slice(0, 2000) || null,

      sourceIntakeId: s(body.sourceIntakeId) || null,
      relatedJobId: s(body.relatedJobId) || null,

      status: "new" as (typeof RECRUITING_ENGAGEMENT_STATES)[number],

      compensationBasisCents,
      standardFeePercent: RECRUITING_STANDARD_FEE_PERCENT,
      calculatedStandardFeeCents,
      // Admin-confirmed final invoice amount. Defaults to the standard
      // 15% calculation but can be overridden by the admin if the
      // engagement has negotiated terms -- see [id].ts PATCH.
      agreedFeeCents: calculatedStandardFeeCents,

      paymentStatus: "not_applicable" as
        | "not_applicable"
        | "payment_due"
        | "paid",
      stripeSessionId: null as string | null,
      stripeCheckoutUrl: null as string | null,
      paidAt: null as Date | null,

      createdAt: now,
      updatedAt: now,
      createdByAdminEmail: admin.email || null,
      statusHistory: [
        {
          status: "new",
          at: now,
          byAdminEmail: admin.email || null,
        },
      ],
    };

    const result = await col.insertOne(doc);
    return res.status(201).json({
      ok: true,
      engagementId: String(result.insertedId),
      engagement: { ...doc, _id: String(result.insertedId) },
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
