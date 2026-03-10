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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type CheckoutType = "ad" | "product" | "plan" | "course";

interface CheckoutPayload {
  userId?: string; // dev fallback only
  itemId: string; // product ObjectId or slug, or ad plan id
  type: CheckoutType;

  // preferred top-level fields (used now)
  durationDays?: number | string;
  businessId?: string;
  campaignId?: string;
  placement?: string;

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
  // canonical production origin
  const prod = "https://www.blackwealthexchange.com";
  if (process.env.NODE_ENV === "production") return prod;

  // dev/preview
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const payload = req.body as CheckoutPayload;

  // Auth via your custom session cookie
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  let sessionUserId = "";
  let sessionEmail = "";

  if (token) {
    try {
      const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
      if (!SECRET) throw new Error("JWT_SECRET is not set");

      const decoded = jwt.verify(token, SECRET as string) as any;
      sessionUserId = decoded?.userId;
      sessionEmail = decoded?.email || "";
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
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { itemId, type } = payload;

  if (typeof itemId !== "string" || typeof type !== "string") {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  // ✅ Support both new top-level fields and older nested metadata
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

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const payments = db.collection("payments");

    const origin = getOrigin(req);

    // ✅ Match your existing pages in the repo
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

    // ✅ Keep normalized item id for metadata/payments/webhook consistency
    let finalItemId = itemId;

    // Optional: store a normalized user ObjectId if valid (useful for queries)
    const userObjectId = ObjectId.isValid(sessionUserId)
      ? new ObjectId(sessionUserId)
      : null;

    if (isAd) {
      // ✅ Shared server-side pricing authority + alias normalization
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
    } else if (type === "product") {
      // Product purchase: look up product & price server-side (don’t trust client amount)
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

      itemName = product?.name || itemName;

      // Expect product.price in dollars or cents — adjust to your schema
      if (typeof product.price === "number") {
        unitAmount = Math.round(product.price * 100);
      } else if (typeof (product as any).priceCents === "number") {
        unitAmount = (product as any).priceCents;
      } else {
        return res.status(400).json({ error: "Product price missing" });
      }

      const seller = await db.collection("sellers").findOne({
        $or: [
          { userId: product.sellerId },
          ...(ObjectId.isValid(product.sellerId)
            ? [{ _id: new ObjectId(product.sellerId) }]
            : []),
        ],
      });

      if (!seller?.stripeAccountId) {
        console.error("Stripe account not found for seller:", product.sellerId);
        return res
          .status(400)
          .json({ error: "Seller is not connected to Stripe" });
      }

      stripeAccountId = seller.stripeAccountId;
      isPlatformAccount =
        stripeAccountId === (process.env.PLATFORM_STRIPE_ACCOUNT_ID as string);
    } else if (type === "plan") {
      // If you support plan upgrades through this endpoint, price them server-side
      const planMap: Record<string, number> = {
        premium: 1200, // $12.00
        founder: 4900, // $49.00
        "music-creator-starter": 2900, // $29.00
        "music-creator-pro": 7900, // $79.00
      };

      unitAmount = planMap[itemId];
      if (!unitAmount) return res.status(400).json({ error: "Invalid plan" });

      itemName = `Plan Upgrade (${itemId})`;
      isPlatformAccount = true;
      stripeAccountId = process.env.PLATFORM_STRIPE_ACCOUNT_ID as string;

      if (itemId.startsWith("music-creator-")) {
        successUrl = withCheckoutSessionId(`${origin}/music/join?activated=1`);
        cancelUrl = `${origin}/music/pricing?canceled=1`;
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
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    const metadata: Record<string, string> = {
      userId: sessionUserId,
      itemId: finalItemId,
      type,
      durationDays:
        typeof normalizedDurationDays === "number"
          ? String(normalizedDurationDays)
          : "",
      businessId: normalizedBusinessId,
      campaignId: normalizedCampaignId,
      placement: normalizedPlacement,
    };

    // ---------------------------------------------------------
    // P0 DUPLICATE GUARD (server-side)
    // ---------------------------------------------------------
    // Only enforce this strict recent-match guard for ad checkouts right now
    // to avoid accidental blocking of legitimate rapid product/plan purchases.
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
        // If already paid, block another checkout immediately.
        if (existingRecent.status === "paid") {
          return res.status(409).json({
            error:
              "A matching payment was already completed. Please refresh your dashboard.",
            duplicateGuard: true,
            existingStatus: existingRecent.status,
            stripeSessionId: existingRecent.stripeSessionId,
          });
        }

        // Try to reuse an existing open Checkout Session.
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

        // If session isn't reusable, block rapid duplicate creation.
        return res.status(409).json({
          error:
            "A checkout attempt is already in progress. Please wait a moment and try again.",
          duplicateGuard: true,
          existingStatus: existingRecent.status || "pending",
          stripeSessionId: existingRecent.stripeSessionId,
        });
      }
    }

    // Helpful for dedupe debugging / replay diagnostics
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

    // Stripe idempotency key protects against near-simultaneous duplicate requests.
    // Minute bucket keeps it stable for rapid retries but allows legitimate future purchases.
    const minuteBucket = Math.floor(Date.now() / 60_000);
    const idempotencyKey = `checkout:${sha256Hex(
      `${checkoutFingerprint}|${minuteBucket}`,
    )}`;

    const baseParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: itemName },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      ...(sessionEmail ? { customer_email: sessionEmail } : {}),
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,

      // Helpful for reconciliation
      client_reference_id: sessionUserId,
      payment_intent_data: {
        metadata,
        ...(isPlatformAccount
          ? {}
          : {
              application_fee_amount: Math.round(unitAmount * 0.12),
              transfer_data: { destination: stripeAccountId },
            }),
      },
    };

    const stripeSession = await stripe.checkout.sessions.create(baseParams, {
      idempotencyKey,
    });

    // ✅ Create a pending payment record so Admin can always reconcile
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
          status: "pending",
          createdAt: new Date(),
          metadata: {
            durationDays:
              typeof normalizedDurationDays === "number"
                ? normalizedDurationDays
                : null,
            businessId: normalizedBusinessId || null,
            campaignId: normalizedCampaignId || null,
            placement: normalizedPlacement || null,
            checkoutFingerprint,
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

    // More helpful message for the seller transfer capability issue you hit
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
