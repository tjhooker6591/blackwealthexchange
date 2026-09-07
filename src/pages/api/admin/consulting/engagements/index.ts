// src/pages/api/admin/consulting/engagements/index.ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Admin-only list +
// create for consulting_engagements. This is a genuinely new
// collection/concept, distinct from the pre-existing consulting_intake /
// consulting_interest collections, which -- despite their names -- are
// actually the platform's existing RECRUITING lead-capture system (an
// employer requesting talent, or a candidate requesting a job; the
// "Request Managed Recruiting Support" copy on
// src/pages/dashboard/employer/consulting-interest.tsx confirms this).
// consulting_engagements is BWE offering its OWN advisory/implementation
// services to a client, priced per engagement -- no universal
// percentage, unlike recruiting's 15% standard.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export const CONSULTING_ENGAGEMENT_STATES = [
  "new",
  "contacted",
  "proposal_agreed",
  "payment_due",
  "paid",
  "in_progress",
  "completed",
  "cancelled",
] as const;

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

async function ensureIndexes(db: any) {
  await db
    .collection("consulting_engagements")
    .createIndex({ createdAt: -1 })
    .catch(() => null);
  await db
    .collection("consulting_engagements")
    .createIndex({ status: 1, createdAt: -1 })
    .catch(() => null);
  await db
    .collection("consulting_engagements")
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
  const col = db.collection("consulting_engagements");

  if (req.method === "GET") {
    const status = s(req.query.status as string);
    const filter: Record<string, unknown> = {};
    if (
      status &&
      (CONSULTING_ENGAGEMENT_STATES as readonly string[]).includes(status)
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

    const clientCompany = s(body.clientCompany);
    const contactName = s(body.contactName);
    const contactEmail = s(body.contactEmail).toLowerCase();
    const serviceTitle = s(body.serviceTitle);

    if (!clientCompany || !contactName || !contactEmail || !serviceTitle) {
      return res.status(400).json({
        ok: false,
        error:
          "clientCompany, contactName, contactEmail, and serviceTitle are required",
      });
    }

    const now = new Date();
    const doc = {
      clientCompany,
      contactName,
      contactEmail,
      contactPhone: s(body.contactPhone) || null,
      serviceTitle,
      scope: s(body.scope).slice(0, 4000) || null,
      timeframe: s(body.timeframe) || null,
      budgetIndication: s(body.budgetIndication) || null,
      notes: s(body.notes).slice(0, 2000) || null,

      sourceIntakeId: s(body.sourceIntakeId) || null,

      status: "new" as (typeof CONSULTING_ENGAGEMENT_STATES)[number],

      // Engagement-specific price only -- no universal percentage is
      // ever applied here. Set by admin once terms are agreed.
      agreedAmountCents: null as number | null,
      pricingModel: s(body.pricingModel) || null, // e.g. "fixed", "hourly", "milestone", "retainer" -- descriptive only in this MVP

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
