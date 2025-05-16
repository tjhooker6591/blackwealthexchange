// src/pages/api/stripe/webhook-handler.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Metadata may include any one (or more) of these properties:
interface SessionMetadata {
  // advertising
  campaignId?: string;
  // marketplace
  orderId?: string;
  // courses
  courseId?: string;
  userId?: string;
  // affiliates
  affiliateCode?: string;
}

export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"] as string;
  const buf = await buffer(req);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).end("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata as unknown as SessionMetadata;

    const client = await clientPromise;
    const db = client.db();

    // 1) Advertising: campaign checkout
    if (meta.campaignId) {
      await db.collection("advertisingCampaigns").updateOne(
        { _id: new ObjectId(meta.campaignId) },
        { $set: { status: "paid", paymentIntentId: session.payment_intent } }
      );
      console.log(`✅ Campaign ${meta.campaignId} marked paid`);
    }

    // 2) Marketplace order
    if (meta.orderId) {
      // mark order paid
      await db.collection("orders").updateOne(
        { _id: new ObjectId(meta.orderId) },
        { $set: { status: "paid", paymentIntent: session.payment_intent } }
      );
      // optionally send a receipt email here
      console.log(`✅ Order ${meta.orderId} fulfilled`);
    }

    // 3) Course purchase
    if (meta.courseId && meta.userId) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(meta.userId) },
        { $addToSet: { purchasedCourses: meta.courseId } }
      );
      console.log(`✅ Granted course ${meta.courseId} to user ${meta.userId}`);
    }

    // 4) Affiliate referral
    if (meta.affiliateCode) {
      await db.collection("affiliateConversions").insertOne({
        affiliateCode: meta.affiliateCode,
        amount: session.amount_total,
        sessionId: session.id,
        date: new Date(),
      });
      console.log(`✅ Recorded affiliate conversion for ${meta.affiliateCode}`);
    }
  } else {
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}
