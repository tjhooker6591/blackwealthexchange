import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";

// only import the functions you actually have
import { getCampaignById, markCampaignPaid } from "@/lib/db/ads";
import { fulfillOrder as dbFulfillOrder } from "@/lib/db/orders";
import { grantCourseAccess } from "@/lib/db/courses";
import { recordAffiliateConversion } from "@/lib/db/affiliates";
import clientPromise from "@/lib/mongodb";

// Disable the default body parser so we can verify Stripe signature with raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  // Read raw body to verify Stripe signature
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"]!;

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
    const client = await clientPromise;
    const _db = client.db("bwes-cluster"); // underscore prefix silences unused-var lint rule

    // 1) Advertising campaign checkout
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
      } catch (err: any) {
        console.error(`❌ Error marking campaign paid:`, err);
      }
    }

    // 2) Marketplace order checkout
    if (meta.orderId) {
      try {
        await dbFulfillOrder(meta.orderId, session.payment_intent as string);
        console.log(`✅ Order ${meta.orderId} fulfilled`);
      } catch (err: any) {
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
      } catch (err: any) {
        console.error(
          `❌ Error granting course access (or already granted):`,
          err,
        );
      }
    }

    // 4) Affiliate referral conversion
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
      } catch (err: any) {
        console.error(
          `❌ Error recording affiliate conversion (or duplicate):`,
          err,
        );
      }
    }
  } else {
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  // Acknowledge receipt so Stripe doesn’t retry
  res.status(200).json({ received: true });
}
