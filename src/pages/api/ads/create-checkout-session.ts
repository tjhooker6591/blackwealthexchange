// src/pages/api/ads/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getCampaignById } from "../../../lib/db/ads";
import clientPromise from "@/lib/mongodb";
import { getAppUrl, getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // match your installed @stripe/stripe-node types
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe is not configured" });
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
    return res.status(429).json({ error: "Too many checkout attempts" });
  }

  try {
    const campaignId =
      typeof req.body?.campaignId === "string"
        ? req.body.campaignId.trim()
        : "";
    if (!campaignId)
      return res.status(400).json({ error: "Missing campaignId" });

    const campaign = await getCampaignById(campaignId);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    const amountCents = Math.round(Number(campaign.price || 0) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: "Invalid campaign price" });
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
      metadata: { campaignId },
      success_url: `${appUrl}/ads/${campaignId}?status=success`,
      cancel_url: `${appUrl}/ads/${campaignId}?status=cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("ads checkout session error", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
