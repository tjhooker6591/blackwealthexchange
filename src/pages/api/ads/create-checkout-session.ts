// src/pages/api/ads/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { getCampaignById } from "../../../lib/db/ads";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // match your installed @stripe/stripe-node types
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { campaignId } = req.body;
  const campaign = await getCampaignById(campaignId);
  if (!campaign) return res.status(404).end();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: campaign.name },
          unit_amount: campaign.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: { campaignId },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/ads/${campaignId}?status=success`,
    cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/ads/${campaignId}?status=cancelled`,
  });

  res.status(200).json({ url: session.url });
}


