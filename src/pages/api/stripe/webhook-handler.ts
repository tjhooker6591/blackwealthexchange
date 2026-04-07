// src/pages/api/stripe/webhook-handler.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";

import { getCampaignById, markCampaignPaid } from "@/lib/db/ads";
import { fulfillOrder as dbFulfillOrder } from "@/lib/db/orders";
import { grantCourseAccess } from "@/lib/db/courses";
import { recordAffiliateConversion } from "@/lib/db/affiliates";
import clientPromise from "@/lib/mongodb";
import { Db, ObjectId } from "mongodb";
import {
  reserveFeaturedSponsorWeeks,
  weekStartUtc,
} from "@/lib/advertising/sponsorSchedule";

export const config = {
  api: { bodyParser: false },
};

// Keep apiVersion only if this matches your Stripe project version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface SessionMetadata {
  // existing flows
  campaignId?: string;
  orderId?: string;
  courseId?: string;
  userId?: string;
  affiliateCode?: string;

  // checkout.ts / api/stripe/checkout.ts metadata
  itemId?: string;
  option?: string; // admin advertising checkout uses option as the ad sku
  type?: string; // "ad" | "product" | "plan" | "advertising" (legacy)
  durationDays?: string | number; // "7" | "14" | "30" etc (or number)
  businessId?: string | null;
  placement?: string;
  campaignIdFallback?: string;
  jobId?: string;

  // Wealth Builder Premium / newer plan metadata
  productKey?: string;
  tier?: string;
  billingInterval?: string;

  // optional debug fields
  checkoutFingerprint?: string;
  rawType?: string;
  rawItemId?: string;
}

interface PaymentDocLike {
  _id?: unknown;
  stripeSessionId?: string;
  paymentIntentId?: string | null;
  userId?: string | null;
  email?: string | null;
  type?: string | null;
  itemId?: string | null;
  amountCents?: number | null;
  status?: string | null;
  createdAt?: Date | string | null;
  metadata?: Record<string, any> | null;
}

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function asNumber(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return NaN;
}

function parseDurationDays(v: unknown) {
  const n = asNumber(v);
  if (!Number.isFinite(n) || n <= 0) return 14;
  if (![7, 14, 30, 60, 90].includes(Math.floor(n))) return Math.floor(n);
  return Math.floor(n);
}

function normalizeMetaType(raw: string) {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  if (t === "advertising") return "ad"; // compatibility
  return t;
}

function unixToDate(v: unknown, fallback: Date) {
  const n = asNumber(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  // Stripe gives unix seconds for created fields
  return new Date(n * 1000);
}

function idToString(v: unknown) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v instanceof ObjectId) return v.toString();
  if (typeof v === "object" && (v as any)?.toString) {
    const s = (v as any).toString();
    return typeof s === "string" ? s : "";
  }
  return "";
}

/**
 * Normalize old/legacy ad IDs so webhook tracking/fulfillment still works
 */
function normalizeAdItemId(raw: string) {
  const item = raw.trim();
  if (!item) return "";

  const aliases: Record<string, string> = {
    "featured-sponsor-ad": "featured-sponsor",
    "sponsor-featured": "featured-sponsor",

    "banner-homepage-top": "banner-ad",
    "banner-sidebar": "banner-ad",
    "banner-footer": "banner-ad",
    "banner-dashboard": "banner-ad",
  };

  return aliases[item] || item;
}

function isDirectorySku(itemId: string) {
  const id = itemId.trim().toLowerCase();
  return (
    id === "directory-standard" ||
    id === "directory-featured" ||
    id.startsWith("directory-")
  );
}

function directoryTierFromSku(itemId: string) {
  return itemId === "directory-featured" ? "featured" : "standard";
}

function isKnownAdItem(itemId: string) {
  return [
    "directory-standard",
    "directory-featured",
    "featured-sponsor",
    "top-sponsor",
    "sponsored-listing",
    "banner-ad",
  ].includes(itemId);
}

