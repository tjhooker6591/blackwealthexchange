// src/pages/api/checkout/create-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { calculateShipping, type CartItem } from "@/lib/shipping";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

type OidLike = { $oid?: string } | { oid?: string } | { _id?: any } | any;

function normalizeObjectId(value: unknown): ObjectId | null {
  if (!value) return null;

  if (value instanceof ObjectId) return value;

  if (typeof value === "object" && (value as any)._bsontype === "ObjectId") {
    return value as ObjectId;
  }

  if (typeof value === "object") {
    const v = value as OidLike;
    const maybe = v?.$oid || v?.oid;
    if (typeof maybe === "string" && ObjectId.isValid(maybe))
      return new ObjectId(maybe);
  }

  if (typeof value === "string" && ObjectId.isValid(value))
    return new ObjectId(value);

  return null;
}

function getFrontendUrl(req: NextApiRequest) {
  const env = process.env.FRONTEND_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  return `${proto}://${req.headers.host}`;
}

function isProd() {
  return process.env.NODE_ENV === "production";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
    }

    const { productId } = req.body as { productId?: string };
    if (!productId) {
      return res
        .status(400)
        .json({ code: "MISSING_PRODUCT_ID", message: "Missing productId" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const pid = normalizeObjectId(productId);
    const productsCol = db.collection<any>("products");

    let product: any | null = null;
    if (pid) product = await productsCol.findOne({ _id: pid });
    if (!product) product = await productsCol.findOne({ _id: productId });

    if (!product) {
      return res.status(404).json({
        code: "PRODUCT_NOT_FOUND",
        message: "This product is no longer available.",
        debug: !isProd() ? { productId } : undefined,
      });
    }

    // Resolve sellerId from product (do NOT trust client)
    const rawSellerId =
      product.sellerId ??
      product.seller_id ??
      product.seller?._id ??
      product.seller ??
      null;

    const sid =
      normalizeObjectId(rawSellerId) ||
      normalizeObjectId(String(rawSellerId || ""));

    const sellersCol = db.collection<any>("sellers");

    let seller: any | null = null;
    if (sid) seller = await sellersCol.findOne({ _id: sid });

    // Fallback if your sellers _id is stored as string
    if (!seller && typeof rawSellerId === "string") {
      seller = await sellersCol.findOne({ _id: rawSellerId });
    }

    if (!seller) {
      return res.status(404).json({
        code: "SELLER_NOT_FOUND",
        message: "This seller is currently unavailable.",
        debug: !isProd()
          ? { productId: String(product._id), rawSellerId }
          : undefined,
      });
    }

    // ✅ Accept alternate field names (in case your DB uses another key)
    const stripeAccountId: string | undefined =
      seller.stripeAccountId ||
      seller.stripe_account_id ||
      seller.stripeConnectAccountId ||
      seller?.stripe?.accountId;

    // ✅ Graceful message (customer-safe)
    if (!stripeAccountId) {
      return res.status(409).json({
        code: "SELLER_NOT_READY",
        message:
          "This seller hasn’t finished payout setup yet, so checkout is temporarily unavailable. Please check back soon.",
        debug: !isProd() ? { sellerId: String(seller._id) } : undefined,
      });
    }

    // Optional stronger gate (recommended if you store these flags):
    // if (seller.detailsSubmitted === false || seller.chargesEnabled === false) {
    //   return res.status(409).json({
    //     code: "SELLER_NOT_READY",
    //     message:
    //       "This seller is still finishing payout verification, so checkout is temporarily unavailable. Please check back soon.",
    //   });
    // }

    const title = String(product.title || product.name || "Product");

    const unitAmountCents = Math.round(Number(product.price) * 100);
    if (!Number.isFinite(unitAmountCents) || unitAmountCents <= 0) {
      return res.status(400).json({
        code: "INVALID_PRICE",
        message: "This product has an invalid price and cannot be purchased.",
      });
    }

    const commissionRate = 0.12;
    const applicationFee = Math.round(unitAmountCents * commissionRate);

    const cartItems: CartItem[] = [
      {
        id: String(product._id),
        name: title,
        price: unitAmountCents,
        quantity: 1,
        weightOunces: Number(product.weightOunces ?? 0),
      },
    ];

    const shippingCostCents = Math.max(
      0,
      Math.round(Number(calculateShipping(cartItems)) || 0),
    );

    const frontendUrl = getFrontendUrl(req);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "us_bank_account"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: title },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCostCents, currency: "usd" },
            display_name: "Standard Shipping",
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: { destination: stripeAccountId },
      },
      success_url: `${frontendUrl}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/orders/cancel`,
      metadata: {
        productId: String(product._id),
        sellerId: String(seller._id),
      },
    });

    await db.collection("orders").insertOne({
      sessionId: session.id,
      productId: product._id,
      sellerId: seller._id,
      amount: unitAmountCents,
      shipping: shippingCostCents,
      applicationFee,
      paid: false,
      createdAt: new Date(),
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "Checkout is temporarily unavailable. Please try again shortly.",
      debug: !isProd() ? { error: err?.message } : undefined,
    });
  }
}
