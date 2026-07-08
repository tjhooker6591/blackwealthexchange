// src/pages/api/stripe/webhook-handler.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";

import { getCampaignById, markCampaignPaid } from "@/lib/db/ads";
import { fulfillOrder as dbFulfillOrder } from "@/lib/db/orders";
import { grantCourseAccess } from "@/lib/db/courses";
import {
  deriveMarketplaceAmountTotal,
  emitMarketplaceReconciliationException,
  upsertMarketplacePaymentRecord,
} from "@/lib/marketplace/paymentLinkage";
import {
  MARKETPLACE_ORDER_STATES,
  MARKETPLACE_PAYOUT_STATUSES,
} from "@/lib/marketplace/orderLifecycle";
import { recordAffiliateConversion } from "@/lib/db/affiliates";
import clientPromise from "@/lib/mongodb";
import { Db, ObjectId } from "mongodb";
import {
  reserveFeaturedSponsorWeeks,
  weekStartUtc,
} from "@/lib/advertising/sponsorSchedule";
import {
  BLACK_CARD_TIER_BY_ITEM_ID,
  isBlackCardPlanItemId,
} from "@/lib/black-card";
import { ensureBlackCardMembershipAndCard } from "@/lib/black-card-membership";
import {
  FOUNDING_MEMBERSHIP_ITEM_ID,
  FOUNDING_MEMBERSHIP_NAME,
  FOUNDING_MEMBERSHIP_PRICE_CENTS,
  FOUNDING_MEMBERSHIP_PRODUCT_KEY,
  isFoundingMembershipItemId,
  isFoundingMembershipProductKey,
} from "@/lib/founding-membership";
import { getMongoDbName } from "@/lib/env";
import { requireStripeSecretKey } from "@/lib/stripeSecret";
import { sendEmail } from "@/lib/sendEmail";
import {
  checkoutTypeToRevenueType,
  computeRevenueSplit,
} from "@/lib/payments/revenue";
import {
  ensureFinancialLedgerIndexes,
  isFinancialLedgerEnabled,
} from "@/lib/finance/ledger";

export const config = {
  api: { bodyParser: false },
};

let stripeClient: Stripe | null = null;

function getStripeClient() {
  if (stripeClient) return stripeClient;
  stripeClient = new Stripe(requireStripeSecretKey(), {
    apiVersion: "2025-02-24.acacia" as any,
  });
  return stripeClient;
}

