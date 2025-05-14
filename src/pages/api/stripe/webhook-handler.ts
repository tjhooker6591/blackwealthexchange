// src/pages/api/stripe/webhook-handler.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const config = {
  api: { bodyParser: false },
};

// Initialize Stripe with the matching API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Strongly type the expected metadata on checkout.session.completed
interface SessionMetadata {
  userId: string;
  itemId: string;
  type: string;
  amount: string;
}

export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"] as string;
  const buf = await buffer(req);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(
      "⚠️ Stripe webhook signature verification failed:",
      err.message,
    );
    return res.status(400).end("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (!session.metadata) {
      console.warn("⚠️ Missing metadata in session:", session.id);
      return res.status(400).end("Missing metadata in session");
    }
    // Cast metadata to our interface
    const metadata = session.metadata as unknown as SessionMetadata;

    const { userId, itemId, type, amount } = metadata;
    if (!userId || !itemId || !type || !amount) {
      console.warn("⚠️ Incomplete metadata in session:", session.id);
      return res.status(400).end("Missing metadata in session");
    }

    try {
      const client = await clientPromise;
      const db = client.db();

      // Record the order in your DB
      await db.collection("orders").insertOne({
        userId,
        itemId,
        type,
        amount: parseFloat(amount),
        stripeSessionId: session.id,
        status: "paid",
        createdAt: new Date(),
      });

      // Upgrade to premium if it's a course purchase
      if (type === "course") {
        await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(userId) },
            { $set: { isPremium: true } },
          );
      }

      console.log(`✅ Order processed: user=${userId}, item=${itemId}`);
    } catch (err: any) {
      console.error("❌ Failed to process Stripe webhook:", err.message);
      return res.status(500).end("Internal Server Error");
    }
  } else {
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}
