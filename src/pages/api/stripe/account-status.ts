// pages/api/stripe/account-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // ← import ObjectId

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { sellerId } = req.query;
    if (!sellerId || typeof sellerId !== "string") {
      return res.status(400).json({ error: "Missing or invalid sellerId" });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Cast the string sellerId to an ObjectId for the query
    const seller = await db
      .collection("sellers")
      .findOne({ _id: new ObjectId(sellerId) });

    if (!seller?.stripeAccountId) {
      return res
        .status(404)
        .json({ error: "No Stripe account found for this seller" });
    }

    // Retrieve the Stripe Account object
    const account = await stripe.accounts.retrieve(seller.stripeAccountId);
    return res.status(200).json(account);
  } catch (err: any) {
    console.error("Error fetching Stripe account status:", err);
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err.message,
    });
  }
}
