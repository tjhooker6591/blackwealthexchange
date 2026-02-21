// src/pages/api/stripe/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type CheckoutType = "ad" | "product" | "plan";

interface CheckoutPayload {
  userId?: string; // dev fallback only
  itemId: string; // product ObjectId or slug, or ad plan id
  type: CheckoutType;
  // optional fields for fulfillment:
  durationDays?: number; // for ads/directory
  businessId?: string; // which business the directory listing applies to
  // (we no longer trust amount/successUrl/cancelUrl from client)
  amount?: number; // legacy: ignored
  successUrl?: string; // legacy: ignored (we build it)
  cancelUrl?: string; // legacy: ignored (we build it)
}

function withCheckoutSessionId(url: string) {
  const joiner = url.includes("?") ? "&" : "?";
  return url.includes("session_id=")
    ? url
    : `${url}${joiner}session_id={CHECKOUT_SESSION_ID}`;
}

function getAdItemName(itemId: string) {
  const map: Record<string, string> = {
    "directory-standard": "Directory Listing (Standard)",
    "directory-featured": "Directory Listing (Featured)",
    "featured-sponsor": "Featured Sponsor",
    "top-sponsor": "Top Sponsor",
    "sponsored-listing": "Sponsored Listing",
    "banner-ad": "Banner Ad",
  };
  return map[itemId] || `Advertising Purchase (${itemId})`;
}

/**
 * IMPORTANT: set ad pricing on server (cents).
 * Adjust these to match your actual pricing.
 */
function getAdPriceCents(itemId: string, durationDays?: number) {
  // Example: base prices per 14 days; you can scale by durationDays if you want.
  const base14: Record<string, number> = {
    "directory-standard": 4900, // $49.00
    "directory-featured": 9900, // $99.00
    "featured-sponsor": 14900, // $149.00
    "top-sponsor": 29900, // $299.00
    "sponsored-listing": 7900, // $79.00
    "banner-ad": 12900, // $129.00
  };

  const base = base14[itemId];
  if (!base) throw new Error(`Unknown ad itemId: ${itemId}`);

  // Optional scaling:
  const d = Number(durationDays || 14);
  if (![7, 14, 30, 60, 90].includes(d)) {
    // keep it tight to avoid weird values
    throw new Error(`Invalid durationDays: ${d}`);
  }

  // Simple scale: proportional to 14-day base
  const scaled = Math.round(base * (d / 14));
  return scaled;
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
      if (!sessionUserId)
        return res.status(401).json({ error: "Unauthorized" });
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

  const { itemId, type, durationDays, businessId } = payload;

  if (typeof itemId !== "string" || typeof type !== "string") {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const origin = getOrigin(req);
    const successUrl = withCheckoutSessionId(`${origin}/payment/success`);
    const cancelUrl = `${origin}/payment/cancel`;

    const isAd = type === "ad";

    let itemName = `${type} purchase`;
    let stripeAccountId = "";
    let isPlatformAccount = true;
    let unitAmount = 0;

    // Optional: store a normalized user ObjectId if valid (useful for queries)
    const userObjectId = ObjectId.isValid(sessionUserId)
      ? new ObjectId(sessionUserId)
      : null;

    if (isAd) {
      itemName = getAdItemName(itemId);
      unitAmount = getAdPriceCents(itemId, durationDays);

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
      // If your product.price is dollars:
      if (typeof product.price === "number") {
        unitAmount = Math.round(product.price * 100);
      } else if (typeof product.priceCents === "number") {
        unitAmount = product.priceCents;
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
      // Example mapping (replace with your real values):
      const planMap: Record<string, number> = {
        premium: 1200, // $12.00
        founder: 4900, // $49.00
      };
      unitAmount = planMap[itemId];
      if (!unitAmount) return res.status(400).json({ error: "Invalid plan" });

      itemName = `Plan Upgrade (${itemId})`;
      isPlatformAccount = true;
      stripeAccountId = process.env.PLATFORM_STRIPE_ACCOUNT_ID as string;
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    const metadata = {
      userId: sessionUserId,
      itemId,
      type,
      durationDays: String(durationDays || ""),
      businessId: String(businessId || ""),
    };

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

      // Helpful for reconciliation:
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

    const stripeSession = await stripe.checkout.sessions.create(baseParams);

    // ✅ Create a pending payment record so Admin can always reconcile
    await db.collection("payments").updateOne(
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
          itemId,
          amountCents: unitAmount,
          status: "pending",
          createdAt: new Date(),
          metadata: {
            durationDays: durationDays || null,
            businessId: businessId || null,
          },
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
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err?.message || "Stripe error",
    });
  }
}
