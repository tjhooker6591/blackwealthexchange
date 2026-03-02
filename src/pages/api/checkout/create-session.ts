import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { calculateShipping, type CartItem } from "@/lib/shipping";

type OidLike = { $oid?: string; oid?: string; _id?: unknown } | any;
type PayoutMode = "destination_charge" | "platform_hold";

function normalizeObjectId(value: unknown): ObjectId | null {
  if (!value) return null;

  if (value instanceof ObjectId) return value;

  if (typeof value === "object" && (value as any)._bsontype === "ObjectId") {
    return value as ObjectId;
  }

  if (typeof value === "object") {
    const v = value as OidLike;
    const maybe = v?.$oid || v?.oid;
    if (typeof maybe === "string" && ObjectId.isValid(maybe)) {
      return new ObjectId(maybe);
    }
  }

  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }

  return null;
}

function isProd() {
  return process.env.NODE_ENV === "production";
}

function getFrontendUrl(req: NextApiRequest) {
  const env =
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (env) {
    const withProtocol = /^https?:\/\//i.test(env) ? env : `https://${env}`;
    return withProtocol.replace(/\/$/, "");
  }

  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : protoHeader || (isProd() ? "https" : "http");

  return `${proto}://${req.headers.host}`;
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(secretKey);
}

function safeJsonBody(body: unknown): Record<string, any> {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body === "object") return body as Record<string, any>;
  return {};
}

function resolveStripeAccountId(seller: any): string | undefined {
  const candidate =
    seller?.stripeAccountId ||
    seller?.stripe_account_id ||
    seller?.stripeConnectAccountId ||
    seller?.stripeConnectId ||
    seller?.stripe?.accountId ||
    seller?.stripe?.connectedAccountId ||
    seller?.connect?.accountId;

  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed || undefined;
}

