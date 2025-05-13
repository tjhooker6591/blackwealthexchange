import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";

// Initialize Stripe with the matching API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Define a strong type for the incoming request payload
interface CreateAccountLinkPayload {
  email: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { email } = req.body as CreateAccountLinkPayload;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Connect to MongoDB and retrieve seller record
    const client = await clientPromise;
    const db = client.db();

    // Step 1: Create the Stripe Express account
    const accountParams: Stripe.AccountCreateParams = {
      type: "express",
      country: "US",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    };
    const account = await stripe.accounts.create(accountParams);

    // Step 2: Save Stripe account ID in the seller record
    await db
      .collection("sellers")
      .updateOne({ email }, { $set: { stripeAccountId: account.id } });

    // Step 3: Create onboarding link
    const accountLinkParams: Stripe.AccountLinkCreateParams = {
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/become-a-seller`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace/add-product`,
      type: "account_onboarding",
    };
    const accountLink = await stripe.accountLinks.create(accountLinkParams);

    return res.status(200).json({ url: accountLink.url });
  } catch (err: any) {
    console.error("Stripe onboarding error:", err);
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err.message,
    });
  }
}

