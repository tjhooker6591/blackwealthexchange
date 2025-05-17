// src/pages/api/stripe/webhook-handler.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";

// only import the functions you actually have
import { getCampaignById, markCampaignPaid } from "@/lib/db/ads";
import { fulfillOrder } from "@/lib/db/orders";
import { grantCourseAccess } from "@/lib/db/courses";
import { recordAffiliateConversion } from "@/lib/db/affiliates";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface SessionMetadata {
  campaignId?: string;
  orderId?: string;
  courseId?: string;
  userId?: string;
  affiliateCode?: string;
}

export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Raw body + signature check
  const sig = req.headers["stripe-signature"]!;
  const buf = await buffer(req);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).end("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata as unknown as SessionMetadata;

    // 1) Advertising
    if (meta.campaignId) {
      try {
        const campaign = await getCampaignById(meta.campaignId);
        if (campaign && !campaign.paid) {
          await markCampaignPaid(
            meta.campaignId,
            session.payment_intent as string,
          );
          console.log(`✅ Campaign ${meta.campaignId} marked paid`);
        } else {
          console.log(`ℹ️ Campaign ${meta.campaignId} already paid; skipping`);
        }
      } catch (err) {
        console.error(`❌ Error marking campaign paid:`, err);
      }
    }

    // 2) Marketplace order
    if (meta.orderId) {
      try {
        await fulfillOrder(meta.orderId, session.payment_intent as string);
        console.log(`✅ Order ${meta.orderId} fulfilled`);
      } catch (err) {
        console.error(`❌ Error fulfilling order (or already fulfilled):`, err);
      }
    }

    // 3) Course purchase
    if (meta.courseId && meta.userId) {
      try {
        await grantCourseAccess(meta.userId, meta.courseId);
        console.log(
          `✅ Granted course ${meta.courseId} to user ${meta.userId}`,
        );
      } catch (err) {
        console.error(
          `❌ Error granting course access (or already granted):`,
          err,
        );
      }
    }

    // 4) Affiliate referral
    if (meta.affiliateCode) {
      try {
        await recordAffiliateConversion(
          meta.affiliateCode,
          session.amount_total || 0,
          session.id,
        );
        console.log(
          `✅ Recorded affiliate conversion for ${meta.affiliateCode}`,
        );
      } catch (err) {
        console.error(
          `❌ Error recording affiliate conversion (or duplicate):`,
          err,
        );
      }
    }
  } else {
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  // Always ack so Stripe won’t keep retrying on helper errors
  res.status(200).json({ received: true });
}
