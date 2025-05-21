// src/pages/api/stripe/checkout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Initialize Stripe with correct API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

interface CheckoutPayload {
  userId: string; // ID of the buyer
  itemId: string; // MongoDB ObjectId _or_ slug of the product
  type: string;   // e.g. "ad" or other product type
  amount: number; // Purchase amount in dollars
  successUrl: string;
  cancelUrl: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("/api/stripe/checkout payload:", req.body);
  const { userId, itemId, type, amount, successUrl, cancelUrl } = req.body as CheckoutPayload;

  if (!userId || !itemId || !type || !amount || !successUrl || !cancelUrl) {
    console.error("Missing required fields:", { userId, itemId, type, amount, successUrl, cancelUrl });
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // slug-fallback lookup for products
    const product = await db.collection("products").findOne(
      ObjectId.isValid(itemId)
        ? { _id: new ObjectId(itemId) }
        : { slug: itemId }
    );

    if (!product?.sellerId) {
      console.error("Invalid product or missing seller:", itemId);
      return res.status(400).json({ error: "Invalid product or missing seller" });
    }

    // determine which Stripe account to credit
    let stripeAccountId: string;
    if (type === "ad") {
      // Ad purchases go to the platform account
      stripeAccountId = process.env.PLATFORM_STRIPE_ACCOUNT_ID!;
      if (!stripeAccountId) {
        console.error("Missing PLATFORM_STRIPE_ACCOUNT_ID");
        return res.status(500).json({ error: "Platform Stripe account not configured" });
      }
    } else {
      // Other products go to each seller’s account
      const seller = await db.collection("sellers").findOne({ userId: product.sellerId });
      if (!seller?.stripeAccountId) {
        console.error("Stripe account not found for seller:", product.sellerId);
        return res.status(400).json({ error: "Seller is not connected to Stripe" });
      }
      stripeAccountId = seller.stripeAccountId;
    }

    // Build the Checkout Session parameters
    // Build common parameters
    const commonParams: Omit<Stripe.Checkout.SessionCreateParams, 'payment_intent_data'> = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${type} purchase` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { userId, itemId, type },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    // Conditionally include transfer and application fee when not paying to platform itself
    const isPlatformAccount = stripeAccountId === process.env.PLATFORM_STRIPE_ACCOUNT_ID;
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ...commonParams,
      ...(isPlatformAccount
        ? {}
        : {
            payment_intent_data: {
              metadata: { userId, itemId, type },
              application_fee_amount: Math.round(amount * 0.12 * 100),
              transfer_data: { destination: stripeAccountId },
            },
          }),
    };

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe session creation failed:", err);
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err.message,
    });
  }
}
