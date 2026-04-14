// src/pages/api/ads/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getCampaignById } from "../../../lib/db/ads";
import clientPromise from "@/lib/mongodb";
import { getAppUrl, getMongoDbName } from "@/lib/env";
import { getStripeSecretKey } from "@/lib/stripeSecret";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

type ApiResponse =
  | {
      ok: true;
      url: string;
      sessionId: string;
      campaignId: string;
      amountCents: number;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

function safeJsonBody(body: unknown): Record<string, any> {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body === "object") return body as Record<string, any>;
  return {};
}

const stripeSecret = getStripeSecretKey();
const stripe = new Stripe(stripeSecret || "sk_missing", {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  if (!stripeSecret) {
    return res.status(500).json({
      ok: false,
      code: "STRIPE_NOT_CONFIGURED",
      message: "Checkout is temporarily unavailable",
    });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureApiRateLimitIndexes(db);

  const ip = getClientIp(req);
  const ipLimit = await hitApiRateLimit(
    db,
    `checkout:campaign:ip:${ip}`,
    25,
    10,
  );
  if (ipLimit.blocked) {
    res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
    return res.status(429).json({
      ok: false,
      code: "RATE_LIMITED",
      message: "Too many checkout attempts. Please try again shortly.",
    });
  }

  try {
    const body = safeJsonBody(req.body);
    const campaignId =
      typeof body.campaignId === "string" ? body.campaignId.trim() : "";

    if (!campaignId) {
      return res.status(400).json({
        ok: false,
        code: "CAMPAIGN_ID_REQUIRED",
        message: "Missing campaignId",
      });
    }

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        ok: false,
        code: "CAMPAIGN_NOT_FOUND",
        message: "Campaign not found",
      });
    }

    const amountCents = Math.round(Number(campaign.price || 0) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({
        ok: false,
        code: "INVALID_CAMPAIGN_PRICE",
        message: "Invalid campaign price",
      });
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: String(campaign.name || "Campaign") },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        type: "ad",
        campaignId,
      },
      success_url: `${appUrl}/ads/${campaignId}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/ads/${campaignId}?status=cancelled`,
    });

    if (!session.url) {
      return res.status(500).json({
        ok: false,
        code: "CHECKOUT_URL_MISSING",
        message: "Checkout session is unavailable",
      });
    }

    return res.status(200).json({
      ok: true,
      url: session.url,
      sessionId: session.id,
      campaignId,
      amountCents,
    });
  } catch (error) {
    console.error("ads checkout session error", error);
    return res.status(500).json({
      ok: false,
      code: "CHECKOUT_CREATE_FAILED",
      message: "Failed to create checkout session",
    });
  }
}
