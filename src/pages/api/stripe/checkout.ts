import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import {
  getAdItemName,
  getAdPriceCents,
  getAdQuote,
} from "@/lib/advertising/pricing";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import { createProductCheckoutSessionCore } from "@/lib/checkout/createProductCheckoutSession";
import {
  BLACK_CARD_TIERS,
  BLACK_CARD_TIER_BY_ITEM_ID,
  isBlackCardPlanItemId,
} from "@/lib/black-card";
import {
  FOUNDING_MEMBERSHIP_CURRENCY,
  FOUNDING_MEMBERSHIP_ITEM_ID,
  FOUNDING_MEMBERSHIP_NAME,
  FOUNDING_MEMBERSHIP_PILOT_LIMIT,
  FOUNDING_MEMBERSHIP_PRICE_CENTS,
  FOUNDING_MEMBERSHIP_PRODUCT_KEY,
  countActiveFoundingMemberships,
  getClaimableBusinessById,
  isFoundingMembershipItemId,
} from "@/lib/founding-membership";
import { getStripeSecretKey } from "@/lib/stripeSecret";
import {
  checkoutTypeToRevenueType,
  computeRevenueSplit,
} from "@/lib/payments/revenue";

const stripeSecret = getStripeSecretKey();
const stripe = new Stripe(stripeSecret || "sk_missing", {
  apiVersion: "2025-02-24.acacia" as any,
});

type CheckoutType = "ad" | "product" | "plan" | "course" | "job";

interface CheckoutPayload {
  userId?: string; // dev fallback only
  itemId: string; // product ObjectId or slug, or ad plan id
  type: CheckoutType;

  // preferred top-level fields (used now)
  durationDays?: number | string;
  businessId?: string;
  campaignId?: string;
  placement?: string;
  jobId?: string;

  // backward compatibility / extra metadata
  metadata?: Record<string, unknown>;

  // legacy client fields (ignored for pricing/redirect authority)
  amount?: number;
  successUrl?: string;
  cancelUrl?: string;
}

function withCheckoutSessionId(url: string) {
  const joiner = url.includes("?") ? "&" : "?";
  return url.includes("session_id=")
    ? url
    : `${url}${joiner}session_id={CHECKOUT_SESSION_ID}`;
}

function getOrigin(req: NextApiRequest) {
  const prod = "https://www.blackwealthexchange.com";
  if (process.env.NODE_ENV === "production") return prod;

  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    req.headers.host ||
    "localhost:3000";
  return `${proto}://${host}`;
}

function firstString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function parseOptionalPositiveInt(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return undefined;
}

/**
 * Normalize old/legacy ad item IDs so old buttons and pages still work.
 * This keeps BuyNowButton + older ad pages from breaking pricing lookup.
 */
