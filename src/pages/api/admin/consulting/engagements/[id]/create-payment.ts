// src/pages/api/admin/consulting/engagements/[id]/create-payment.ts
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Admin-only:
// creates a real Stripe Checkout Session for a consulting engagement's
// agreed amount. The amount is read exclusively from the server-side
// engagement record (agreedAmountCents) -- the accepted engagement is
// the source of truth, never a client-supplied final price. No
// seller/Connect destination (100% BWE revenue once invoiced, no
// automatic consultant/subcontractor payout in this MVP, per
// src/lib/payments/revenue.ts).

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { requireStripeSecretKey } from "@/lib/stripeSecret";
import { buildCheckoutIdempotencyKey } from "@/lib/checkout/idempotency";

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function getOrigin(req: NextApiRequest) {
  const origin = req.headers.origin as string | undefined;
  if (origin) return origin;
  const host = req.headers.host;
  return host ? `https://${host}` : "https://www.blackwealthexchange.com";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const id = s(req.query.id as string);
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, error: "Invalid engagement id" });
  }

  let stripeSecret: string;
  try {
    stripeSecret = requireStripeSecretKey();
  } catch {
    return res
      .status(500)
      .json({ ok: false, error: "Stripe is not configured" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const col = db.collection("consulting_engagements");
  const _id = new ObjectId(id);
  const engagement = await col.findOne({ _id });

  if (!engagement) {
    return res.status(404).json({ ok: false, error: "Engagement not found" });
  }

  const agreedAmountCents = Number(engagement.agreedAmountCents);
  if (!Number.isFinite(agreedAmountCents) || agreedAmountCents <= 0) {
    return res.status(400).json({
      ok: false,
      error:
        "This engagement has no agreed amount set yet. Set agreedAmountCents before creating a payment request.",
    });
  }

  const stripe = new Stripe(stripeSecret);
  const origin = getOrigin(req);
  const engagementId = String(_id);

  const fingerprint = [
    "consulting",
    engagementId,
    String(agreedAmountCents),
  ].join("|");

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `BWE Consulting -- ${engagement.serviceTitle || "Engagement"} (${engagement.clientCompany || "client"})`,
              },
              unit_amount: Math.round(agreedAmountCents),
            },
            quantity: 1,
          },
        ],
        ...(engagement.contactEmail
          ? { customer_email: String(engagement.contactEmail) }
          : {}),
        success_url: `${origin}/consulting/engagement/${engagementId}?paid=1`,
        cancel_url: `${origin}/consulting/engagement/${engagementId}`,
        metadata: {
          type: "consulting",
          engagementId,
        },
        payment_intent_data: {
          metadata: {
            type: "consulting",
            engagementId,
          },
        },
      },
      {
        idempotencyKey: buildCheckoutIdempotencyKey(
          fingerprint,
          "consulting-engagement-payment",
        ),
      },
    );

    await col.updateOne({ _id }, {
      $set: {
        status: "payment_due",
        paymentStatus: "payment_due",
        stripeSessionId: session.id,
        stripeCheckoutUrl: session.url || null,
        updatedAt: new Date(),
      },
      $push: {
        statusHistory: {
          status: "payment_due",
          at: new Date(),
          byAdminEmail: admin.email || null,
          note: "Stripe checkout session created",
        },
      },
    } as any);

    return res.status(200).json({
      ok: true,
      checkoutUrl: session.url,
      stripeSessionId: session.id,
    });
  } catch (err: any) {
    console.error("[admin/consulting/create-payment] Stripe error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to create Stripe checkout session",
    });
  }
}
