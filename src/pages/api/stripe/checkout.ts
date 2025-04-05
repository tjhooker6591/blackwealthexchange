// /pages/api/stripe/checkout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId, itemId, type, amount, successUrl, cancelUrl } = req.body as {
    userId: string;
    itemId: string;
    type: string;
    amount: number;
    successUrl: string;
    cancelUrl: string;
  };

  if (!userId || !itemId || !type || !amount || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${type} purchase`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        itemId,
        type,
        amount: amount.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Stripe session creation failed:", error.message);
    } else {
      console.error("Stripe session creation failed:", error);
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
