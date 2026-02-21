import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";

import { getCampaignById, markCampaignPaid } from "@/lib/db/ads";
import { fulfillOrder as dbFulfillOrder } from "@/lib/db/orders";
import { grantCourseAccess } from "@/lib/db/courses";
import { recordAffiliateConversion } from "@/lib/db/affiliates";
import clientPromise from "@/lib/mongodb";

export const config = {
  api: { bodyParser: false },
};

// Safer: omit apiVersion unless you KNOW it matches your Stripe dashboard setting.
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any, // keep if you're already using it; otherwise remove
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface SessionMetadata {
  // existing
  campaignId?: string;
  orderId?: string;
  courseId?: string;
  userId?: string;
  affiliateCode?: string;

  // your checkout.ts sends these:
  itemId?: string;
  type?: string; // "ad" | "product" | "plan" | etc

  // recommended additions (won't break if missing)
  durationDays?: string; // "14"
  businessId?: string; // which business listing to activate
}

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function parseDurationDays(v: unknown) {
  const n = Number(asString(v));
  if (!Number.isFinite(n) || n <= 0) return 14;
  // keep allowed durations tight
  if (![7, 14, 30, 60, 90].includes(n)) return 14;
  return n;
}

export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  if (!endpointSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET missing in env");
    return res.status(500).end("Webhook not configured");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    console.error("❌ Missing stripe-signature header");
    return res.status(400).end("Webhook Error");
  }

  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err?.message);
    return res.status(400).end("Webhook Error");
  }

  // Only handle the event(s) you rely on
  if (event.type !== "checkout.session.completed") {
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
    return res.status(200).json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = (session.metadata || {}) as unknown as SessionMetadata;

  const stripeSessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || "";

  const email = session.customer_details?.email || session.customer_email || "";

  const metaType = asString(meta.type);
  const metaItemId = asString(meta.itemId);
  const durationDays = parseDurationDays(meta.durationDays);
  const businessId = asString(meta.businessId);
  const userId = asString(meta.userId);

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // ✅ Always record/upgrade the payment in Mongo so Admin can reconcile
    // Idempotent upsert (Stripe can retry)
    await db.collection("payments").updateOne(
      { stripeSessionId },
      {
        $setOnInsert: {
          stripeSessionId,
          createdAt: new Date(),
        },
        $set: {
          status: "paid",
          paidAt: new Date(),
          paymentIntentId: paymentIntentId || null,
          email: email || null,
          // store useful context
          metadata: {
            ...meta,
            type: metaType || meta.type || null,
            itemId: metaItemId || meta.itemId || null,
            durationDays,
            businessId: businessId || null,
            userId: userId || null,
          },
        },
      },
      { upsert: true },
    );

    // 1) Advertising campaign checkout (your existing flow)
    if (meta.campaignId) {
      const campaignId = asString(meta.campaignId);
      const campaign = await getCampaignById(campaignId);
      if (campaign && !campaign.paid) {
        await markCampaignPaid(campaignId, paymentIntentId);
        console.log(`✅ Campaign ${campaignId} marked paid`);
      } else {
        console.log(
          `ℹ️ Campaign ${campaignId} already paid or missing; skipping`,
        );
      }
    }

    // ✅ 1b) Directory listing purchases (THIS fixes "paid but not in admin")
    // Triggered when your checkout.ts sets: metadata { type:"ad", itemId:"directory-standard|directory-featured", userId }
    if (
      metaType === "ad" &&
      (metaItemId === "directory-standard" ||
        metaItemId === "directory-featured")
    ) {
      const tier =
        metaItemId === "directory-featured" ? "featured" : "standard";
      const expiresAt = new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000,
      );

      // If businessId wasn't passed, still record it so you can fix it in Admin ("needs_attention")
      const needsAttention = !businessId;

      await db.collection("directory_listings").updateOne(
        { stripeSessionId },
        {
          $setOnInsert: {
            stripeSessionId,
            createdAt: new Date(),
          },
          $set: {
            status: "active",
            tier,
            durationDays,
            expiresAt,
            userId: userId || null,
            email: email || null,
            businessId: businessId || null,
            needsAttention,
            paidAt: new Date(),
            paymentIntentId: paymentIntentId || null,
          },
        },
        { upsert: true },
      );

      console.log(
        `✅ Directory listing activated (${tier}) session=${stripeSessionId} businessId=${businessId || "MISSING"}`,
      );
    }

    // 2) Marketplace order checkout (existing)
    if (meta.orderId) {
      await dbFulfillOrder(asString(meta.orderId), paymentIntentId);
      console.log(`✅ Order ${meta.orderId} fulfilled`);
    }

    // 3) Course purchase (existing)
    if (meta.courseId && meta.userId) {
      await grantCourseAccess(asString(meta.userId), asString(meta.courseId));
      console.log(`✅ Granted course ${meta.courseId} to user ${meta.userId}`);
    }

    // 4) Affiliate referral conversion (existing)
    if (meta.affiliateCode) {
      await recordAffiliateConversion(
        asString(meta.affiliateCode),
        session.amount_total || 0,
        stripeSessionId,
      );
      console.log(`✅ Recorded affiliate conversion for ${meta.affiliateCode}`);
    }

    // Acknowledge receipt so Stripe doesn’t retry
    return res.status(200).json({ received: true });
  } catch (err: any) {
    // Return 500 so Stripe retries (important for revenue-critical fulfillment)
    console.error("❌ Webhook fulfillment failed:", err?.message || err);
    return res.status(500).end("Webhook fulfillment failed");
  }
}
