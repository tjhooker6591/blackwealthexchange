// src/pages/api/recruiting/engagement/[id].ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Public, read-only,
// ID-keyed status endpoint -- the same trust model as a Stripe-hosted
// payment link or invoice URL (knowledge of the specific engagement id,
// a MongoDB ObjectId, is the access control; there is no authenticated
// employer account requirement in this MVP, matching section P's "do
// not build a customer dashboard"). Deliberately returns only the
// minimal fields a customer receiving a payment request needs to see --
// never internal admin notes, other engagements, sourceIntakeId,
// admin emails, or the raw compensation basis.

import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const id = s(req.query.id as string);
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, error: "Invalid engagement id" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const engagement = await db.collection("recruiting_engagements").findOne(
    { _id: new ObjectId(id) },
    {
      projection: {
        employerCompany: 1,
        role: 1,
        status: 1,
        paymentStatus: 1,
        agreedFeeCents: 1,
        stripeCheckoutUrl: 1 /* only returned to the client below when payment_due */,
        paidAt: 1,
      },
    },
  );

  if (!engagement) {
    return res.status(404).json({ ok: false, error: "Engagement not found" });
  }

  return res.status(200).json({
    ok: true,
    engagement: {
      id,
      service: "BWE Recruiting -- Standard Placement Fee",
      employerCompany: engagement.employerCompany || null,
      role: engagement.role || null,
      status: engagement.status || null,
      paymentStatus: engagement.paymentStatus || "not_applicable",
      agreedAmountCents:
        typeof engagement.agreedFeeCents === "number"
          ? engagement.agreedFeeCents
          : null,
      checkoutUrl:
        engagement.paymentStatus === "payment_due"
          ? engagement.stripeCheckoutUrl || null
          : null,
      paidAt: engagement.paidAt || null,
    },
  });
}