function normalizeAdItemId(raw: string) {
  const item = raw.trim();

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

function sha256Hex(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function buildCheckoutFingerprint(input: {
  userId: string;
  email: string;
  type: CheckoutType;
  itemId: string;
  amountCents: number;
  durationDays?: number;
  businessId?: string;
  campaignId?: string;
  placement?: string;
}) {
  return [
    input.type,
    input.userId || "",
    (input.email || "").toLowerCase(),
    input.itemId || "",
    String(input.amountCents || 0),
    String(input.durationDays ?? ""),
    input.businessId || "",
    input.campaignId || "",
    input.placement || "",
  ].join("|");
}

function getAccountCollectionName(accountType?: string) {
  return accountType === "seller"
    ? "sellers"
    : accountType === "employer"
      ? "employers"
      : accountType === "business"
        ? "businesses"
        : "users";
}

function isPremiumActiveFromDoc(doc: any) {
  if (!doc || typeof doc !== "object") return false;

  const currentPlan =
    typeof doc.currentPlan === "string" ? doc.currentPlan.toLowerCase() : "";

  const premiumStatus =
    typeof doc.premiumStatus === "string"
      ? doc.premiumStatus.toLowerCase()
      : "";

  return (
    doc.isPremium === true ||
    currentPlan === "premium" ||
    currentPlan === "founding" ||
    premiumStatus === "active"
  );
}

function isWealthBuilderPremiumEntitlementActive(doc: any) {
  if (!doc || typeof doc !== "object") return false;

  const productKey =
    typeof doc.productKey === "string" ? doc.productKey.toLowerCase() : "";
  const tier = typeof doc.tier === "string" ? doc.tier.toLowerCase() : "";
  const status = typeof doc.status === "string" ? doc.status.toLowerCase() : "";

  return (
    productKey === "wealth_builder_premium" &&
    tier === "premium" &&
    (status === "active" || status === "trialing")
  );
}

function isBlackCardTierActiveFromDoc(doc: any, requestedTier: string) {
  if (!doc || typeof doc !== "object") return false;

  const normalizedTier =
    typeof doc.blackCardTier === "string"
      ? doc.blackCardTier.toLowerCase()
      : "";
  const normalizedStatus =
    typeof doc.blackCardStatus === "string"
      ? doc.blackCardStatus.toLowerCase()
      : "inactive";

  return normalizedTier === requestedTier && normalizedStatus === "active";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!stripeSecret) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const payload = req.body as CheckoutPayload;

  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  const cookieAccountType = cookies.accountType || "user";

  let sessionUserId = "";
  let sessionEmail = "";
  let sessionAccountType = cookieAccountType;

  if (token) {
    try {
      const SECRET = getJwtSecret();
      if (!SECRET) throw new Error("JWT_SECRET is not set");

      const decoded = jwt.verify(token, SECRET as string) as any;
      sessionUserId = decoded?.userId;
      sessionEmail = decoded?.email || "";
      sessionAccountType = decoded?.accountType || cookieAccountType || "user";

      if (!sessionUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } catch (err) {
      console.error("JWT decode error:", err);
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else if (
    process.env.NODE_ENV !== "production" &&
    typeof payload.userId === "string"
  ) {
    sessionUserId = payload.userId;
    sessionAccountType = cookieAccountType || "user";
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { itemId, type } = payload;

  if (typeof itemId !== "string" || typeof type !== "string") {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  const metadataIn = payload.metadata || {};
  const requestedDurationDays = parseOptionalPositiveInt(
    payload.durationDays,
    metadataIn.durationDays,
  );
  const requestedBusinessId = firstString(
    payload.businessId,
    metadataIn.businessId,
  );
  const requestedCampaignId = firstString(
    payload.campaignId,
    metadataIn.campaignId,
  );
  const requestedPlacement = firstString(
    payload.placement,
    metadataIn.placement,
  );
  const requestedJobId = firstString(payload.jobId, metadataIn.jobId);

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const payments = db.collection("payments");

    if (type === "product") {
      const result = await createProductCheckoutSessionCore({
        req,
        db,
        productId: itemId,
        stripe,
      });

      if (result.status === 429 && result.body?.retryAfterSeconds) {
        res.setHeader("Retry-After", String(result.body.retryAfterSeconds));
      }

      return res.status(result.status).json(result.body);
    }

    const origin = getOrigin(req);

    let successUrl = withCheckoutSessionId(`${origin}/payment-success`);
    let cancelUrl = `${origin}/payment-cancel`;

    const isAd = type === "ad";

    let itemName = `${type} purchase`;
    let stripeAccountId = "";
    let isPlatformAccount = true;
    let unitAmount = 0;

    let normalizedDurationDays: number | undefined = requestedDurationDays;
    const normalizedBusinessId = requestedBusinessId || "";
    const normalizedCampaignId = requestedCampaignId || "";
    const normalizedPlacement = requestedPlacement || "";
    let normalizedJobId = requestedJobId || "";

    let finalItemId = itemId;

    const userObjectId = ObjectId.isValid(sessionUserId)
      ? new ObjectId(sessionUserId)
      : null;

    if (isAd) {
      const adItemId = normalizeAdItemId(itemId);
      finalItemId = adItemId;

      const quote = getAdQuote({
        option: adItemId,
        durationDays: requestedDurationDays,
      });

      if (!quote) {
        return res.status(400).json({
          error: "Invalid advertising option or duration",
        });
      }

      itemName = quote.label || getAdItemName(adItemId);
      unitAmount = getAdPriceCents({
        option: adItemId,
        durationDays: quote.durationDays,
      });
      normalizedDurationDays = quote.durationDays;

      stripeAccountId = process.env.PLATFORM_STRIPE_ACCOUNT_ID as string;
      if (!stripeAccountId) {
        console.error("Missing PLATFORM_STRIPE_ACCOUNT_ID");
        return res
          .status(500)
          .json({ error: "Platform Stripe account not configured" });
      }

      isPlatformAccount = true;
    } else if (type === "plan") {
      const planMap: Record<
        string,
        {
          amount: number;
          name: string;
          billingInterval?: "monthly" | "annual" | null;
        }
      > = {
        premium: {
          amount: 1200,
          name: "Plan Upgrade (premium)",
          billingInterval: "annual",
        },
        founder: {
          amount: 4900,
          name: "Plan Upgrade (founder)",
          billingInterval: "annual",
        },
        "music-creator-starter": {
          amount: 2900,
          name: "Plan Upgrade (music-creator-starter)",
          billingInterval: null,
        },
        "music-creator-pro": {
          amount: 7900,
          name: "Plan Upgrade (music-creator-pro)",
          billingInterval: null,
        },

        // Wealth Builder Premium
        "wealth-builder-premium-monthly": {
          amount: 899,
          name: "Wealth Builder Premium (Monthly)",
          billingInterval: "monthly",
        },
        "wealth-builder-premium-annual": {
          amount: 7900,
          name: "Wealth Builder Premium (Annual)",
          billingInterval: "annual",
        },

        // BWE Black Card membership tiers
        "black-card-standard": {
          amount: Number(BLACK_CARD_TIERS.standard.priceCents || 0),
          name: BLACK_CARD_TIERS.standard.label,
          billingInterval: null,
        },
        "black-card-signature": {
          amount: Number(BLACK_CARD_TIERS.signature.priceCents || 0),
          name: BLACK_CARD_TIERS.signature.label,
          billingInterval: "monthly",
        },
        "black-card-elite": {
          amount: Number(BLACK_CARD_TIERS.elite.priceCents || 0),
          name: BLACK_CARD_TIERS.elite.label,
          billingInterval: "monthly",
        },
        [FOUNDING_MEMBERSHIP_ITEM_ID]: {
          amount: FOUNDING_MEMBERSHIP_PRICE_CENTS,
          name: FOUNDING_MEMBERSHIP_NAME,
          billingInterval: "monthly",
        },
      };

      const plan = planMap[itemId];
      if (!plan) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      unitAmount = plan.amount;
      itemName = plan.name;
      isPlatformAccount = true;
      stripeAccountId = process.env.PLATFORM_STRIPE_ACCOUNT_ID as string;

      if (itemId.startsWith("music-creator-")) {
        successUrl = withCheckoutSessionId(`${origin}/music/join?activated=1`);
        cancelUrl = `${origin}/music/pricing?canceled=1`;
      }

      if (
        itemId === "wealth-builder-premium-monthly" ||
        itemId === "wealth-builder-premium-annual"
      ) {
        successUrl = withCheckoutSessionId(
          `${origin}/wealth-builder/upgrade?checkout=success`,
        );
        cancelUrl = `${origin}/wealth-builder/upgrade?checkout=cancel`;
      }

      if (isBlackCardPlanItemId(itemId)) {
        successUrl = withCheckoutSessionId(
          `${origin}/black-card/join?tier=${BLACK_CARD_TIER_BY_ITEM_ID[itemId]}&checkout=success`,
        );
        cancelUrl = `${origin}/black-card/join?tier=${BLACK_CARD_TIER_BY_ITEM_ID[itemId]}&checkout=cancel`;
      }

      if (isFoundingMembershipItemId(itemId)) {
        successUrl = withCheckoutSessionId(
          `${origin}/payment-success?context=founding-membership&businessId=${encodeURIComponent(normalizedBusinessId)}`,
        );
        cancelUrl = `${origin}/payment-cancel?context=founding-membership&businessId=${encodeURIComponent(normalizedBusinessId)}`;
      }
    } else if (type === "course") {
      const courseMap: Record<string, { name: string; amount: number }> = {
        "financial-literacy-premium": {
          name: "Premium Financial Literacy Course",
          amount: 4900,
        },
        "personal-finance-101": { name: "Personal Finance 101", amount: 2900 },
        "investing-for-beginners": {
          name: "Investing for Beginners",
          amount: 3900,
        },
        "generational-wealth": {
          name: "Building Generational Wealth",
          amount: 4900,
        },
      };

      const course = courseMap[itemId];
      if (!course) return res.status(400).json({ error: "Invalid course" });

      unitAmount = course.amount;
      itemName = course.name;
      isPlatformAccount = true;
      stripeAccountId = process.env.PLATFORM_STRIPE_ACCOUNT_ID as string;
    } else if (type === "job") {
      const jobMap: Record<string, { name: string; amount: number }> = {
        "job-posting-standard": {
          name: "Job Posting (Standard)",
          amount: 19900,
        },
        "job-posting-featured": {
          name: "Job Posting (Featured)",
          amount: 79900,
        },
        "job-standard-post": {
          name: "Job Posting (Standard)",
          amount: 2999,
        },
        "job-featured-post": {
          name: "Job Posting (Featured)",
          amount: 7999,
        },
      };

      const job = jobMap[itemId];
      if (!job) {
        return res.status(400).json({ error: "Invalid job posting type" });
      }

      unitAmount = job.amount;
      itemName = job.name;
      isPlatformAccount = true;
      stripeAccountId = process.env.PLATFORM_STRIPE_ACCOUNT_ID as string;

      if (!normalizedJobId) {
        const draft = await db.collection("jobs").insertOne({
          title: `${job.name} (Payment Draft)`,
          company: "Pending",
          location: "TBD",
          description: "Auto-created paid job draft before checkout.",
          requirements: "",
          accountType: "employer",
          email: sessionEmail || null,
          employerId: userObjectId || sessionUserId,
          userId: sessionUserId,
          status: "pending_payment",
          isPaid: false,
          paymentStatus: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            source: "stripe_checkout_job_draft",
            itemId,
          },
        });
        normalizedJobId = String(draft.insertedId);
      }
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return res.status(400).json({ error: "Invalid checkout amount" });
    }

    if (unitAmount > 5_000_000) {
      return res
        .status(400)
        .json({ error: "Checkout amount exceeds allowed maximum" });
    }

    const metadata: Record<string, string> = {
      userId: sessionUserId,
      itemId: finalItemId,
      type,
      accountType: sessionAccountType,
      durationDays:
        typeof normalizedDurationDays === "number"
          ? String(normalizedDurationDays)
          : "",
      businessId: normalizedBusinessId,
      campaignId: normalizedCampaignId,
      placement: normalizedPlacement,
      jobId: normalizedJobId,
    };

    if (type === "course") {
      metadata.courseId = finalItemId;
    }

    if (
      type === "plan" &&
      (finalItemId === "wealth-builder-premium-monthly" ||
        finalItemId === "wealth-builder-premium-annual")
    ) {
      metadata.productKey = "wealth_builder_premium";
      metadata.tier = "premium";
      metadata.billingInterval =
        finalItemId === "wealth-builder-premium-annual" ? "annual" : "monthly";
    }

    if (
      type === "plan" &&
      (finalItemId === "premium" || finalItemId === "founder")
    ) {
      metadata.productKey = "bwe_membership";
      metadata.tier = finalItemId === "founder" ? "founding" : "premium";
      metadata.billingInterval = "annual";
    }

    if (type === "plan" && isBlackCardPlanItemId(finalItemId)) {
      const blackCardTier = BLACK_CARD_TIER_BY_ITEM_ID[finalItemId];
      metadata.productKey = "bwe_black_card";
      metadata.tier = blackCardTier;
      metadata.billingInterval = "annual";
    }

    if (type === "plan" && isFoundingMembershipItemId(finalItemId)) {
      metadata.productKey = FOUNDING_MEMBERSHIP_PRODUCT_KEY;
      metadata.tier = "founding";
      metadata.billingInterval = "monthly";
      metadata.membershipName = FOUNDING_MEMBERSHIP_NAME;
      metadata.businessId = normalizedBusinessId || "";
      metadata.membershipContext = "founding_business_growth";
    }

    // ---------------------------------------------------------
    // PLAN GUARD (server-side)
    // ---------------------------------------------------------
    if (
      type === "plan" &&
      (finalItemId === "premium" ||
        finalItemId === "wealth-builder-premium-monthly" ||
        finalItemId === "wealth-builder-premium-annual" ||
        isBlackCardPlanItemId(finalItemId) ||
        isFoundingMembershipItemId(finalItemId))
    ) {
      const accountCollectionName =
        getAccountCollectionName(sessionAccountType);

      const accountQuery = {
        $or: [
          ...(userObjectId ? [{ _id: userObjectId }] : []),
          ...(sessionEmail ? [{ email: sessionEmail }] : []),
        ],
      };

      let accountDoc = await db
        .collection(accountCollectionName)
        .findOne(accountQuery);

      if (!accountDoc && accountCollectionName !== "users") {
        accountDoc = await db.collection("users").findOne(accountQuery);
      }

      if (finalItemId === "premium" && isPremiumActiveFromDoc(accountDoc)) {
        return res.status(409).json({
          error: "Premium account already active",
          code: "PREMIUM_ALREADY_ACTIVE",
        });
      }

      if (
        finalItemId === "wealth-builder-premium-monthly" ||
        finalItemId === "wealth-builder-premium-annual"
      ) {
        if (sessionAccountType !== "user") {
          return res.status(403).json({
            error:
              "Wealth Builder Premium is only available for personal user accounts",
            code: "WEALTH_BUILDER_USER_ACCOUNT_REQUIRED",
          });
        }

        const existingEntitlement = await db
          .collection("user_entitlements")
          .findOne({
            userId: sessionUserId,
            accountType: "user",
            productKey: "wealth_builder_premium",
          });

        if (isWealthBuilderPremiumEntitlementActive(existingEntitlement)) {
          return res.status(409).json({
            error: "Wealth Builder Premium is already active",
            code: "WEALTH_BUILDER_PREMIUM_ALREADY_ACTIVE",
          });
        }
      }

      if (isBlackCardPlanItemId(finalItemId)) {
        if (sessionAccountType !== "user") {
          return res.status(403).json({
            error:
              "BWE Black Card membership is currently available for personal user accounts",
            code: "BLACK_CARD_USER_ACCOUNT_REQUIRED",
          });
        }

        const requestedTier = BLACK_CARD_TIER_BY_ITEM_ID[finalItemId];
        if (isBlackCardTierActiveFromDoc(accountDoc, requestedTier)) {
          return res.status(409).json({
            error: `BWE Black Card ${requestedTier} is already active`,
            code: "BLACK_CARD_TIER_ALREADY_ACTIVE",
          });
        }
      }

      if (isFoundingMembershipItemId(finalItemId)) {
        if (!normalizedBusinessId) {
          return res.status(400).json({
            error: "A claimable business must be selected first",
            code: "FOUNDING_MEMBERSHIP_BUSINESS_REQUIRED",
          });
        }

        const claimableBusiness = await getClaimableBusinessById(
          db,
          normalizedBusinessId,
        );
        if (!claimableBusiness) {
          return res.status(404).json({
            error: "Selected business is not publicly claimable",
            code: "FOUNDING_MEMBERSHIP_BUSINESS_NOT_CLAIMABLE",
          });
        }

        const activePilotCount = await countActiveFoundingMemberships(db);
        if (activePilotCount >= FOUNDING_MEMBERSHIP_PILOT_LIMIT) {
          return res.status(409).json({
            error: "The founding membership pilot is currently full",
            code: "FOUNDING_MEMBERSHIP_PILOT_FULL",
          });
        }

        const existingMembership = await db
          .collection("business_memberships")
          .findOne({
            productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
            businessId: normalizedBusinessId,
            membershipStatus: { $in: ["active", "past_due"] },
          });
        if (existingMembership) {
          return res.status(409).json({
            error:
              "This business already has an active or pending paid founding membership",
            code: "FOUNDING_MEMBERSHIP_ALREADY_ACTIVE",
          });
        }

        const existingClaimLock = await db
          .collection("business_claims")
          .findOne({
            businessId: normalizedBusinessId,
            productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY,
            claimStatus: {
              $in: [
                "claim_initiated",
                "ownership_verification_pending",
                "additional_evidence_required",
                "ownership_verified",
                "disputed",
              ],
            },
          });
        if (existingClaimLock) {
          return res.status(409).json({
            error:
              "This business already has an ownership verification in progress and cannot be claimed again",
            code: "FOUNDING_MEMBERSHIP_CLAIM_LOCKED",
          });
        }
      }
    }

    // ---------------------------------------------------------
    // P0 DUPLICATE GUARD (server-side)
    // ---------------------------------------------------------
    if (type === "ad") {
      const createdAfter = new Date(Date.now() - 60_000);

      const expectedDuration =
        typeof normalizedDurationDays === "number"
          ? normalizedDurationDays
          : null;
      const expectedBusinessId = normalizedBusinessId || null;
      const expectedCampaignId = normalizedCampaignId || null;
      const expectedPlacement = normalizedPlacement || null;

      const existingRecent = await payments.findOne(
        {
          type: "ad",
          itemId: finalItemId,
          amountCents: unitAmount,
          userId: sessionUserId,
          createdAt: { $gte: createdAfter },
          status: {
            $in: ["pending", "paid", "processing", "duplicate_pending_refund"],
          },
          "metadata.durationDays": expectedDuration,
          "metadata.businessId": expectedBusinessId,
          "metadata.campaignId": expectedCampaignId,
          "metadata.placement": expectedPlacement,
        },
        { sort: { createdAt: -1 } },
      );

      if (existingRecent?.stripeSessionId) {
        if (existingRecent.status === "paid") {
          return res.status(409).json({
            error:
              "A matching payment was already completed. Please refresh your dashboard.",
            duplicateGuard: true,
            existingStatus: existingRecent.status,
            stripeSessionId: existingRecent.stripeSessionId,
          });
        }

        try {
          const existingSession = await stripe.checkout.sessions.retrieve(
            existingRecent.stripeSessionId,
          );

          if (existingSession?.url && existingSession.status === "open") {
            return res.status(200).json({
              sessionId: existingSession.id,
              url: existingSession.url,
              reused: true,
            });
          }
        } catch (sessionErr) {
          console.warn(
            "Duplicate guard: unable to retrieve existing Stripe session:",
            sessionErr,
          );
        }

        return res.status(409).json({
          error:
            "A checkout attempt is already in progress. Please wait a moment and try again.",
          duplicateGuard: true,
          existingStatus: existingRecent.status || "pending",
          stripeSessionId: existingRecent.stripeSessionId,
        });
      }
    }

    const revenueType = checkoutTypeToRevenueType(type, finalItemId);
    const split = computeRevenueSplit(revenueType, unitAmount);

    const checkoutFingerprint = buildCheckoutFingerprint({
      userId: sessionUserId,
      email: sessionEmail,
      type,
      itemId: finalItemId,
      amountCents: unitAmount,
      durationDays: normalizedDurationDays,
      businessId: normalizedBusinessId,
      campaignId: normalizedCampaignId,
      placement: normalizedPlacement,
    });

    metadata.checkoutFingerprint = checkoutFingerprint;

    const minuteBucket = Math.floor(Date.now() / 60_000);
    const idempotencyKey = `checkout:${sha256Hex(
      `${checkoutFingerprint}|${minuteBucket}`,
    )}`;

    const isAnnualMembershipSubscription =
      type === "plan" &&
      (finalItemId === "premium" || finalItemId === "founder");

    const isFoundingMembershipSubscription =
      type === "plan" && isFoundingMembershipItemId(finalItemId);

    const baseParams: Stripe.Checkout.SessionCreateParams = {
      mode:
        isAnnualMembershipSubscription || isFoundingMembershipSubscription
          ? "subscription"
          : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: itemName },
            unit_amount: unitAmount,
            ...(isAnnualMembershipSubscription
              ? { recurring: { interval: "year" as const, interval_count: 1 } }
              : isFoundingMembershipSubscription
                ? {
                    recurring: {
                      interval: "month" as const,
                      interval_count: 1,
                    },
                  }
                : {}),
          },
          quantity: 1,
        },
      ],
      ...(sessionEmail ? { customer_email: sessionEmail } : {}),
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: sessionUserId,
      ...(isAnnualMembershipSubscription || isFoundingMembershipSubscription
        ? {
            subscription_data: {
              metadata,
            },
          }
        : {
            payment_intent_data: {
              metadata,
              ...(isPlatformAccount
                ? {}
                : {
                    application_fee_amount: Math.round(unitAmount * 0.12),
                    transfer_data: { destination: stripeAccountId },
                  }),
            },
          }),
    };

    const stripeSession = await stripe.checkout.sessions.create(baseParams, {
      idempotencyKey,
    });

    if (
      type === "job" &&
      normalizedJobId &&
      ObjectId.isValid(normalizedJobId)
    ) {
      await db.collection("jobs").updateOne(
        { _id: new ObjectId(normalizedJobId) },
        {
          $set: {
            stripeSessionId: stripeSession.id,
            paymentStatus: "pending",
            updatedAt: new Date(),
          },
        },
      );
    }

    await payments.updateOne(
      { stripeSessionId: stripeSession.id },
      {
        $setOnInsert: {
          stripeSessionId: stripeSession.id,
          paymentIntentId:
            typeof stripeSession.payment_intent === "string"
              ? stripeSession.payment_intent
              : null,
          userId: sessionUserId,
          userObjectId,
          email: sessionEmail || null,
          type,
          itemId: finalItemId,
          amountCents: unitAmount,
          grossAmountCents: unitAmount,
          netAmountCents: split.netAmount,
          refundedAmountCents: 0,
          bweRetainedAmountCents: split.bweFee,
          bweFee: split.bweFee,
          bweFeePercent: split.bweFeePercent,
          payout: split.sellerPayout,
          status: "pending",
          paymentStatus: "pending",
          currency: FOUNDING_MEMBERSHIP_CURRENCY,
          createdAt: new Date(),
          metadata: {
            durationDays:
              typeof normalizedDurationDays === "number"
                ? normalizedDurationDays
                : null,
            businessId: normalizedBusinessId || null,
            campaignId: normalizedCampaignId || null,
            placement: normalizedPlacement || null,
            jobId: normalizedJobId || null,
            checkoutFingerprint,
            grossAmount: split.grossAmount,
            netAmount: split.netAmount,
            productKey:
              type === "plan" &&
              (finalItemId === "wealth-builder-premium-monthly" ||
                finalItemId === "wealth-builder-premium-annual")
                ? "wealth_builder_premium"
                : type === "plan" && isBlackCardPlanItemId(finalItemId)
                  ? "bwe_black_card"
                  : null,
            tier:
              type === "plan" &&
              (finalItemId === "wealth-builder-premium-monthly" ||
                finalItemId === "wealth-builder-premium-annual")
                ? "premium"
                : type === "plan" && isBlackCardPlanItemId(finalItemId)
                  ? BLACK_CARD_TIER_BY_ITEM_ID[finalItemId]
                  : null,
            billingInterval:
              type === "plan" &&
              (finalItemId === "premium" || finalItemId === "founder")
                ? "annual"
                : type === "plan" &&
                    finalItemId === "wealth-builder-premium-annual"
                  ? "annual"
                  : type === "plan" &&
                      finalItemId === "wealth-builder-premium-monthly"
                    ? "monthly"
                    : type === "plan" && isBlackCardPlanItemId(finalItemId)
                      ? "annual"
                      : type === "plan" &&
                          isFoundingMembershipItemId(finalItemId)
                        ? "monthly"
                        : null,
            membershipName:
              type === "plan" && isFoundingMembershipItemId(finalItemId)
                ? FOUNDING_MEMBERSHIP_NAME
                : null,
          },
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return res.status(200).json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
    });
  } catch (err: any) {
    console.error("❌ Stripe session creation failed:", err);

    if (err?.code === "insufficient_capabilities_for_transfer") {
      return res.status(400).json({
        error:
          "Seller Stripe account is not yet enabled for transfers. Complete Stripe onboarding and enable payouts/transfers.",
      });
    }

    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err?.message || "Stripe error",
    });
  }
}
