import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

// Initialize Stripe with correct API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

interface CheckoutPayload {
  userId?: string;
  itemId: string;
  type: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log("📦 cookies on checkout request:", req.headers.cookie);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Log the raw payload
  console.log("/api/stripe/checkout payload:", req.body);
  const payload = req.body as CheckoutPayload;

  // Authenticate with custom JWT session cookie (not NextAuth)
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  let sessionUserId: string;

  if (token) {
    try {
      const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
      if (!SECRET) {
        throw new Error("JWT_SECRET is not set in environment variables");
      }
      const decoded = jwt.verify(token, SECRET as string);
      sessionUserId = (decoded as any).userId;
      console.log("Decoded JWT in stripe checkout:", decoded);
    } catch (err) {
      console.error("JWT decode error:", err);
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else if (
    process.env.NODE_ENV !== "production" &&
    typeof payload.userId === "string"
  ) {
    // Dev fallback: use payload.userId if provided (manual testing)
    sessionUserId = payload.userId;
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Destructure and validate fields
  const { itemId, type, amount, successUrl, cancelUrl } = payload;
  if (
    typeof itemId !== "string" ||
    typeof type !== "string" ||
    typeof amount !== "number" ||
    typeof successUrl !== "string" ||
    typeof cancelUrl !== "string"
  ) {
    console.error("Invalid request payload:", payload);
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Lookup product by ObjectId or slug
    const product = await db
      .collection("products")
      .findOne(
        ObjectId.isValid(itemId)
          ? { _id: new ObjectId(itemId) }
          : { slug: itemId },
      );
    if (!product?.sellerId) {
      console.error("Invalid product or missing seller:", itemId);
      return res
        .status(400)
        .json({ error: "Invalid product or missing seller" });
    }

    // Determine Stripe account destination
    const isAd = type === "ad";
    let stripeAccountId: string;
    if (isAd) {
      stripeAccountId = process.env.PLATFORM_STRIPE_ACCOUNT_ID as string;
      if (!stripeAccountId) {
        console.error("Missing PLATFORM_STRIPE_ACCOUNT_ID");
        return res
          .status(500)
          .json({ error: "Platform Stripe account not configured" });
      }
    } else {
      const seller = await db
        .collection("sellers")
        .findOne({ userId: product.sellerId });
      if (!seller?.stripeAccountId) {
        console.error("Stripe account not found for seller:", product.sellerId);
        return res
          .status(400)
          .json({ error: "Seller is not connected to Stripe" });
      }
      stripeAccountId = seller.stripeAccountId;
    }

    // Convert dollar amount to cents
    const unitAmount = Math.round(amount * 100);

    // Build common session parameters
    const commonParams: Omit<
      Stripe.Checkout.SessionCreateParams,
      "payment_intent_data"
    > = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: product.name || `${type} purchase` },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: { userId: sessionUserId, itemId, type },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    const isPlatformAccount =
      stripeAccountId === process.env.PLATFORM_STRIPE_ACCOUNT_ID;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ...commonParams,
      ...(isPlatformAccount
        ? {}
        : {
            payment_intent_data: {
              metadata: { userId: sessionUserId, itemId, type },
              application_fee_amount: Math.round(unitAmount * 0.12),
              transfer_data: { destination: stripeAccountId },
            },
          }),
    };

    // Create the Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    return res
      .status(200)
      .json({ sessionId: stripeSession.id, url: stripeSession.url });
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