function adDisplayName(itemId: string) {
  const map: Record<string, string> = {
    "directory-standard": "Directory Listing (Standard)",
    "directory-featured": "Directory Listing (Featured)",
    "featured-sponsor": "Featured Sponsor",
    "top-sponsor": "Top Sponsor",
    "sponsored-listing": "Sponsored Listing",
    "banner-ad": "Banner Ad",
  };
  return map[itemId] || itemId || "Advertising Purchase";
}

/**
 * Determine the canonical ad item ID.
 * - Storefront flow uses metadata.itemId = "directory-standard"
 * - Admin ad flow may use metadata.option for actual SKU
 */
function resolveCanonicalAdItemId(meta: SessionMetadata) {
  const option = normalizeAdItemId(asString(meta.option));
  if (option && isKnownAdItem(option)) return option;

  const itemId = normalizeAdItemId(asString(meta.itemId));
  if (itemId && isKnownAdItem(itemId)) return itemId;

  return "";
}

// Used only when businessId is missing; prevents collisions if you have unique constraints later.
function unlinkedBusinessIdPlaceholder(stripeSessionId: string) {
  return `UNLINKED:${stripeSessionId}`;
}

function isWealthBuilderPremiumPurchase(
  meta: SessionMetadata,
  normalizedItemId: string,
) {
  const productKey = asString(meta.productKey).trim().toLowerCase();
  const itemId = normalizedItemId.trim().toLowerCase();

  return (
    productKey === "wealth_builder_premium" ||
    itemId === "wealth-builder-premium-monthly" ||
    itemId === "wealth-builder-premium-annual"
  );
}

function billingIntervalFromWealthBuilderMeta(
  meta: SessionMetadata,
  normalizedItemId: string,
): "monthly" | "annual" | null {
  const fromMeta = asString(meta.billingInterval).trim().toLowerCase();
  if (fromMeta === "monthly") return "monthly";
  if (fromMeta === "annual") return "annual";

  const itemId = normalizedItemId.trim().toLowerCase();
  if (itemId === "wealth-builder-premium-monthly") return "monthly";
  if (itemId === "wealth-builder-premium-annual") return "annual";

  return null;
}

function wealthBuilderPeriodEndFromInterval(
  startAt: Date,
  billingInterval: "monthly" | "annual" | null,
) {
  const end = new Date(startAt);
  if (billingInterval === "annual") {
    end.setFullYear(end.getFullYear() + 1);
    return end;
  }

  // default monthly
  end.setMonth(end.getMonth() + 1);
  return end;
}

async function resolveEntitlementUserId(db: Db, userId: string, email: string) {
  if (userId) return userId;

  if (!email) return "";

  const userDoc = await db
    .collection("users")
    .findOne({ email }, { projection: { _id: 1 } });

  return idToString(userDoc?._id);
}

