import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Initialize Stripe with the matching API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

// Strongly typed request payload
interface CheckoutPayload {
  userId: string; // ID of the buyer
  itemId: string; // MongoDB ObjectId of the product
  type: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Debug: log incoming payload
  console.log("/api/stripe/checkout payload:", req.body);

  const { userId, itemId, type, amount, successUrl, cancelUrl } =
    req.body as CheckoutPayload;

  // Validate required fields
  if (!userId || !itemId || !type || !amount || !successUrl || !cancelUrl) {
    console.error("Missing required fields:", {
      userId,
      itemId,
      type,
      amount,
      successUrl,
      cancelUrl,
    });
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Lookup product to find sellerId
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(itemId) });

    if (!product?.sellerId) {
      console.error("Invalid product or missing seller:", itemId);
      return res
        .status(400)
        .json({ error: "Invalid product or missing seller" });
    }

    // Lookup seller's Stripe account ID
    const seller = await db
      .collection("sellers")
      .findOne({ userId: product.sellerId });

    if (!seller?.stripeAccountId) {
      console.error("Stripe account not found for seller:", product.sellerId);
      return res
        .status(400)
        .json({ error: "Seller is not connected to Stripe" });
    }

    const stripeAccountId = seller.stripeAccountId;

    // Build Checkout session parameters
    const sessionParams: any = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${type} purchase` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(amount * 100 * 0.1),
        transfer_data: { destination: stripeAccountId },
      },
      metadata: { userId, itemId, type, amount: amount.toString() },
      success_url: successUrl,
      cancel_url: cancelUrl,
      transfer_group: `ORDER_${itemId}`,
    };

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
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