function resolveProductImageUrl(
  product: any,
  frontendUrl: string,
): string | undefined {
  const raw =
    product?.imageUrl ||
    product?.image ||
    product?.thumbnail ||
    (Array.isArray(product?.images) ? product.images[0] : undefined) ||
    (Array.isArray(product?.imageUrls) ? product.imageUrls[0] : undefined);

  if (typeof raw !== "string" || !raw.trim()) return undefined;

  const value = raw.trim();

  try {
    if (/^https?:\/\//i.test(value)) {
      return new URL(value).toString();
    }

    if (value.startsWith("/")) {
      return new URL(value, frontendUrl).toString();
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function toCents(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function isTransferCapabilityError(err: any) {
  return (
    err?.code === "insufficient_capabilities_for_transfer" ||
    err?.raw?.code === "insufficient_capabilities_for_transfer" ||
    /stripe_transfers/i.test(String(err?.message || "")) ||
    /stripe_transfers/i.test(String(err?.raw?.message || ""))
  );
}

function buildSessionParams(args: {
  title: string;
  description: string;
  imageUrl?: string;
  unitAmountCents: number;
  shippingCostCents: number;
  frontendUrl: string;
  productId: string;
  sellerId: string;
  stripeAccountId: string;
  payoutMode: PayoutMode;
}) {
  const {
    title,
    description,
    imageUrl,
    unitAmountCents,
    shippingCostCents,
    frontendUrl,
    productId,
    sellerId,
    stripeAccountId,
    payoutMode,
  } = args;

  const metadata = {
    type: "product",
    productId,
    sellerId,
    stripeAccountId,
    payoutMode,
  };

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["card"],

    shipping_address_collection: {
      allowed_countries: ["US"],
    },

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: title,
            ...(description ? { description } : {}),
            ...(imageUrl ? { images: [imageUrl] } : {}),
          },
          unit_amount: unitAmountCents,
        },
        quantity: 1,
      },
    ],

    success_url: `${frontendUrl}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/orders/cancel`,

    client_reference_id: productId,
    metadata,
  };

  if (shippingCostCents > 0) {
    params.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: shippingCostCents,
            currency: "usd",
          },
          display_name: "Standard Shipping",
        },
      },
    ];
  }

  return params;
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

    const body = safeJsonBody(req.body);
    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";

    if (!productId) {
      return res
        .status(400)
        .json({ code: "MISSING_PRODUCT_ID", message: "Missing productId" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const productsCol = db.collection<any>("products");
    const pid = normalizeObjectId(productId);

    let product: any | null = null;

    if (pid) {
      product = await productsCol.findOne({ _id: pid });
    }

    if (!product) {
      product = await productsCol.findOne({ _id: productId });
    }

    if (!product) {
      return res.status(404).json({
        code: "PRODUCT_NOT_FOUND",
        message: "This product is no longer available.",
        debug: !isProd() ? { productId } : undefined,
      });
    }

    const rawSellerId =
      product?.sellerId ??
      product?.seller_id ??
      product?.seller?._id ??
      product?.seller ??
      null;

    const sellersCol = db.collection<any>("sellers");

    let seller: any | null = null;
    const sellerObjectId =
      normalizeObjectId(rawSellerId) ||
      normalizeObjectId(typeof rawSellerId === "string" ? rawSellerId : "");

    if (sellerObjectId) {
      seller = await sellersCol.findOne({ _id: sellerObjectId });
    }

    if (!seller && typeof rawSellerId === "string") {
      seller = await sellersCol.findOne({ _id: rawSellerId });
    }

    if (!seller) {
      return res.status(404).json({
        code: "SELLER_NOT_FOUND",
        message: "This seller is currently unavailable.",
        debug: !isProd()
          ? {
              productId: String(product._id),
              rawSellerId,
            }
          : undefined,
      });
    }

    const stripeAccountId = resolveStripeAccountId(seller);

    if (!stripeAccountId) {
      return res.status(409).json({
        code: "SELLER_NOT_READY",
        message:
          "This seller hasn’t finished payout setup yet, so checkout is temporarily unavailable. Please check back soon.",
        debug: !isProd() ? { sellerId: String(seller._id) } : undefined,
      });
    }

    if (!stripeAccountId.startsWith("acct_")) {
      return res.status(400).json({
        code: "INVALID_STRIPE_ACCOUNT",
        message: "Seller payout account is misconfigured.",
        debug: !isProd()
          ? { sellerId: String(seller._id), stripeAccountId }
          : undefined,
      });
    }

    const title = String(product?.title || product?.name || "Product").trim();
    const description =
      typeof product?.description === "string"
        ? product.description.trim().slice(0, 500)
        : "";

    const unitAmountCents = toCents(product?.price);

    if (!Number.isFinite(unitAmountCents) || unitAmountCents <= 0) {
      return res.status(400).json({
        code: "INVALID_PRICE",
        message: "This product has an invalid price and cannot be purchased.",
        debug: !isProd()
          ? { productId: String(product._id), rawPrice: product?.price }
          : undefined,
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
        weightOunces: Number(product?.weightOunces ?? 0),
      },
    ];

    let shippingCostCents = 0;
    try {
      shippingCostCents = Math.max(
        0,
        Math.round(Number(calculateShipping(cartItems)) || 0),
      );
    } catch (shippingError: any) {
      console.error("Shipping calculation failed:", shippingError);
      shippingCostCents = 0;
    }

    const frontendUrl = getFrontendUrl(req);
    const imageUrl = resolveProductImageUrl(product, frontendUrl);
    const stripe = getStripe();

    let payoutMode: PayoutMode = "destination_charge";
    let session: Stripe.Checkout.Session;

    const baseParams = buildSessionParams({
      title,
      description,
      imageUrl,
      unitAmountCents,
      shippingCostCents,
      frontendUrl,
      productId: String(product._id),
      sellerId: String(seller._id),
      stripeAccountId,
      payoutMode: "destination_charge",
    });

    try {
      session = await stripe.checkout.sessions.create({
        ...baseParams,
        payment_intent_data: {
          application_fee_amount: applicationFee,
          transfer_data: {
            destination: stripeAccountId,
          },
          metadata: {
            type: "product",
            productId: String(product._id),
            sellerId: String(seller._id),
            stripeAccountId,
            payoutMode: "destination_charge",
          },
        },
      });
    } catch (err: any) {
      if (!isTransferCapabilityError(err)) {
        throw err;
      }

      console.warn(
        "Seller transfer not ready. Falling back to platform-held checkout.",
        {
          sellerId: String(seller._id),
          stripeAccountId,
          code: err?.code,
          message: err?.message,
        },
      );

      payoutMode = "platform_hold";

      const fallbackParams = buildSessionParams({
        title,
        description,
        imageUrl,
        unitAmountCents,
        shippingCostCents,
        frontendUrl,
        productId: String(product._id),
        sellerId: String(seller._id),
        stripeAccountId,
        payoutMode: "platform_hold",
      });

      session = await stripe.checkout.sessions.create({
        ...fallbackParams,
        payment_intent_data: {
          metadata: {
            type: "product",
            productId: String(product._id),
            sellerId: String(seller._id),
            stripeAccountId,
            payoutMode: "platform_hold",
            transferBlocked: "1",
          },
        },
      });
    }

    await db.collection("orders").insertOne({
      sessionId: session.id,
      productId: product._id,
      sellerId: seller._id,
      stripeAccountId,
      subtotal: unitAmountCents,
      shipping: shippingCostCents,
      applicationFee,
      total: unitAmountCents + shippingCostCents,
      payoutMode,
      needsManualSellerPayout: payoutMode === "platform_hold",
      paid: false,
      status: "pending_checkout",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      payoutMode,
      warning:
        payoutMode === "platform_hold"
          ? "Seller payout is not transfer-ready yet. Payment will be held on the platform until seller payout setup is completed."
          : undefined,
    });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);

    return res.status(500).json({
      code: "SERVER_ERROR",
      message: "Checkout is temporarily unavailable. Please try again shortly.",
      debug: !isProd()
        ? {
            error: err?.message || "Unknown error",
            type: err?.type,
            code: err?.code,
            raw: err?.raw?.message,
          }
        : undefined,
    });
  }
}
