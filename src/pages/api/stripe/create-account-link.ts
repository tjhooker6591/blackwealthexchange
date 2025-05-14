import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

interface CreateAccountLinkPayload {
  email: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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
    const client = await clientPromise;
    const db = client.db();
    const sellers = db.collection("sellers");

    // 1) Find (or create) your seller record
    const seller = await sellers.findOne({ email });
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    let stripeAccountId = seller.stripeAccountId;
    // 2) If they don’t yet have a Stripe account, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;
      await sellers.updateOne({ email }, { $set: { stripeAccountId } });
    }

    // 3) Decide which link type to use:
    //    - account_onboarding for first-time setup
    //    - account_update for adding/updating bank or debit card info later
    const linkType: Stripe.AccountLinkCreateParams.Type =
      seller.stripeAccountId == null ? "account_onboarding" : "account_update";

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/become-a-seller`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace/add-product`,
      type: linkType,
    });

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
