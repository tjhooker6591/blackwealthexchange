// src/pages/api/consulting/engagement/[id].ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Public, read-only,
// ID-keyed status endpoint -- same trust/scope model as
// src/pages/api/recruiting/engagement/[id].ts. Minimal fields only.

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
  const engagement = await db.collection("consulting_engagements").findOne(
    { _id: new ObjectId(id) },
    {
      projection: {
        clientCompany: 1,
        serviceTitle: 1,
        status: 1,
        paymentStatus: 1,
        agreedAmountCents: 1,
        stripeCheckoutUrl: 1,
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
      service: engagement.serviceTitle
        ? `BWE Consulting -- ${engagement.serviceTitle}`
        : "BWE Consulting",
      clientCompany: engagement.clientCompany || null,
      status: engagement.status || null,
      paymentStatus: engagement.paymentStatus || "not_applicable",
      agreedAmountCents:
        typeof engagement.agreedAmountCents === "number"
          ? engagement.agreedAmountCents
          : null,
      checkoutUrl:
        engagement.paymentStatus === "payment_due"
          ? engagement.stripeCheckoutUrl || null
          : null,
      paidAt: engagement.paidAt || null,
    },
  });
}
