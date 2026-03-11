import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { getAppUrl, getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecret || "sk_missing", {
  apiVersion: "2025-02-24.acacia" as any,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  if (!stripeSecret) {
    return res.status(500).json({ error: "Stripe is not configured." });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  await ensureApiRateLimitIndexes(db);
  const ip = getClientIp(req);
  const ipLimit = await hitApiRateLimit(db, `checkout:ads:ip:${ip}`, 20, 10);
  if (ipLimit.blocked) {
    res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
    return res
      .status(429)
      .json({ error: "Too many checkout attempts. Please try again shortly." });
  }

  const { adType, email, businessId, duration = 7 } = req.body || {};

  const priceMap: Record<string, { amount: number; tier: string }> = {
    "Featured Sponsor": { amount: 5000, tier: "top" },
    "Business Directory": { amount: 3000, tier: "standard" },
    "Banner Ads": { amount: 4000, tier: "standard" },
    "Custom Solutions": { amount: 10000, tier: "custom" },
  };

  const adTypeText = typeof adType === "string" ? adType.trim() : "";
  const emailText = typeof email === "string" ? email.trim().toLowerCase() : "";
  const durationNum = Number(duration);

  const pricing = priceMap[adTypeText];
  if (!pricing) {
    return res.status(400).json({ error: "Invalid ad type selected." });
  }

  if (!emailText || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailText)) {
    return res.status(400).json({ error: "Valid email is required." });
  }

  if (!Number.isFinite(durationNum) || durationNum <= 0 || durationNum > 365) {
    return res.status(400).json({ error: "Invalid duration value." });
  }

  try {
    const origin = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: pricing.amount,
            product_data: {
              name: adTypeText,
              description: `Advertising Package: ${adTypeText}`,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: emailText,
      metadata: {
        businessId: typeof businessId === "string" ? businessId : "",
        tier: pricing.tier,
        duration: String(Math.round(durationNum)),
        adType: adTypeText,
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/advertise-form`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong creating the checkout session." });
  }
}