async function upsertWealthBuilderPremiumEntitlement(
  db: Db,
  input: {
    userId: string;
    email?: string | null;
    stripeSessionId: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    billingInterval: "monthly" | "annual" | null;
    paidAt: Date;
    updatedAt: Date;
  },
) {
  const currentPeriodStart = input.paidAt;
  const currentPeriodEnd = wealthBuilderPeriodEndFromInterval(
    currentPeriodStart,
    input.billingInterval,
  );

  await db.collection("user_entitlements").updateOne(
    {
      userId: input.userId,
      accountType: "user",
      productKey: "wealth_builder_premium",
    },
    {
      $set: {
        userId: input.userId,
        accountType: "user",
        productKey: "wealth_builder_premium",
        tier: "premium",
        status: "active",
        billingInterval: input.billingInterval,
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        trialEndsAt: null,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        premiumStripeSessionId: input.stripeSessionId,
        email: input.email || null,
        updatedAt: input.updatedAt,
      },
      $setOnInsert: {
        createdAt: input.updatedAt,
      },
    },
    { upsert: true },
  );
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

  // Primary events for checkout payments
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return res.status(200).json({ received: true });
  }

  if (
    process.env.NODE_ENV === "production" &&
    (event as any).livemode !== true
  ) {
    console.warn("Ignoring non-live Stripe webhook in production", {
      eventId: event.id,
      type: event.type,
    });
    return res.status(200).json({ received: true, skipped: "non_live_event" });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Only fulfill when actually paid
  const paymentStatus = asString((session as any).payment_status).toLowerCase();
  const isPaidEvent =
    event.type === "checkout.session.async_payment_succeeded" ||
    paymentStatus === "paid";

  if (!isPaidEvent) {
    console.log(
      `ℹ️ Ignoring until paid. type=${event.type} session=${session.id} payment_status=${paymentStatus || "unknown"}`,
    );
    return res.status(200).json({ received: true, skipped: "not_paid_yet" });
  }

  const stripeSessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : ((session.payment_intent as any)?.id as string) || "";

  try {
    const client = await clientPromise;

    const dbName =
      process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "bwes-cluster";
    const db = client.db(dbName);

    const now = new Date();
    const sessionCreatedAt = unixToDate((session as any).created, now);
    const eventCreatedAt = unixToDate(event.created, now);
    const paidAt = eventCreatedAt || sessionCreatedAt || now;

    const existingPayment = (await db.collection("payments").findOne(
      { stripeSessionId },
      {
        projection: {
          stripeSessionId: 1,
          paymentIntentId: 1,
          userId: 1,
          email: 1,
          type: 1,
          itemId: 1,
          amountCents: 1,
          status: 1,
          createdAt: 1,
          metadata: 1,
        },
      },
    )) as PaymentDocLike | null;

    const existingMeta = (existingPayment?.metadata || {}) as Record<
      string,
      any
    >;
    const sessionMeta = (session.metadata || {}) as unknown as SessionMetadata;

    const mergedMeta = { ...existingMeta, ...sessionMeta } as SessionMetadata;

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      asString(existingPayment?.email) ||
      "";

    const rawMetaType = asString(mergedMeta.type || existingPayment?.type);
    const metaType = normalizeMetaType(rawMetaType);

    const rawMetaItemId = asString(
      mergedMeta.itemId || existingPayment?.itemId,
    );
    const rawMetaOption = asString(mergedMeta.option);

    const canonicalAdItemId = resolveCanonicalAdItemId(mergedMeta);
    const normalizedItemId =
      canonicalAdItemId || normalizeAdItemId(rawMetaItemId) || "";

    const isDirectoryPurchase = isDirectorySku(normalizedItemId);

    const durationDays = parseDurationDays(mergedMeta.durationDays);
    const businessIdRaw = mergedMeta.businessId;
    const businessId =
      typeof businessIdRaw === "string" ? businessIdRaw.trim() : "";

    const placement = asString(mergedMeta.placement);
    const userId = asString(mergedMeta.userId || existingPayment?.userId);

    const campaignId = asString(
      mergedMeta.campaignId || mergedMeta.campaignIdFallback,
    );
    const jobId = asString(mergedMeta.jobId);

    console.log(
      `🔔 Paid webhook received type=${event.type} session=${stripeSessionId} item=${normalizedItemId || "n/a"} amount=${session.amount_total ?? "n/a"}`,
    );

    /**
     * 0) Always upsert payments (idempotent reconciliation)
     */
    await db.collection("payments").updateOne(
      { stripeSessionId },
      {
        $setOnInsert: {
          stripeSessionId,
          createdAt: existingPayment?.createdAt
            ? new Date(existingPayment.createdAt as any)
            : sessionCreatedAt,
        },
        $set: {
          updatedAt: now,
          status: "paid",
          paid: true,
          paidAt,
          paymentIntentId:
            paymentIntentId || existingPayment?.paymentIntentId || null,
          email: email || null,
          amountCents:
            typeof session.amount_total === "number"
              ? session.amount_total
              : (existingPayment?.amountCents ?? null),
          currency: session.currency || "usd",

          lastWebhookEventId: event.id,
          lastWebhookEventType: event.type,
          lastWebhookEventCreatedAt: eventCreatedAt,

          type:
            metaType ||
            (normalizedItemId ? "ad" : existingPayment?.type || null),
          itemId: normalizedItemId || asString(existingPayment?.itemId) || null,
          userId: userId || existingPayment?.userId || null,
          emailNormalized: (email || "").trim().toLowerCase() || null,

          metadata: {
            ...existingMeta,
            ...sessionMeta,

            type: metaType || (normalizedItemId ? "ad" : null),
            purchaseType: isDirectoryPurchase ? "directory" : metaType || "ad",

            rawType: rawMetaType || null,
            itemId: normalizedItemId || null,
            rawItemId: rawMetaItemId || null,
            option: rawMetaOption || null,

            durationDays,
            businessId: businessId ? businessId : null,
            placement: placement || null,
            userId: userId || null,
            campaignId: campaignId || null,

            // preserve Wealth Builder plan metadata if present
            productKey: asString(mergedMeta.productKey) || null,
            tier: asString(mergedMeta.tier) || null,
            billingInterval: asString(mergedMeta.billingInterval) || null,

            webhookPaymentStatus: paymentStatus || "paid",
            webhookEventType: event.type,
            webhookEventId: event.id,
          },
        },
      },
      { upsert: true },
    );

    const orderRecord = await db.collection("orders").findOne(
      { sessionId: stripeSessionId },
      {
        projection: {
          _id: 1,
          sessionId: 1,
          productId: 1,
          sellerId: 1,
          total: 1,
          subtotal: 1,
          currency: 1,
          userId: 1,
        },
      },
    );

    if (metaType === "product") {
      const orderId = idToString(orderRecord?._id);
      const productId =
        idToString(orderRecord?.productId) ||
        asString(mergedMeta.itemId || existingPayment?.itemId);
      const sellerId =
        idToString(orderRecord?.sellerId) ||
        asString((mergedMeta as any).sellerId);
      const buyerId =
        asString(orderRecord?.userId) ||
        userId ||
        asString(existingPayment?.userId);

      const isCanonicalCheckout = Boolean(orderRecord?.sessionId);
      const checkoutVariant = isCanonicalCheckout
        ? "canonical_checkout_session"
        : "legacy_stripe_checkout";
      const sourceVariant = isCanonicalCheckout
        ? "api_checkout_create_session"
        : "api_stripe_checkout";

      await db.collection("flow_events").updateOne(
        {
          eventType: "marketplace_purchase_completed",
          stripeSessionId,
        },
        {
          $setOnInsert: {
            eventType: "marketplace_purchase_completed",
            pageRoute: "/api/stripe/webhook-handler",
            serverSource: "stripe_webhook_handler",
            source: "stripe_webhook_handler",
            sourceVariant,
            source_variant: sourceVariant,
            checkoutVariant,
            checkout_variant: checkoutVariant,
            productId: productId || null,
            sellerId: sellerId || null,
            buyerId: buyerId || null,
            entityId: productId || null,
            entityType: "product",
            sessionId: stripeSessionId,
            stripeSessionId,
            paymentIntentId:
              paymentIntentId || existingPayment?.paymentIntentId || null,
            orderId: orderId || asString(mergedMeta.orderId) || null,
            amountTotal:
              typeof session.amount_total === "number"
                ? session.amount_total
                : (existingPayment?.amountCents ?? null),
            amount_total:
              typeof session.amount_total === "number"
                ? session.amount_total
                : (existingPayment?.amountCents ?? null),
            currency: session.currency || "usd",
            accountType: buyerId ? "buyer_authenticated" : "buyer_guest",
            environment: process.env.NODE_ENV || null,
            createdAt: paidAt,
          },
        },
        { upsert: true },
      );
    }

    /**
     * 1) Existing campaign flow (campaign-based)
     */
    if (campaignId) {
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

    /**
     * 2) DIRECTORY FULFILLMENT (P0)
     * Route by itemId (directory-*) — NOT by metadata.type.
     */
    if (isDirectoryPurchase) {
      const tier = directoryTierFromSku(normalizedItemId);
      const expiresAt = new Date(
        paidAt.getTime() + durationDays * 24 * 60 * 60 * 1000,
      );

      const businessIdReal = businessId || null;
      const businessIdStored =
        businessIdReal || unlinkedBusinessIdPlaceholder(stripeSessionId);
      const needsAttention = !businessIdReal;

      const listingStatus = needsAttention ? "unlinked" : "pending_approval";

      const selector = businessIdReal
        ? { businessId: businessIdReal }
        : { stripeSessionId };

      await db.collection("directory_listings").updateOne(
        selector,
        {
          $setOnInsert: {
            createdAt: sessionCreatedAt,
          },
          $set: {
            updatedAt: now,
            stripeSessionId,
            lastStripeSessionId: stripeSessionId,

            paid: true,
            paidAt,
            paymentIntentId: paymentIntentId || null,

            status: listingStatus,
            paymentStatus: "paid",
            listingStatus,

            tier,
            itemId: normalizedItemId,
            durationDays,
            expiresAt,

            userId: userId || null,
            email: email || null,

            businessId: businessIdStored,
            businessIdReal,
            businessIdIsPlaceholder: needsAttention,
            needsAttention,

            amountCents:
              typeof session.amount_total === "number"
                ? session.amount_total
                : (existingPayment?.amountCents ?? null),
            currency: session.currency || "usd",

            metadata: {
              ...(existingMeta || {}),
              placement: placement || null,
              campaignId: campaignId || null,
              rawItemId: rawMetaItemId || null,
              option: rawMetaOption || null,
              canonicalItemId: canonicalAdItemId || null,
              normalizedItemId,
              webhookPaymentStatus: paymentStatus || "paid",
              webhookEventType: event.type,
              webhookEventId: event.id,
            },
          },
        },
        { upsert: true },
      );

      console.log(
        `✅ Directory listing upserted tier=${tier} session=${stripeSessionId} status=${listingStatus} businessId=${businessIdReal || "MISSING"}`,
      );
    }

    /**
     * 3) Track ad purchases (generic record)
     */
    const isAdPurchase =
      metaType === "ad" ||
      metaType === "" ||
      isKnownAdItem(normalizedItemId) ||
      isDirectoryPurchase;

    if (isAdPurchase && normalizedItemId) {
      const knownAd = isKnownAdItem(normalizedItemId);
      const expiresAt = new Date(
        paidAt.getTime() + durationDays * 24 * 60 * 60 * 1000,
      );

      const needsAttention =
        (isDirectoryPurchase && !businessId) ||
        (!isDirectoryPurchase && !campaignId);

      await db.collection("ad_purchases").updateOne(
        { stripeSessionId },
        {
          $setOnInsert: {
            stripeSessionId,
            createdAt: sessionCreatedAt,
          },
          $set: {
            updatedAt: now,
            status: "paid",
            paid: true,
            paidAt,
            paymentIntentId: paymentIntentId || null,
            userId: userId || null,
            email: email || null,

            type: "ad",
            purchaseType: isDirectoryPurchase ? "directory" : "ad",

            itemId: normalizedItemId,
            rawItemId: rawMetaItemId || null,
            option: rawMetaOption || null,
            itemName: adDisplayName(normalizedItemId),
            knownAdItem: knownAd,

            durationDays,
            expiresAt,

            businessId: businessId ? businessId : null,
            campaignId: campaignId || null,
            placement: placement || null,

            amountCents:
              typeof session.amount_total === "number"
                ? session.amount_total
                : (existingPayment?.amountCents ?? null),
            currency: session.currency || "usd",

            lastWebhookEventId: event.id,
            lastWebhookEventType: event.type,
            lastWebhookEventCreatedAt: eventCreatedAt,

            fulfillmentStatus: isDirectoryPurchase
              ? businessId
                ? "paid_directory_linked"
                : "needs_business_link"
              : campaignId
                ? "paid_campaign_linked"
                : "pending_admin_fulfillment",
            needsAttention,
          },
        },
        { upsert: true },
      );

      console.log(
        `✅ ad_purchases upserted item=${normalizedItemId} session=${stripeSessionId}`,
      );

      if (campaignId && ObjectId.isValid(campaignId)) {
        const adReq = await db
          .collection("advertising_requests")
          .findOne({ _id: new ObjectId(campaignId) })
          .catch(() => null);

        if (adReq) {
          const setPatch: Record<string, any> = {
            paymentStatus: "paid",
            depositPaid: true,
            status:
              adReq.status === "pending_review" ? "approved" : adReq.status,
            updatedAt: now,
            paidAt,
            stripeSessionId,
          };

          if (normalizedItemId === "featured-sponsor") {
            const assignments = await reserveFeaturedSponsorWeeks(db as any, {
              campaignId,
              durationDays,
              requestedStartDate: adReq.requestedStartDate
                ? new Date(adReq.requestedStartDate).toISOString()
                : null,
              businessName: adReq.business,
              website: adReq.website,
              targetUrl: adReq.targetUrl || adReq.website,
              creativeUrl: adReq.adImage,
              tagline: adReq.details,
              placement:
                adReq.placement ||
                adReq.placementType ||
                "homepage-featured-sponsor",
              option: normalizedItemId,
              flexibleStart: Boolean(adReq.flexibleStart ?? true),
            });

            const firstWeek = assignments[0]?.weekStart
              ? weekStartUtc(new Date(assignments[0].weekStart))
              : null;
            const requestedWeek = adReq.requestedStartDate
              ? weekStartUtc(new Date(adReq.requestedStartDate))
              : null;

            setPatch.scheduling = {
              status: "scheduled",
              assignedWeeks: assignments.map((a) =>
                new Date(a.weekStart).toISOString().slice(0, 10),
              ),
              rolledOver:
                Boolean(firstWeek && requestedWeek) &&
                firstWeek!.getTime() > requestedWeek!.getTime(),
              queueStatus: assignments[0]?.queueStatus || "assigned",
              placement: adReq.placement || "homepage-featured-sponsor",
              durationDays,
            };
          }

          await db
            .collection("advertising_requests")
            .updateOne({ _id: new ObjectId(campaignId) }, { $set: setPatch });
        }
      }
    }

    /**
     * 3.5) Music creator plan entitlement (existing)
     */
    if (metaType === "plan" && normalizedItemId.startsWith("music-creator-")) {
      const creatorDurationDays = 30;
      const planStartAt = paidAt;
      const planExpiresAt = new Date(
        planStartAt.getTime() + creatorDurationDays * 24 * 60 * 60 * 1000,
      );

      if (userId) {
        await db.collection("sellers").updateMany(
          { userId },
          {
            $set: {
              creatorSubtype: "music",
              creatorPlanId: normalizedItemId,
              creatorPlanStatus: "active",
              creatorPlanDurationDays: creatorDurationDays,
              creatorPlanStartAt: planStartAt,
              creatorPlanExpiresAt: planExpiresAt,
              creatorReady: true,
              updatedAt: now,
            },
          },
        );

        if (email) {
          await db.collection("users").updateOne(
            { email },
            {
              $set: {
                creatorSubtype: "music",
                creatorPlanId: normalizedItemId,
                creatorPlanStatus: "active",
                creatorPlanDurationDays: creatorDurationDays,
                creatorPlanStartAt: planStartAt,
                creatorPlanExpiresAt: planExpiresAt,
                creatorReady: true,
                updatedAt: now,
              },
            },
          );
        }

        const creatorInvariant = await db.collection("sellers").findOne(
          { userId },
          {
            projection: {
              _id: 1,
              creatorPlanId: 1,
              creatorPlanStatus: 1,
              creatorReady: 1,
            },
          },
        );

        if (
          !creatorInvariant ||
          creatorInvariant.creatorPlanId !== normalizedItemId ||
          creatorInvariant.creatorPlanStatus !== "active" ||
          creatorInvariant.creatorReady !== true
        ) {
          await db.collection("flow_events").insertOne({
            eventType: "music_creator_entitlement_invariant_failed",
            pageRoute: "/api/stripe/webhook-handler",
            section: "music_creator_entitlement_invariant",
            source: "stripe_webhook",
            source_variant: "invariant_failed",
            stripeSessionId,
            paymentIntentId: paymentIntentId || null,
            userId,
            itemId: normalizedItemId,
            createdAt: now,
          });
        }

        console.log(
          `✅ Music creator plan activated user=${userId} plan=${normalizedItemId}`,
        );
      }
    }

    /**
     * 3.55) Wealth Builder Premium entitlement (new)
     */
    if (
      metaType === "plan" &&
      isWealthBuilderPremiumPurchase(mergedMeta, normalizedItemId)
    ) {
      const entitlementUserId = await resolveEntitlementUserId(
        db,
        userId,
        email,
      );

      if (!entitlementUserId) {
        await db.collection("flow_events").insertOne({
          eventType: "wealth_builder_entitlement_missing_user",
          pageRoute: "/api/stripe/webhook-handler",
          section: "wealth_builder_entitlement_invariant",
          source: "stripe_webhook",
          source_variant: "missing_user_id",
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          email: email || null,
          itemId: normalizedItemId,
          metadata: mergedMeta,
          createdAt: now,
        });

        console.warn(
          `⚠️ Wealth Builder Premium paid webhook missing resolvable user session=${stripeSessionId}`,
        );
      } else {
        const billingInterval = billingIntervalFromWealthBuilderMeta(
          mergedMeta,
          normalizedItemId,
        );

        await upsertWealthBuilderPremiumEntitlement(db, {
          userId: entitlementUserId,
          email: email || null,
          stripeSessionId,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId:
            typeof (session as any).subscription === "string"
              ? (session as any).subscription
              : null,
          billingInterval,
          paidAt,
          updatedAt: now,
        });

        const entitlementInvariant = await db
          .collection("user_entitlements")
          .findOne(
            {
              userId: entitlementUserId,
              accountType: "user",
              productKey: "wealth_builder_premium",
            },
            {
              projection: {
                _id: 1,
                tier: 1,
                status: 1,
                billingInterval: 1,
                currentPeriodStart: 1,
                currentPeriodEnd: 1,
              },
            },
          );

        if (
          !entitlementInvariant ||
          entitlementInvariant.tier !== "premium" ||
          entitlementInvariant.status !== "active"
        ) {
          await db.collection("flow_events").insertOne({
            eventType: "wealth_builder_entitlement_invariant_failed",
            pageRoute: "/api/stripe/webhook-handler",
            section: "wealth_builder_entitlement_invariant",
            source: "stripe_webhook",
            source_variant: "invariant_failed",
            stripeSessionId,
            paymentIntentId: paymentIntentId || null,
            userId: entitlementUserId,
            email: email || null,
            itemId: normalizedItemId,
            createdAt: now,
          });
        }

        console.log(
          `✅ Wealth Builder Premium activated user=${entitlementUserId} item=${normalizedItemId}`,
        );
      }
    }

    /**
     * 3.6) Premium membership plan entitlement (existing)
     */
    if (metaType === "plan" && normalizedItemId === "premium") {
      const membershipDurationDays =
        parseDurationDays(mergedMeta.durationDays) || 30;
      const planStartAt = paidAt;
      const planExpiresAt = new Date(
        planStartAt.getTime() + membershipDurationDays * 24 * 60 * 60 * 1000,
      );

      const premiumEntitlementPatch = {
        // canonical app fields
        isPremium: true,
        currentPlan: "premium",
        premiumStatus: "active",
        premiumActivatedAt: planStartAt,
        premiumStripeSessionId: stripeSessionId,
        premiumPaymentIntentId: paymentIntentId || null,

        // existing legacy membership fields
        membershipPlanId: "premium",
        membershipPlanStatus: "active",
        membershipPlanDurationDays: membershipDurationDays,
        membershipPlanStartAt: planStartAt,
        membershipPlanExpiresAt: planExpiresAt,

        updatedAt: now,
      };

      if (userId && ObjectId.isValid(userId)) {
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: premiumEntitlementPatch,
          },
        );
      }

      if (email) {
        await db.collection("users").updateOne(
          { email },
          {
            $set: premiumEntitlementPatch,
          },
        );
      }

      const membershipInvariant = await db
        .collection("users")
        .findOne(
          userId && ObjectId.isValid(userId)
            ? { _id: new ObjectId(userId) }
            : { email },
          {
            projection: {
              _id: 1,
              isPremium: 1,
              currentPlan: 1,
              premiumStatus: 1,
              premiumActivatedAt: 1,
              premiumStripeSessionId: 1,
              membershipPlanId: 1,
              membershipPlanStatus: 1,
              membershipPlanExpiresAt: 1,
            },
          },
        );

      if (
        !membershipInvariant ||
        membershipInvariant.isPremium !== true ||
        membershipInvariant.currentPlan !== "premium" ||
        membershipInvariant.premiumStatus !== "active" ||
        membershipInvariant.membershipPlanId !== "premium" ||
        membershipInvariant.membershipPlanStatus !== "active"
      ) {
        await db.collection("flow_events").insertOne({
          eventType: "premium_membership_entitlement_invariant_failed",
          pageRoute: "/api/stripe/webhook-handler",
          section: "premium_membership_entitlement_invariant",
          source: "stripe_webhook",
          source_variant: "invariant_failed",
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          userId: userId || null,
          email: email || null,
          itemId: normalizedItemId,
          createdAt: now,
        });
      }

      console.log(`✅ Premium membership activated user=${userId || email}`);
    }

    /**
     * 4) Marketplace order checkout (strict canonical orderId metadata)
     */
    if (mergedMeta.orderId) {
      await dbFulfillOrder(asString(mergedMeta.orderId), paymentIntentId);
      console.log(`✅ Order ${mergedMeta.orderId} fulfilled`);
    } else if (metaType === "product") {
      await db.collection("flow_events").insertOne({
        eventType: "marketplace_order_id_missing_on_paid_webhook",
        pageRoute: "/api/stripe/webhook-handler",
        section: "marketplace_webhook_invariant",
        source: "stripe_webhook",
        source_variant: "missing_order_id",
        checkout_variant: "canonical_checkout_session",
        stripeSessionId,
        paymentIntentId: paymentIntentId || null,
        createdAt: now,
      });

      console.warn(
        `⚠️ Product paid webhook missing orderId metadata session=${stripeSessionId}`,
      );
    }

    /**
     * 5) Course purchase (existing)
     */
    const resolvedCourseId =
      asString(mergedMeta.courseId || "") ||
      (metaType === "course" ? normalizedItemId : "");

    if (resolvedCourseId && userId) {
      await grantCourseAccess(userId, resolvedCourseId);
      console.log(`✅ Granted course ${resolvedCourseId} to user ${userId}`);
    }

    /**
     * 6) Paid job posting completion (existing canonical job checkout)
     */
    if (metaType === "job") {
      if (jobId && ObjectId.isValid(jobId)) {
        await db.collection("jobs").updateOne(
          { _id: new ObjectId(jobId) },
          {
            $set: {
              isPaid: true,
              paymentStatus: "paid",
              status: "pending_approval",
              stripeSessionId,
              paymentIntentId: paymentIntentId || null,
              paidAt,
              updatedAt: now,
            },
          },
        );
        console.log(`✅ Paid job posting marked paid jobId=${jobId}`);
      } else {
        await db.collection("flow_events").insertOne({
          eventType: "job_paid_webhook_missing_job_id",
          pageRoute: "/api/stripe/webhook-handler",
          section: "job_webhook_invariant",
          source: "stripe_webhook",
          source_variant: "missing_job_id",
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          createdAt: now,
        });
        console.warn(
          `⚠️ Job paid webhook missing jobId metadata session=${stripeSessionId}`,
        );
      }
    }

    /**
     * 7) Affiliate referral conversion (existing)
     */
    if (mergedMeta.affiliateCode) {
      await recordAffiliateConversion(
        asString(mergedMeta.affiliateCode),
        session.amount_total || 0,
        stripeSessionId,
      );
      console.log(
        `✅ Recorded affiliate conversion for ${mergedMeta.affiliateCode}`,
      );
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook fulfillment failed:", err?.message || err);
    return res.status(500).end("Webhook fulfillment failed");
  }
}