function getWebhookSecret() {
  return (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
}

function redactId(value: string) {
  if (!value) return "";
  return `${value.slice(0, 12)}••••`;
}

async function logWebhookDebug(
  db: Db,
  input: {
    eventId?: string;
    eventType?: string;
    sessionId?: string;
    revenueStream?: string;
    status: "received" | "processed" | "ledger_written" | "failed";
    ledgerAttempted: boolean;
  },
) {
  try {
    await db.collection("webhook_events_debug").insertOne({
      eventId: input.eventId || null,
      eventType: input.eventType || null,
      sessionId: input.sessionId || null,
      revenueStream: input.revenueStream || null,
      status: input.status,
      ledgerAttempted: input.ledgerAttempted,
      createdAt: new Date(),
    });
  } catch {}
}
interface SessionMetadata {
  // existing flows
  campaignId?: string;
  orderId?: string;
  courseId?: string;
  userId?: string;
  affiliateCode?: string;
  courseName?: string;
  itemName?: string;

  // checkout.ts / api/stripe/checkout.ts metadata
  itemId?: string;
  option?: string; // admin advertising checkout uses option as the ad sku
  adType?: string; // legacy create-checkout-session ad label
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

  const key = item.toLowerCase();
  const aliases: Record<string, string> = {
    "featured sponsor": "featured-sponsor",
    "featured-sponsor-ad": "featured-sponsor",
    "sponsor-featured": "featured-sponsor",

    "business directory": "directory-standard",
    "banner ads": "banner-ad",
    "custom solutions": "sponsored-listing",

    "banner-homepage-top": "banner-ad",
    "banner-sidebar": "banner-ad",
    "banner-footer": "banner-ad",
    "banner-dashboard": "banner-ad",
  };

  return aliases[key] || item;
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

  const adType = normalizeAdItemId(asString(meta.adType));
  if (adType && isKnownAdItem(adType)) return adType;

  return "";
}

function inferCanonicalAdItemIdFromCampaignContext(input: {
  legacyCampaign?: any;
  adminCampaign?: any;
}) {
  const candidates: unknown[] = [
    input.adminCampaign?.option,
    input.adminCampaign?.itemId,
    input.adminCampaign?.metadata?.itemId,
    input.adminCampaign?.metadata?.option,
    input.adminCampaign?.placement,
    input.legacyCampaign?.name,
    input.legacyCampaign?.banner,
  ];

  for (const raw of candidates) {
    const normalized = normalizeAdItemId(asString(raw));
    if (normalized && isKnownAdItem(normalized)) return normalized;

    const lowered = asString(raw).toLowerCase();
    if (lowered.includes("directory") && lowered.includes("featured")) {
      return "directory-featured";
    }
    if (lowered.includes("directory")) return "directory-standard";
    if (lowered.includes("featured") && lowered.includes("sponsor")) {
      return "featured-sponsor";
    }
    if (lowered.includes("banner")) return "banner-ad";
  }

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

function mapPlanToBlackCardTier(plan: "premium" | "founding") {
  return plan === "founding" ? "signature" : "standard";
}

function isFoundingMembershipPurchase(
  meta: SessionMetadata,
  normalizedItemId: string,
) {
  const productKey = asString(meta.productKey).trim().toLowerCase();
  return (
    isFoundingMembershipItemId(normalizedItemId) ||
    isFoundingMembershipProductKey(productKey)
  );
}

async function sendMembershipEmailSafe(params: {
  to?: string | null;
  subject: string;
  text: string;
}) {
  if (!params.to) return;
  try {
    await sendEmail({
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: `<p>${params.text.replace(/\n/g, "<br/>")}</p>`,
    });
  } catch (err) {
    console.warn("[stripe-webhook] membership email failed", {
      to: params.to,
      subject: params.subject,
      err: (err as any)?.message || String(err),
    });
  }
}

async function pushMembershipNotification(
  db: Db,
  input: {
    userId?: string | null;
    email?: string | null;
    type: string;
    message: string;
    createdAt: Date;
    meta?: Record<string, unknown>;
  },
) {
  try {
    await db.collection("notifications").insertOne({
      userId: input.userId || null,
      email: input.email || null,
      type: input.type,
      message: input.message,
      read: false,
      createdAt: input.createdAt,
      metadata: input.meta || {},
    });
  } catch {}
}

async function applySubscriptionEntitlement(
  db: Db,
  input: {
    userId?: string | null;
    email?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    plan: "premium" | "founding";
    status:
      | "active"
      | "trialing"
      | "past_due"
      | "canceled"
      | "unpaid"
      | "incomplete"
      | "incomplete_expired";
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
    updatedAt: Date;
  },
) {
  const keepActiveUntilPeriodEnd =
    input.cancelAtPeriodEnd &&
    input.currentPeriodEnd &&
    input.currentPeriodEnd.getTime() > Date.now();

  const active =
    input.status === "active" ||
    input.status === "trialing" ||
    keepActiveUntilPeriodEnd;

  const patch: Record<string, unknown> = {
    stripeCustomerId: input.stripeCustomerId || null,
    stripeSubscriptionId: input.stripeSubscriptionId || null,
    subscriptionStatus: input.status,
    subscriptionCurrentPeriodStart: input.currentPeriodStart || null,
    subscriptionCurrentPeriodEnd: input.currentPeriodEnd || null,
    subscriptionCancelAtPeriodEnd: Boolean(input.cancelAtPeriodEnd),
    subscriptionCanceledAt: input.canceledAt || null,
    nextBillingDate: input.currentPeriodEnd || null,
    renewalStatus: keepActiveUntilPeriodEnd
      ? "canceling"
      : active
        ? "active"
        : "inactive",
    updatedAt: input.updatedAt,
  };

  if (active) {
    const tier = mapPlanToBlackCardTier(input.plan);
    Object.assign(patch, {
      isPremium: true,
      currentPlan: input.plan,
      premiumStatus: "active",
      premiumActivatedAt: input.currentPeriodStart || input.updatedAt,
      membershipPlanId: input.plan,
      membershipPlanStatus: keepActiveUntilPeriodEnd ? "canceling" : "active",
      membershipPlanStartAt: input.currentPeriodStart || null,
      membershipPlanExpiresAt: input.currentPeriodEnd || null,
      blackCardTier: tier,
      blackCardStatus: "active",
      blackCardPlanExpiresAt: input.currentPeriodEnd || null,
    });
  } else {
    Object.assign(patch, {
      isPremium: false,
      currentPlan: "free",
      premiumStatus: "inactive",
      membershipPlanStatus: "inactive",
      membershipPlanExpiresAt: input.currentPeriodEnd || input.updatedAt,
      blackCardStatus: "inactive",
    });
  }

  const filters: Record<string, unknown>[] = [];
  if (input.userId && ObjectId.isValid(input.userId)) {
    filters.push({ _id: new ObjectId(input.userId) });
  }
  if (input.email) filters.push({ email: input.email });
  if (input.stripeSubscriptionId) {
    filters.push({ stripeSubscriptionId: input.stripeSubscriptionId });
  }
  if (input.stripeCustomerId) {
    filters.push({ stripeCustomerId: input.stripeCustomerId });
  }

  if (!filters.length) return;
  await db.collection("users").updateMany({ $or: filters }, { $set: patch });
}

export default async function webhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const fail = (status: number, code: string, message: string) =>
    res.status(status).json({ ok: false, code, message });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(405, "METHOD_NOT_ALLOWED", "Method Not Allowed");
  }

  const endpointSecret = getWebhookSecret();
  if (!endpointSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET missing in env");
    return fail(500, "WEBHOOK_NOT_CONFIGURED", "Webhook not configured");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    console.error("❌ Missing stripe-signature header");
    return fail(400, "INVALID_SIGNATURE", "Invalid webhook signature");
  }

  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err?.message);
    return fail(400, "INVALID_WEBHOOK", "Invalid webhook payload");
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

  const stripe = getStripeClient();

  if (event.type === "invoice.upcoming") {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : "";
    const user = customerId
      ? await db
          .collection("users")
          .findOne(
            { stripeCustomerId: customerId },
            { projection: { _id: 1, email: 1 } },
          )
      : null;
    const email =
      (user as any)?.email || (invoice as any)?.customer_email || "";
    const dueDate = invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
      : "soon";

    await sendMembershipEmailSafe({
      to: email,
      subject: "BWE membership renewal reminder",
      text: `Your membership renewal is coming up (${dueDate}). Your plan will auto-renew annually unless canceled.`,
    });

    await pushMembershipNotification(db, {
      userId: user?._id ? String(user._id) : null,
      email,
      type: "membership_renewal_reminder",
      message: `Your membership renewal is coming up (${dueDate}).`,
      createdAt: new Date(),
      meta: { invoiceId: invoice.id },
    });

    return res.status(200).json({ received: true });
  }

  if (
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    await logWebhookDebug(db, {
      eventId: event.id,
      eventType: event.type,
      sessionId: "",
      status: "received",
      ledgerAttempted: false,
    });

    console.log(
      `[webhook] received type=${event.type} event=${redactId(event.id)} subscription-lifecycle`,
    );

    const now = new Date();

    const subIdFromInvoice = event.type.startsWith("invoice.")
      ? typeof (event.data.object as Stripe.Invoice).subscription === "string"
        ? ((event.data.object as Stripe.Invoice).subscription as string)
        : ""
      : "";

    const subscription = event.type.startsWith("customer.subscription")
      ? (event.data.object as Stripe.Subscription)
      : subIdFromInvoice
        ? await stripe.subscriptions.retrieve(subIdFromInvoice)
        : null;

    if (!subscription) {
      return res
        .status(200)
        .json({ received: true, skipped: "missing_subscription" });
    }

    const subscriptionId = subscription.id;
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : "";

    const user = await db.collection("users").findOne(
      {
        $or: [
          { stripeSubscriptionId: subscriptionId },
          ...(customerId ? [{ stripeCustomerId: customerId }] : []),
        ],
      },
      {
        projection: { _id: 1, email: 1, currentPlan: 1, subscriptionPlan: 1 },
      },
    );

    const planGuess =
      String(
        (user as any)?.subscriptionPlan || (user as any)?.currentPlan || "",
      ).toLowerCase() === "founding"
        ? "founding"
        : "premium";

    const periodStart = (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000)
      : null;
    const periodEnd = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : null;
    const canceledAt = (subscription as any).canceled_at
      ? new Date((subscription as any).canceled_at * 1000)
      : null;

    let statusForEntitlement = String(subscription.status || "inactive") as
      | "active"
      | "trialing"
      | "past_due"
      | "canceled"
      | "unpaid"
      | "incomplete"
      | "incomplete_expired";

    if (event.type === "invoice.payment_failed") {
      statusForEntitlement = "past_due";
    }

    if (event.type === "invoice.payment_failed") {
      await applySubscriptionEntitlement(db, {
        userId: user?._id ? String(user._id) : null,
        email: (user as any)?.email || null,
        stripeCustomerId: customerId || null,
        stripeSubscriptionId: subscriptionId,
        plan: planGuess,
        status: "past_due",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: Boolean((subscription as any).cancel_at_period_end),
        canceledAt,
        updatedAt: now,
      });

      await sendMembershipEmailSafe({
        to: (user as any)?.email || null,
        subject: "BWE payment failed",
        text: "We were unable to process your renewal payment. Your paid access has been downgraded to Free until payment is resolved.",
      });

      await pushMembershipNotification(db, {
        userId: user?._id ? String(user._id) : null,
        email: (user as any)?.email || null,
        type: "membership_payment_failed",
        message:
          "Renewal payment failed. Account moved to Free until payment is resolved.",
        createdAt: now,
        meta: { subscriptionId },
      });
    } else {
      await applySubscriptionEntitlement(db, {
        userId: user?._id ? String(user._id) : null,
        email: (user as any)?.email || null,
        stripeCustomerId: customerId || null,
        stripeSubscriptionId: subscriptionId,
        plan: planGuess,
        status: statusForEntitlement,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: Boolean((subscription as any).cancel_at_period_end),
        canceledAt,
        updatedAt: now,
      });

      if (event.type === "invoice.paid") {
        await sendMembershipEmailSafe({
          to: (user as any)?.email || null,
          subject: "BWE renewal successful",
          text: `Your membership renewed successfully. Next billing date: ${periodEnd ? periodEnd.toLocaleDateString() : "annual cycle"}.`,
        });
      }

      if (
        event.type === "customer.subscription.updated" &&
        Boolean((subscription as any).cancel_at_period_end)
      ) {
        await sendMembershipEmailSafe({
          to: (user as any)?.email || null,
          subject: "BWE cancellation scheduled",
          text: `Your subscription will cancel at period end (${periodEnd ? periodEnd.toLocaleDateString() : "end of current period"}). You keep access until then.`,
        });
      }
    }

    await db.collection("subscription_events").insertOne({
      stripeEventId: event.id,
      stripeEventType: event.type,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId || null,
      userId: user?._id ? String(user._id) : null,
      email: (user as any)?.email || null,
      plan: planGuess,
      status: statusForEntitlement,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: Boolean((subscription as any).cancel_at_period_end),
      createdAt: now,
    });

    return res.status(200).json({ received: true });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const stripeSessionId = typeof session?.id === "string" ? session.id : "";
    if (!stripeSessionId) {
      return fail(
        400,
        "INVALID_EVENT_PAYLOAD",
        "Invalid checkout session payload",
      );
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();
    const orderRecord = await db.collection("orders").findOne({
      $or: [{ sessionId: stripeSessionId }, { stripeSessionId }],
    });

    if (!orderRecord) {
      return res
        .status(200)
        .json({ received: true, skipped: "order_not_found" });
    }

    const paymentStatus = String(orderRecord.paymentStatus || "").toLowerCase();
    const orderState = String(orderRecord.orderState || "").toLowerCase();
    const alreadyTerminal =
      paymentStatus === "paid" ||
      orderState === MARKETPLACE_ORDER_STATES.PAID_UNFULFILLED ||
      orderState === MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_READY ||
      orderState === MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_PENDING;

    if (alreadyTerminal) {
      return res
        .status(200)
        .json({ received: true, skipped: "already_paid_or_fulfilled" });
    }

    await db.collection("orders").updateOne(
      { _id: orderRecord._id, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          orderState: MARKETPLACE_ORDER_STATES.CHECKOUT_EXPIRED,
          paymentStatus: "expired",
          payoutStatus: MARKETPLACE_PAYOUT_STATUSES.NOT_APPLICABLE,
          checkoutExpiredAt:
            typeof session.expires_at === "number"
              ? new Date(session.expires_at * 1000)
              : now,
          updatedAt: now,
        },
      },
    );

    await db.collection("flow_events").updateOne(
      { eventType: "marketplace_checkout_expired", stripeSessionId },
      {
        $setOnInsert: {
          eventType: "marketplace_checkout_expired",
          pageRoute: "/api/stripe/webhook-handler",
          section: "marketplace_checkout_lifecycle",
          source: "stripe_webhook",
          source_variant: "checkout_session_expired",
          stripeSessionId,
          orderId: idToString(orderRecord._id),
          productId: idToString(orderRecord.productId),
          sellerId: idToString(orderRecord.sellerId),
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return res.status(200).json({ received: true });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (
    !session ||
    (session as any).object !== "checkout.session" ||
    typeof session.id !== "string" ||
    !session.id.trim()
  ) {
    console.error("❌ Malformed checkout.session payload", {
      eventId: event.id,
      type: event.type,
    });
    return fail(
      400,
      "INVALID_EVENT_PAYLOAD",
      "Invalid checkout session payload",
    );
  }

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
    const db = client.db(getMongoDbName());
    const ledgerEnabled = isFinancialLedgerEnabled();
    if (ledgerEnabled) {
      await ensureFinancialLedgerIndexes(db);
    }

    await logWebhookDebug(db, {
      eventId: event.id,
      eventType: event.type,
      sessionId: stripeSessionId,
      status: "received",
      ledgerAttempted: false,
    });

    console.log(
      `[webhook] received type=${event.type} event=${redactId(event.id)} session=${redactId(stripeSessionId)}`,
    );

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

    const durationDays = parseDurationDays(mergedMeta.durationDays);
    const businessIdRaw = mergedMeta.businessId;
    const businessId =
      typeof businessIdRaw === "string" ? businessIdRaw.trim() : "";

    const placement = asString(mergedMeta.placement);
    const userId = asString(mergedMeta.userId || existingPayment?.userId);

    const campaignId = asString(
      mergedMeta.campaignId ||
        mergedMeta.campaignIdFallback ||
        session.client_reference_id,
    );
    const jobId = asString(mergedMeta.jobId);

    const canonicalAdItemId = resolveCanonicalAdItemId(mergedMeta);
    let normalizedItemId =
      canonicalAdItemId || normalizeAdItemId(rawMetaItemId) || "";

    const existingAdPurchase = await db.collection("ad_purchases").findOne({
      $or: [
        { stripeSessionId },
        ...(paymentIntentId ? [{ paymentIntentId }] : []),
      ],
    });

    if (!normalizedItemId) {
      normalizedItemId = normalizeAdItemId(
        asString(existingAdPurchase?.itemId),
      );
    }

    if (!normalizedItemId && campaignId) {
      const legacyCampaign = await getCampaignById(campaignId).catch(
        () => null,
      );
      const adminCampaign = ObjectId.isValid(campaignId)
        ? await db
            .collection("advertising_campaigns")
            .findOne({ _id: new ObjectId(campaignId) })
            .catch(() => null)
        : null;

      const inferred = inferCanonicalAdItemIdFromCampaignContext({
        legacyCampaign,
        adminCampaign,
      });
      if (inferred) {
        normalizedItemId = inferred;
      }
    }

    const isDirectoryPurchase = isDirectorySku(normalizedItemId);

    const resolvedAmountCents =
      typeof session.amount_total === "number"
        ? session.amount_total
        : (existingPayment?.amountCents ?? 0);
    const resolvedRevenueType = checkoutTypeToRevenueType(
      metaType || "",
      normalizedItemId || rawMetaItemId,
    );
    const split = computeRevenueSplit(resolvedRevenueType, resolvedAmountCents);

    console.log(
      `stripe webhook paid session=${stripeSessionId} type=${event.type}`,
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
          amountCents: resolvedAmountCents || null,
          grossAmountCents: resolvedAmountCents || null,
          refundedAmountCents: 0,
          netAmountCents: split.netAmount,
          bweRetainedAmountCents: split.bweFee,
          bweFee: split.bweFee,
          bweFeePercent: split.bweFeePercent,
          payout: split.sellerPayout,
          paymentStatus: "paid",
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
          totalPrice: 1,
          totalCents: 1,
          subtotal: 1,
          subtotalCents: 1,
          currency: 1,
          userId: 1,
          orderState: 1,
          status: 1,
          paymentStatus: 1,
          payoutMode: 1,
        },
      },
    );

    if (ledgerEnabled) {
      await db.collection("financial_ledger").updateOne(
        { transactionId: stripeSessionId, webhookEventId: event.id },
        {
          $setOnInsert: {
            transactionId: stripeSessionId,
            stripeSessionId,
            stripePaymentIntentId: paymentIntentId || null,
            createdAt: sessionCreatedAt,
          },
          $set: {
            updatedAt: now,
            userId: userId || null,
            sellerId: orderRecord?.sellerId
              ? idToString(orderRecord.sellerId)
              : null,
            employerId: null,
            businessId: businessId || null,
            creatorId: null,
            revenueStream: resolvedRevenueType,
            grossAmount: resolvedAmountCents || 0,
            bweFeeAmount: split.bweFee || 0,
            bweFeePercent: split.bweFeePercent || 0,
            sellerPayoutAmount: split.sellerPayout || 0,
            partnerPayoutAmount: 0,
            netBweRevenue: split.bweFee || 0,
            paymentStatus: "paid",
            fulfillmentStatus: orderRecord ? "fulfilled" : "pending",
            payoutStatus:
              split.sellerPayout > 0
                ? orderRecord?.payoutMode === "platform_hold"
                  ? "platform_held"
                  : "ready"
                : "not_applicable",
            refundStatus: "none",
            disputeStatus: "none",
            sourceRoute: "/api/stripe/webhook-handler",
            webhookEventId: event.id,
            actorType: "system",
            immutableOriginalAmount: resolvedAmountCents || 0,
            metadata: {
              type: metaType || null,
              itemId: normalizedItemId || rawMetaItemId || null,
              campaignId: campaignId || null,
              jobId: jobId || null,
            },
          },
        },
        { upsert: true },
      );
      await logWebhookDebug(db, {
        eventId: event.id,
        eventType: event.type,
        sessionId: stripeSessionId,
        revenueStream: resolvedRevenueType,
        status: "ledger_written",
        ledgerAttempted: true,
      });
    }

    await logWebhookDebug(db, {
      eventId: event.id,
      eventType: event.type,
      sessionId: stripeSessionId,
      revenueStream: resolvedRevenueType,
      status: "processed",
      ledgerAttempted: ledgerEnabled,
    });

    console.log(
      `[webhook] processed type=${event.type} event=${redactId(event.id)} session=${redactId(stripeSessionId)} stream=${resolvedRevenueType} ledger_attempted=${ledgerEnabled ? "yes" : "no"}`,
    );

    if (metaType === "product") {
      const orderId =
        idToString(orderRecord?._id) || asString(mergedMeta.orderId);
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

      if (!orderId || !productId) {
        await db.collection("flow_events").insertOne({
          eventType: "marketplace_order_product_linkage_missing",
          pageRoute: "/api/stripe/webhook-handler",
          section: "marketplace_webhook_invariant",
          source: "stripe_webhook",
          source_variant: "missing_order_or_product_linkage",
          stripeSessionId,
          paymentIntentId:
            paymentIntentId || existingPayment?.paymentIntentId || null,
          orderId: orderId || null,
          productId: productId || null,
          createdAt: now,
        });
      }

      const orderState = asString(
        (orderRecord as any)?.orderState || (orderRecord as any)?.status,
      );
      if (
        orderState &&
        ![
          MARKETPLACE_ORDER_STATES.CHECKOUT_PENDING,
          "pending_checkout",
          MARKETPLACE_ORDER_STATES.PAID_UNFULFILLED,
          MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_READY,
          MARKETPLACE_ORDER_STATES.FULFILLED_PAYOUT_PENDING,
        ].includes(orderState)
      ) {
        await db.collection("flow_events").insertOne({
          eventType: "marketplace_order_non_canonical_state_detected",
          pageRoute: "/api/stripe/webhook-handler",
          section: "marketplace_webhook_invariant",
          source: "stripe_webhook",
          source_variant: "non_canonical_order_state",
          stripeSessionId,
          orderId: orderId || null,
          productId: productId || null,
          orderState,
          createdAt: now,
        });
      }

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
            orderId: orderId || null,
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

      const adminCampaignFilter = ObjectId.isValid(campaignId)
        ? {
            $or: [
              { _id: new ObjectId(campaignId) },
              { stripeSessionId },
              { "metadata.campaignId": campaignId },
            ],
          }
        : {
            $or: [{ stripeSessionId }, { "metadata.campaignId": campaignId }],
          };

      const adminCampaignUpdate = await db
        .collection("advertising_campaigns")
        .updateOne(adminCampaignFilter, {
          $set: {
            status: "paid",
            paymentStatus: "paid",
            paidAt,
            stripeSessionId,
            stripePaymentIntentId: paymentIntentId || null,
            updatedAt: now,
          },
        });

      if (adminCampaignUpdate.matchedCount > 0) {
        console.log(
          `✅ advertising_campaigns marked paid campaignId=${campaignId} session=${stripeSessionId}`,
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
      isDirectoryPurchase ||
      Boolean(existingAdPurchase) ||
      Boolean(campaignId);

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
     * 3.58) Founding Verified Business Growth Membership
     */
    if (
      metaType === "plan" &&
      isFoundingMembershipPurchase(mergedMeta, normalizedItemId)
    ) {
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;
      const stripeSubscriptionId =
        typeof (session as any).subscription === "string"
          ? ((session as any).subscription as string)
          : null;
      const membershipBusinessId = businessId;

      if (!userId || !membershipBusinessId) {
        await db.collection("flow_events").insertOne({
          eventType: "founding_membership_paid_missing_linkage",
          pageRoute: "/api/stripe/webhook-handler",
          section: "founding_membership_webhook",
          source: "stripe_webhook",
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          userId: userId || null,
          businessId: membershipBusinessId || null,
          createdAt: now,
        });
      } else {
        const membershipId = `${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:${membershipBusinessId}`;

        await db.collection("business_memberships").updateOne(
          { membershipId },
          {
            $setOnInsert: {
              membershipId,
              createdAt: paidAt,
            },
            $set: {
              productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
              membershipName: FOUNDING_MEMBERSHIP_NAME,
              membershipStatus: "active",
              billingInterval: "monthly",
              amountCents:
                resolvedAmountCents || FOUNDING_MEMBERSHIP_PRICE_CENTS,
              currency: session.currency || "usd",
              grossAmountCents:
                resolvedAmountCents || FOUNDING_MEMBERSHIP_PRICE_CENTS,
              refundedAmountCents: 0,
              netRecordedAmountCents: split.netAmount,
              bweRetainedAmountCents: split.bweFee,
              userId,
              businessId: membershipBusinessId,
              email: email || null,
              stripeSessionId,
              stripeCustomerId,
              stripeSubscriptionId,
              stripePriceId:
                typeof session.metadata?.priceId === "string"
                  ? session.metadata?.priceId
                  : null,
              stripeProductId:
                typeof session.metadata?.productId === "string"
                  ? session.metadata?.productId
                  : null,
              stripeInvoiceId: null,
              stripePaymentIntentId: paymentIntentId || null,
              ownershipReviewStatus: "ownership_verification_pending",
              claimLocked: true,
              activatedAt: paidAt,
              updatedAt: now,
            },
          },
          { upsert: true },
        );

        await db.collection("business_claims").updateOne(
          {
            businessId: membershipBusinessId,
            userId,
            productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
          },
          {
            $setOnInsert: {
              createdAt: paidAt,
            },
            $set: {
              businessId: membershipBusinessId,
              userId,
              email: email || null,
              claimStatus: "claim_initiated",
              ownershipReviewStatus: "ownership_verification_pending",
              membershipId,
              membershipName: FOUNDING_MEMBERSHIP_NAME,
              productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
              itemId: FOUNDING_MEMBERSHIP_ITEM_ID,
              paymentStatus: "paid",
              paymentId: existingPayment?._id
                ? String(existingPayment._id)
                : null,
              stripeSessionId,
              claimLocked: true,
              auditHistory: [
                {
                  action: "claim_created_from_paid_webhook",
                  previousStatus: null,
                  resultingStatus: "ownership_verification_pending",
                  reviewer: "system:webhook",
                  reason:
                    "Paid founding membership created with ownership verification pending.",
                  timestamp: now,
                },
              ],
              updatedAt: now,
            },
          },
          { upsert: true },
        );

        await db.collection("ownership_reviews").updateOne(
          {
            businessId: membershipBusinessId,
            userId,
            sourceMembershipId: membershipId,
          },
          {
            $setOnInsert: { createdAt: paidAt },
            $set: {
              businessId: membershipBusinessId,
              userId,
              email: email || null,
              reviewStatus: "ownership_verification_pending",
              evidenceStatus: "awaiting_owner_documents",
              sourceMembershipId: membershipId,
              sourceClaimStatus: "claim_initiated",
              paymentId: existingPayment?._id
                ? String(existingPayment._id)
                : null,
              stripeSessionId,
              evidenceRequirements: [
                "website_domain_email",
                "listed_business_phone",
                "formation_document",
                "business_license",
                "official_website_or_social_account",
                "written_owner_or_officer_authorization",
              ],
              evidenceSubmissions: [],
              evidencePublicSummary: null,
              auditHistory: [
                {
                  action: "review_created_from_paid_webhook",
                  previousStatus: null,
                  resultingStatus: "ownership_verification_pending",
                  reviewer: "system:webhook",
                  reason:
                    "Ownership verification opened after successful founding membership payment.",
                  timestamp: now,
                },
              ],
              updatedAt: now,
            },
          },
          { upsert: true },
        );

        await db.collection("membership_onboarding").updateOne(
          { membershipId },
          {
            $setOnInsert: { createdAt: paidAt },
            $set: {
              membershipId,
              businessId: membershipBusinessId,
              userId,
              onboardingStatus: "started",
              checklistStatus: "pending",
              nextStep: "submit ownership evidence for manual review",
              evidencePortalStatus: "open",
              updatedAt: now,
            },
          },
          { upsert: true },
        );

        await db.collection("membership_fulfillment").updateOne(
          { membershipId },
          {
            $setOnInsert: { createdAt: paidAt },
            $set: {
              membershipId,
              businessId: membershipBusinessId,
              userId,
              fulfillmentStatus: "pending_review_queue",
              ownershipAccessStatus: "locked_pending_review",
              profileReviewStatus: "queued",
              baselineStatus: "queued",
              monthlyReportingStatus: "scheduled",
              supportStatus: "available",
              checklist: [
                {
                  key: "ownership_review",
                  label: "Ownership verification",
                  status: "ownership_verification_pending",
                },
                {
                  key: "ownership_evidence",
                  label: "Submit ownership evidence",
                  status: "awaiting_owner_documents",
                },
                {
                  key: "profile_review",
                  label: "Professional profile review",
                  status: "queued",
                },
                {
                  key: "profile_enhancement",
                  label: "Profile enhancement setup",
                  status: "queued",
                },
                {
                  key: "baseline",
                  label: "Initial performance baseline",
                  status: "queued",
                },
                {
                  key: "monthly_reporting",
                  label: "Monthly activity reporting",
                  status: "scheduled",
                },
              ],
              updatedAt: now,
            },
          },
          { upsert: true },
        );

        await db.collection("profile_performance_baselines").updateOne(
          { membershipId },
          {
            $setOnInsert: { createdAt: paidAt },
            $set: {
              membershipId,
              businessId: membershipBusinessId,
              userId,
              baselineStatus: "created",
              source: "founding_membership_webhook",
              metrics: {
                capturedAt: now,
                notes:
                  "Initial baseline record created at membership payment confirmation.",
              },
              updatedAt: now,
            },
          },
          { upsert: true },
        );

        await db.collection("payments").updateOne(
          { stripeSessionId },
          {
            $set: {
              membershipId,
              membershipName: FOUNDING_MEMBERSHIP_NAME,
              businessId: membershipBusinessId,
              userId,
              testMode: (event as any).livemode === false,
              liveMode: (event as any).livemode === true,
              productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
              itemId: FOUNDING_MEMBERSHIP_ITEM_ID,
              paymentStatus: "paid",
              status: "paid",
              metadata: {
                ...existingMeta,
                ...sessionMeta,
                productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
                membershipName: FOUNDING_MEMBERSHIP_NAME,
                billingInterval: "monthly",
                businessId: membershipBusinessId,
                membershipId,
                testMode: (event as any).livemode === false,
              },
              updatedAt: now,
            },
          },
        );

        await db
          .collection("businesses")
          .updateOne(
            ObjectId.isValid(membershipBusinessId)
              ? { _id: new ObjectId(membershipBusinessId) }
              : { _id: membershipBusinessId as any },
            {
              $set: {
                claimStage: "ownership_verification_pending",
                ownershipReviewStatus: "ownership_verification_pending",
                claimLocked: true,
                pendingClaimMembershipId: membershipId,
                pendingClaimUserId: userId,
                pendingClaimPaymentId: existingPayment?._id
                  ? String(existingPayment._id)
                  : null,
                pendingClaimStripeSessionId: stripeSessionId,
                updatedAt: now,
              },
            },
          );

        await db.collection("subscription_events").updateOne(
          {
            stripeEventId: event.id,
            stripeSessionId,
            plan: "founding_verified_business_growth_membership",
          },
          {
            $setOnInsert: {
              createdAt: now,
            },
            $set: {
              stripeEventType: event.type,
              stripeSubscriptionId: stripeSubscriptionId || null,
              stripeCustomerId: stripeCustomerId || null,
              userId,
              email: email || null,
              plan: "founding_verified_business_growth_membership",
              status: "active",
              businessId: membershipBusinessId,
              membershipId,
              currentPeriodStart: paidAt,
              cancelAtPeriodEnd: false,
            },
          },
          { upsert: true },
        );
      }
    }

    /**
     * 3.6) Paid-plan entitlement mapped to Black Card tier
     */
    const normalizedPlanItemId =
      metaType === "plan"
        ? asString(normalizedItemId || rawMetaItemId || existingPayment?.itemId)
            .trim()
            .toLowerCase()
        : "";

    if (
      metaType === "plan" &&
      (normalizedPlanItemId === "premium" || normalizedPlanItemId === "founder")
    ) {
      const isFounding = normalizedPlanItemId === "founder";
      const mappedPlanId = isFounding ? "founding" : "premium";
      const mappedTierItemId = isFounding
        ? "black-card-signature"
        : "black-card-standard";

      const stripeSubscriptionId =
        typeof (session as any).subscription === "string"
          ? ((session as any).subscription as string)
          : "";

      let planStartAt = paidAt;
      let planExpiresAt = new Date(
        planStartAt.getTime() + 365 * 24 * 60 * 60 * 1000,
      );
      let cancelAtPeriodEnd = false;
      let stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;

      if (stripeSubscriptionId) {
        try {
          const sub =
            await getStripeClient().subscriptions.retrieve(
              stripeSubscriptionId,
            );
          if ((sub as any).current_period_start) {
            planStartAt = new Date((sub as any).current_period_start * 1000);
          }
          if ((sub as any).current_period_end) {
            planExpiresAt = new Date((sub as any).current_period_end * 1000);
          }
          cancelAtPeriodEnd = Boolean((sub as any).cancel_at_period_end);
          if (typeof sub.customer === "string") stripeCustomerId = sub.customer;
        } catch (err) {
          console.warn("[webhook] failed to retrieve subscription", {
            stripeSubscriptionId,
            err: (err as any)?.message || String(err),
          });
        }
      }

      const premiumEntitlementPatch = {
        // canonical app fields
        isPremium: true,
        currentPlan: mappedPlanId,
        subscriptionPlan: mappedPlanId,
        premiumStatus: "active",
        premiumActivatedAt: planStartAt,
        premiumStripeSessionId: stripeSessionId,
        premiumPaymentIntentId: paymentIntentId || null,

        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null,
        subscriptionStatus: "active",
        subscriptionCurrentPeriodStart: planStartAt,
        subscriptionCurrentPeriodEnd: planExpiresAt,
        subscriptionCancelAtPeriodEnd: cancelAtPeriodEnd,
        nextBillingDate: planExpiresAt,
        renewalStatus: cancelAtPeriodEnd ? "canceling" : "active",

        // existing legacy membership fields
        membershipPlanId: mappedPlanId,
        membershipPlanStatus: cancelAtPeriodEnd ? "canceling" : "active",
        membershipPlanDurationDays: 365,
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

      // Plan-to-tier mapping enforcement:
      // premium -> standard, founder -> signature (without downgrading higher active tier)
      const userDoc = await db
        .collection("users")
        .findOne(
          userId && ObjectId.isValid(userId)
            ? { _id: new ObjectId(userId) }
            : { email },
          {
            projection: { blackCardTier: 1, blackCardStatus: 1 },
          },
        );

      const existingTier =
        typeof userDoc?.blackCardTier === "string"
          ? userDoc.blackCardTier.toLowerCase()
          : "";
      const existingActive =
        String(userDoc?.blackCardStatus || "inactive").toLowerCase() ===
        "active";
      const effectiveTierItemId =
        isFounding && existingActive && existingTier === "elite"
          ? "black-card-elite"
          : mappedTierItemId;

      await ensureBlackCardMembershipAndCard({
        db,
        userId,
        email,
        stripeSessionId,
        paymentIntentId: paymentIntentId || null,
        itemId: effectiveTierItemId,
        paidAt: planStartAt,
        planExpiresAt,
      });

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
              blackCardTier: 1,
              blackCardStatus: 1,
            },
          },
        );

      if (
        !membershipInvariant ||
        membershipInvariant.isPremium !== true ||
        membershipInvariant.currentPlan !== mappedPlanId ||
        membershipInvariant.premiumStatus !== "active" ||
        membershipInvariant.membershipPlanId !== mappedPlanId ||
        membershipInvariant.membershipPlanStatus !== "active" ||
        String(
          membershipInvariant.blackCardStatus || "inactive",
        ).toLowerCase() !== "active"
      ) {
        await db.collection("flow_events").insertOne({
          eventType: "paid_plan_black_card_mapping_invariant_failed",
          pageRoute: "/api/stripe/webhook-handler",
          section: "paid_plan_black_card_mapping",
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

      await db.collection("subscription_events").insertOne({
        stripeEventId: event.id,
        stripeEventType: event.type,
        stripeSessionId,
        stripeSubscriptionId: stripeSubscriptionId || null,
        stripeCustomerId: stripeCustomerId || null,
        userId: userId || null,
        email: email || null,
        plan: mappedPlanId,
        status: "active",
        currentPeriodStart: planStartAt,
        currentPeriodEnd: planExpiresAt,
        cancelAtPeriodEnd,
        createdAt: now,
      });

      await sendMembershipEmailSafe({
        to: email || null,
        subject: "BWE membership purchase confirmation",
        text: `Your ${mappedPlanId === "founding" ? "Founding Member" : "Premium"} plan is active. It is ${mappedPlanId === "founding" ? "billed monthly and auto-renews monthly" : "billed annually and auto-renews annually"}. Next billing date: ${planExpiresAt.toLocaleDateString()}.`,
      });

      await pushMembershipNotification(db, {
        userId: userId || null,
        email: email || null,
        type: "membership_purchase_confirmed",
        message: `Your ${mappedPlanId} plan is active. Next billing date: ${planExpiresAt.toLocaleDateString()}.`,
        createdAt: now,
        meta: {
          stripeSessionId,
          stripeSubscriptionId: stripeSubscriptionId || null,
        },
      });

      console.log(
        `✅ Paid plan activated plan=${mappedPlanId} mappedTierItem=${effectiveTierItemId} user=${userId || email}`,
      );
    }

    /**
     * 3.7) BWE Black Card membership entitlement
     */
    if (metaType === "plan" && isBlackCardPlanItemId(normalizedItemId)) {
      const blackCardTier = BLACK_CARD_TIER_BY_ITEM_ID[normalizedItemId];
      const membershipDurationDays =
        parseDurationDays(mergedMeta.durationDays) || 30;
      const planStartAt = paidAt;
      const planExpiresAt = new Date(
        planStartAt.getTime() + membershipDurationDays * 24 * 60 * 60 * 1000,
      );

      const issuance = await ensureBlackCardMembershipAndCard({
        db,
        userId,
        email,
        stripeSessionId,
        paymentIntentId: paymentIntentId || null,
        itemId: normalizedItemId,
        paidAt: planStartAt,
        planExpiresAt,
      });

      await db.collection("flow_events").insertOne({
        eventType: "black_card_membership_activated",
        pageRoute: "/api/stripe/webhook-handler",
        section: "black_card_membership_entitlement",
        source: "stripe_webhook",
        source_variant: "activated",
        stripeSessionId,
        paymentIntentId: paymentIntentId || null,
        userId: userId || null,
        email: email || null,
        itemId: normalizedItemId,
        tier: blackCardTier,
        membershipId: issuance.ok ? issuance.membershipId : null,
        cardIdDisplay: issuance.ok ? issuance.cardIdDisplay : null,
        createdAt: now,
      });

      console.log(
        `✅ BWE Black Card activated tier=${blackCardTier} user=${userId || email} card=${issuance.ok ? issuance.cardIdDisplay : "n/a"}`,
      );
    }

    /**
     * 4) Marketplace order checkout fulfillment
     * Canonical transition target: paid -> fulfilled_payout_(ready|pending)
     */
    if (metaType === "product") {
      let targetOrderId = asString(mergedMeta.orderId);
      let fulfillmentMethod = "order_id_metadata";

      if (!targetOrderId) {
        const orderBySession = await db
          .collection("orders")
          .findOne({ sessionId: stripeSessionId }, { projection: { _id: 1 } });

        if (orderBySession?._id) {
          targetOrderId = idToString(orderBySession._id);
          fulfillmentMethod = "session_id_fallback";

          await db.collection("flow_events").insertOne({
            eventType: "marketplace_order_fulfilled_via_session_fallback",
            pageRoute: "/api/stripe/webhook-handler",
            section: "marketplace_webhook_fallback",
            source: "stripe_webhook",
            source_variant: "session_id_fallback",
            stripeSessionId,
            orderId: targetOrderId,
            paymentIntentId: paymentIntentId || null,
            createdAt: now,
          });
        }
      }

      if (!targetOrderId) {
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

        await emitMarketplaceReconciliationException({
          db,
          eventType: "marketplace_order_missing_on_paid_webhook",
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          detail: "Paid marketplace webhook missing linked orderId",
          createdAt: now,
        });
      } else {
        const webhookBuyerEmail = asString(
          (session as any)?.customer_details?.email ||
            (session as any)?.customer_email,
        ).toLowerCase();
        const webhookBuyerName = asString(
          (session as any)?.customer_details?.name,
        );

        if (webhookBuyerEmail || webhookBuyerName) {
          const orderOid = ObjectId.isValid(targetOrderId)
            ? new ObjectId(targetOrderId)
            : null;
          if (orderOid) {
            await db.collection("orders").updateOne(
              { _id: orderOid },
              {
                $set: {
                  ...(webhookBuyerEmail
                    ? { buyerEmail: webhookBuyerEmail }
                    : {}),
                  ...(webhookBuyerName ? { buyerName: webhookBuyerName } : {}),
                  updatedAt: now,
                },
              },
            );
          }
        }

        const refreshedOrderRecord = await db
          .collection("orders")
          .findOne(
            ObjectId.isValid(targetOrderId)
              ? { _id: new ObjectId(targetOrderId) }
              : { _id: targetOrderId as any },
          );

        const reconciledBuyerId =
          asString(refreshedOrderRecord?.userId) ||
          asString(refreshedOrderRecord?.buyerUserId) ||
          userId ||
          asString(existingPayment?.userId);

        const reconciledProductId =
          idToString(refreshedOrderRecord?.productId) ||
          asString(mergedMeta.itemId || existingPayment?.itemId);
        const reconciledSellerId =
          idToString(refreshedOrderRecord?.sellerId) ||
          asString((mergedMeta as any).sellerId);

        const paymentRecord = await upsertMarketplacePaymentRecord({
          db,
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          paidAt,
          orderId: targetOrderId,
          productId: reconciledProductId,
          sellerId: reconciledSellerId,
          payoutMode: asString(refreshedOrderRecord?.payoutMode),
          amountTotal: deriveMarketplaceAmountTotal({
            session,
            existingAmountCents: existingPayment?.amountCents ?? null,
            orderRecord: refreshedOrderRecord as any,
          }),
          currency: session.currency || "usd",
          buyerUserId: reconciledBuyerId || null,
          buyerEmail: email || null,
          webhookEventId: event.id,
          webhookEventType: event.type,
        });

        if (!paymentRecord.orderId || !paymentRecord.metadata?.orderId) {
          await emitMarketplaceReconciliationException({
            db,
            eventType: "marketplace_payment_order_link_missing",
            stripeSessionId,
            paymentIntentId: paymentIntentId || null,
            orderId: targetOrderId,
            productId: reconciledProductId || null,
            sellerId: reconciledSellerId || null,
            detail:
              "Marketplace payment record missing order linkage after upsert",
            createdAt: now,
          });

          await db.collection("payments").updateOne(
            { stripeSessionId },
            {
              $set: {
                fulfillmentStatus: "failed",
                orderFulfillmentMethod: "payment_reconciliation_failed",
                orderFulfillmentCode: "PAYMENT_ORDER_LINK_MISSING",
                updatedAt: now,
              },
            },
          );
        } else {
          const fulfillment = await dbFulfillOrder(
            targetOrderId,
            paymentIntentId,
          );

          if (!fulfillment.ok) {
            const eventTypeByCode: Record<string, string> = {
              ORDER_NOT_FOUND: "marketplace_order_missing_on_paid_webhook",
              MISSING_PRODUCT: "marketplace_order_product_linkage_missing",
              OUT_OF_STOCK: "marketplace_stock_decrement_failed",
              NON_CANONICAL_ORDER_STATE:
                "marketplace_order_non_canonical_state_detected",
            };

            await db.collection("flow_events").insertOne({
              eventType:
                eventTypeByCode[fulfillment.code] ||
                "marketplace_order_fulfillment_failed",
              pageRoute: "/api/stripe/webhook-handler",
              section: "marketplace_webhook_invariant",
              source: "stripe_webhook",
              source_variant: fulfillment.code.toLowerCase(),
              stripeSessionId,
              paymentIntentId: paymentIntentId || null,
              orderId: targetOrderId,
              productId: fulfillment.productId || null,
              orderState: fulfillment.orderState || null,
              createdAt: now,
            });

            await db.collection("payments").updateOne(
              { stripeSessionId },
              {
                $set: {
                  fulfillmentStatus: "failed",
                  orderFulfillmentMethod: fulfillmentMethod,
                  orderFulfillmentCode: fulfillment.code,
                  updatedAt: now,
                },
              },
            );

            console.warn(
              `⚠️ Product order fulfillment blocked order=${targetOrderId} code=${fulfillment.code}`,
            );
          } else {
            await db.collection("payments").updateOne(
              { stripeSessionId },
              {
                $set: {
                  fulfillmentStatus: "fulfilled",
                  orderFulfillmentMethod: fulfillmentMethod,
                  orderFulfillmentCode: "UPDATED",
                  canonicalOrderState: fulfillment.orderState || null,
                  payoutReady: Boolean(fulfillment.payoutReady),
                  stockDecremented: Boolean(fulfillment.stockDecremented),
                  reconciliationException:
                    fulfillment.reconciliationException || null,
                  fulfilledAt: now,
                  updatedAt: now,
                },
              },
            );

            await db.collection("flow_events").insertOne({
              eventType: "marketplace_order_fulfilled",
              pageRoute: "/api/stripe/webhook-handler",
              section: "marketplace_order_fulfillment",
              source: "stripe_webhook",
              source_variant: fulfillmentMethod,
              stripeSessionId,
              paymentIntentId: paymentIntentId || null,
              orderId: targetOrderId,
              productId: fulfillment.productId || null,
              orderState: fulfillment.orderState || null,
              payoutReady: Boolean(fulfillment.payoutReady),
              stockDecremented: Boolean(fulfillment.stockDecremented),
              reconciliationException:
                fulfillment.reconciliationException || null,
              createdAt: now,
            });

            console.log(
              `✅ Product order fulfilled order=${targetOrderId} state=${fulfillment.orderState} payoutReady=${Boolean(fulfillment.payoutReady)}`,
            );
          }
        }
      }
    }

    /**
     * 5) Course purchase (existing)
     */
    const resolvedCourseId =
      asString(mergedMeta.courseId || "") ||
      (metaType === "course" ? normalizedItemId : "");

    if (resolvedCourseId) {
      const courseUserId = await resolveEntitlementUserId(db, userId, email);

      if (courseUserId) {
        await db.collection("flow_events").insertOne({
          eventType: "course_entitlement_upsert_attempted",
          pageRoute: "/api/stripe/webhook-handler",
          section: "course_webhook_fulfillment",
          source: "stripe_webhook",
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          userId: courseUserId,
          email: email || null,
          courseId: resolvedCourseId,
          createdAt: now,
        });

        await grantCourseAccess(courseUserId, resolvedCourseId, {
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          source: "stripe_webhook",
          paymentStatus: "paid",
          purchasedAt: paidAt,
          email: email || null,
          courseName: asString(
            mergedMeta.courseName || mergedMeta.itemName || resolvedCourseId,
          ),
          sendAccessEmail: true,
        });

        await db.collection("payments").updateOne(
          { stripeSessionId },
          {
            $set: {
              fulfillmentStatus: "fulfilled",
              entitlementStatus: "granted",
              lastReconciledAt: now,
              updatedAt: now,
            },
          },
        );

        console.log(
          `✅ Granted course ${resolvedCourseId} to user ${courseUserId}`,
        );
      } else {
        await db.collection("flow_events").insertOne({
          eventType: "course_paid_webhook_missing_user",
          pageRoute: "/api/stripe/webhook-handler",
          section: "course_webhook_invariant",
          source: "stripe_webhook",
          source_variant: "missing_user",
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          courseId: resolvedCourseId,
          email: email || null,
          createdAt: now,
        });
        console.warn(
          `⚠️ Course paid webhook missing resolvable user session=${stripeSessionId} course=${resolvedCourseId}`,
        );
      }
    }

    /**
     * 6) Paid job posting completion (existing canonical job checkout)
     */
    if (metaType === "job") {
      const jobFilter =
        jobId && ObjectId.isValid(jobId)
          ? { _id: new ObjectId(jobId) }
          : { stripeSessionId };

      const jobItemId = asString(mergedMeta.itemId || normalizedItemId);
      const isFeaturedJob =
        jobItemId === "job-featured-post" ||
        jobItemId === "job-posting-featured";
      const featuredDays = 30;
      const featureEndDate = isFeaturedJob
        ? new Date(now.getTime() + featuredDays * 24 * 60 * 60 * 1000)
        : null;

      const jobUpdate = await db.collection("jobs").updateOne(jobFilter, {
        $set: {
          isPaid: true,
          paymentStatus: "paid",
          status: "pending_approval",
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          paidAt,
          updatedAt: now,
          listingTier: isFeaturedJob ? "featured" : "standard",
          isFeatured: isFeaturedJob,
          ...(isFeaturedJob ? { featureEndDate } : { featureEndDate: null }),
        },
      });

      if (jobUpdate.matchedCount > 0) {
        if (jobId && ObjectId.isValid(jobId)) {
          console.log(`✅ Paid job posting marked paid jobId=${jobId}`);
        } else {
          await db.collection("flow_events").insertOne({
            eventType: "job_paid_webhook_session_fallback",
            pageRoute: "/api/stripe/webhook-handler",
            section: "job_webhook_fallback",
            source: "stripe_webhook",
            source_variant: "session_id_fallback",
            stripeSessionId,
            paymentIntentId: paymentIntentId || null,
            createdAt: now,
          });
          console.log(
            `✅ Paid job posting marked paid via session fallback session=${stripeSessionId}`,
          );
        }
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
          `⚠️ Job paid webhook missing job target session=${stripeSessionId}`,
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
