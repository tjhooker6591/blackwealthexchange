import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { getAppUrl, getMongoDbName } from "@/lib/env";
import { getStripeSecretKey } from "@/lib/stripeSecret";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

const stripeSecret = getStripeSecretKey();
const stripe = new Stripe(stripeSecret || "sk_missing", {
  apiVersion: "2025-02-24.acacia" as any,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
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
    "featured-sponsor": { amount: 5000, tier: "top" },
    "directory-standard": { amount: 3000, tier: "standard" },
    "banner-ad": { amount: 4000, tier: "standard" },
    "sponsored-listing": { amount: 10000, tier: "custom" },
  };

  const adTypeRaw = typeof adType === "string" ? adType.trim() : "";
  const adTypeAliases: Record<string, string> = {
    "featured sponsor": "featured-sponsor",
    "featured-sponsor-ad": "featured-sponsor",
    "business directory": "directory-standard",
    "banner ads": "banner-ad",
    "custom solutions": "sponsored-listing",
  };
  const adTypeKey = adTypeAliases[adTypeRaw.toLowerCase()] || adTypeRaw;
  const adTypeText = adTypeKey;
  const emailText = typeof email === "string" ? email.trim().toLowerCase() : "";
  const durationNum = Number(duration);

  const pricing = priceMap[adTypeKey];
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
        adType: adTypeRaw,
        itemId: adTypeKey,
        type: "ad",
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/advertise-form`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe session error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong creating the checkout session." });
  }
}
