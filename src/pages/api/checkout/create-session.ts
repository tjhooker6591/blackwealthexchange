// src/pages/api/checkout/create-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { calculateShipping, CartItem } from "@/lib/shipping";
import clientPromise from "@/lib/mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { productId, sellerId } = req.body;
    if (!productId || !sellerId) {
      return res.status(400).json({ error: "Missing productId or sellerId" });
    }

    // Fetch product & seller from the database
    const client = await clientPromise;
    const db = client.db();
    const product = await db.collection("products").findOne({ _id: productId });
    const seller = await db.collection("sellers").findOne({ _id: sellerId });

    if (!product || !seller?.stripeAccountId) {
      return res.status(404).json({ error: "Product or seller not found" });
    }

    // Pricing & commission
    const unitAmountCents = Math.round(product.price * 100);
    const commissionRate = 0.12; // 12%
    const applicationFee = Math.round(product.price * commissionRate * 100);

    // Prepare cart items for shipping calculation
    const cartItems: CartItem[] = [
      {
        id: productId,
        name: product.title,
        price: unitAmountCents,
        quantity: 1,
        weightOunces: product.weightOunces ?? 0,
      },
    ];
    const shippingCost = calculateShipping(cartItems);

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "us_bank_account"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: product.title },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCost, currency: "usd" },
            display_name: "Standard Shipping",
          },
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: seller.stripeAccountId,
        },
      },
      success_url: `${process.env.FRONTEND_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/orders/cancel`,
    });

    // Record the order in MongoDB for later webhook fulfillment
    await db.collection("orders").insertOne({
      sessionId: session.id,
      productId,
      sellerId,
      amount: unitAmountCents,
      shipping: shippingCost,
      applicationFee,
      paid: false,
      createdAt: new Date(),
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err.message,
    });
  }
}
