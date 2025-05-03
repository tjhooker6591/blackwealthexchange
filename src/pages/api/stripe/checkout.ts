import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string); // No apiVersion to avoid type conflict

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
    // 🔍 Connect to the DB and find the seller's Stripe account
    const client = await clientPromise;
    const db = client.db();
    const seller = await db.collection("sellers").findOne({ userId });

    if (!seller || !seller.stripeAccountId) {
      console.warn("Stripe account not found for seller:", userId);
      return res
        .status(400)
        .json({ error: "Seller is not connected to Stripe" });
    }

    const stripeAccountId = seller.stripeAccountId;

    // 💳 Create checkout session
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
            unit_amount: Math.round(amount * 100), // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(amount * 100 * 0.1), // 10% platform fee
        transfer_data: {
          destination: stripeAccountId, // 💸 Payout to seller
        },
      },
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
      console.error("❌ Stripe session creation failed:", error.message);
    } else {
      console.error("❌ Stripe session creation failed:", error);
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
