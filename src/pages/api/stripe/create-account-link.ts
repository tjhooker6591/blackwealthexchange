import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // No apiVersion to avoid TS error

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const client = await clientPromise;
    const db = client.db();

    // Step 1: Create the Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Step 2: Save Stripe account ID in the seller record
    await db.collection("sellers").updateOne(
      { email },
      { $set: { stripeAccountId: account.id } }
    );

    // Step 3: Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/become-a-seller`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace/add-product`,
      type: "account_onboarding",
    });

    res.status(200).json({ url: accountLink.url });
  } catch (err: any) {
    console.error("Stripe onboarding error:", err);
    res.status(500).json({ error: err.message });
  }
}
