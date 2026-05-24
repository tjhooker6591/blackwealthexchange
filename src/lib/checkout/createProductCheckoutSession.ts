import type { NextApiRequest } from "next";
import Stripe from "stripe";
import { ObjectId, type Db } from "mongodb";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { calculateShipping, type CartItem } from "@/lib/shipping";
import { getJwtSecret } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { computeRevenueSplit } from "@/lib/payments/revenue";

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

function resolveBuyerFromRequest(req: NextApiRequest): {
  buyerUserId: string | null;
  buyerEmail: string | null;
} {
  try {
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.session_token || cookies.token;
    if (!token) return { buyerUserId: null, buyerEmail: null };

    const payload = jwt.verify(token, getJwtSecret()) as any;
    const buyerUserId = String(payload?.userId || "").trim() || null;
    const buyerEmail =
      String(payload?.email || "")
        .trim()
        .toLowerCase() || null;
    return { buyerUserId, buyerEmail };
  } catch {
    return { buyerUserId: null, buyerEmail: null };
  }
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
    if (/^https?:\/\//i.test(value)) return new URL(value).toString();
    if (value.startsWith("/")) return new URL(value, frontendUrl).toString();
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
  orderId: string;
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
    orderId,
  } = args;

  const metadata = {
    type: "product",
    orderId,
    productId,
    sellerId,
    stripeAccountId,
    payoutMode,
  };

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["card"],
    shipping_address_collection: { allowed_countries: ["US"] },
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
          fixed_amount: { amount: shippingCostCents, currency: "usd" },
          display_name: "Standard Shipping",
        },
      },
    ];
  }

  return params;
}

export async function createProductCheckoutSessionCore({
  req,
  db,
  productId,
  stripe,
}: {
  req: NextApiRequest;
  db: Db;
  productId: string;
  stripe: Stripe;
}): Promise<{ status: number; body: Record<string, any> }> {
  const normalizedProductId = (productId || "").trim();
  if (!normalizedProductId) {
    return {
      status: 400,
      body: { code: "MISSING_PRODUCT_ID", message: "Missing productId" },
    };
  }

  await ensureApiRateLimitIndexes(db);
  const ip = getClientIp(req);
  const ipLimit = await hitApiRateLimit(
    db,
    `checkout:product:ip:${ip}`,
    40,
    10,
  );
  if (ipLimit.blocked) {
    return {
      status: 429,
      body: {
        code: "RATE_LIMITED",
        message: "Too many checkout attempts. Please try again shortly.",
        retryAfterSeconds: ipLimit.retryAfterSeconds,
      },
    };
  }

  const productsCol = db.collection<any>("products");
  const pid = normalizeObjectId(normalizedProductId);

  let product: any | null = null;
  if (pid) product = await productsCol.findOne({ _id: pid });
  if (!product)
    product = await productsCol.findOne({ _id: normalizedProductId });

  if (!product) {
    return {
      status: 404,
      body: {
        code: "PRODUCT_NOT_FOUND",
        message: "This product is no longer available.",
        debug: !isProd() ? { productId: normalizedProductId } : undefined,
      },
    };
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

  if (sellerObjectId)
    seller = await sellersCol.findOne({ _id: sellerObjectId });
  if (!seller && typeof rawSellerId === "string") {
    seller = await sellersCol.findOne({ _id: rawSellerId });
  }

  if (!seller) {
    return {
      status: 404,
      body: {
        code: "SELLER_NOT_FOUND",
        message: "This seller is currently unavailable.",
      },
    };
  }

  const stripeAccountId = resolveStripeAccountId(seller);
  if (!stripeAccountId) {
    return {
      status: 409,
      body: {
        code: "SELLER_NOT_READY",
        message:
          "This seller hasn’t finished payout setup yet, so checkout is temporarily unavailable. Please check back soon.",
      },
    };
  }

  if (!stripeAccountId.startsWith("acct_")) {
    return {
      status: 400,
      body: {
        code: "INVALID_STRIPE_ACCOUNT",
        message: "Seller payout account is misconfigured.",
      },
    };
  }

  const stockRaw = Number(product?.stock ?? product?.inventory ?? 1);
  if (Number.isFinite(stockRaw) && stockRaw <= 0) {
    return {
      status: 409,
      body: {
        code: "OUT_OF_STOCK",
        message: "This product is currently out of stock.",
      },
    };
  }

  const title = String(product?.title || product?.name || "Product").trim();
  const description =
    typeof product?.description === "string"
      ? product.description.trim().slice(0, 500)
      : "";

  const unitAmountCents = toCents(product?.price);
  if (!Number.isFinite(unitAmountCents) || unitAmountCents <= 0) {
    return {
      status: 400,
      body: {
        code: "INVALID_PRICE",
        message: "This product has an invalid price and cannot be purchased.",
      },
    };
  }

  const split = computeRevenueSplit("marketplace", unitAmountCents);
  const applicationFee = split.bweFee;
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
  } catch {
    shippingCostCents = 0;
  }

  const frontendUrl = getFrontendUrl(req);
  const imageUrl = resolveProductImageUrl(product, frontendUrl);

  let payoutMode: PayoutMode = "destination_charge";
  let session: Stripe.Checkout.Session;

  const orderObjectId = new ObjectId();
  const orderId = orderObjectId.toString();
  const { buyerUserId, buyerEmail } = resolveBuyerFromRequest(req);

  const subtotalCents = unitAmountCents;
  const shippingCents = shippingCostCents;
  const totalCents = subtotalCents + shippingCents;

  await db.collection("orders").updateOne(
    { _id: orderObjectId },
    {
      $setOnInsert: {
        _id: orderObjectId,
        createdAt: new Date(),
        orderState: "checkout_pending",
        status: "pending_checkout",
        paymentStatus: "pending",
        fulfillmentStatus: "pending",
        payoutStatus: "pending",
        paid: false,
      },
      $set: {
        canonicalSchemaVersion: 1,
        productId: product._id,
        sellerId: seller._id,
        stripeAccountId,
        buyerUserId,
        buyerEmail,
        currency: "usd",

        subtotalCents,
        shippingCents,
        totalCents,

        // legacy mirrors (kept for existing UI compatibility)
        subtotal: subtotalCents,
        shipping: shippingCents,
        total: totalCents,
        totalPrice: totalCents,

        applicationFee,
        grossAmount: split.grossAmount,
        bweFee: split.bweFee,
        bweFeePercent: split.bweFeePercent,
        sellerPayout: split.sellerPayout,
        netAmount: split.netAmount,
        payoutMode,
        needsManualSellerPayout: false,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

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
    orderId,
  });

  try {
    session = await stripe.checkout.sessions.create({
      ...baseParams,
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: { destination: stripeAccountId },
        metadata: {
          type: "product",
          orderId,
          productId: String(product._id),
          sellerId: String(seller._id),
          stripeAccountId,
          payoutMode: "destination_charge",
        },
      },
    });
  } catch (err: any) {
    if (!isTransferCapabilityError(err)) throw err;

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
      orderId,
    });

    session = await stripe.checkout.sessions.create({
      ...fallbackParams,
      payment_intent_data: {
        metadata: {
          type: "product",
          orderId,
          productId: String(product._id),
          sellerId: String(seller._id),
          stripeAccountId,
          payoutMode: "platform_hold",
          transferBlocked: "1",
        },
      },
    });
  }

  await db.collection("orders").updateOne(
    { _id: orderObjectId },
    {
      $set: {
        sessionId: session.id,
        stripeSessionId: session.id,
        paymentSessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        updatedAt: new Date(),
      },
    },
  );

  await db.collection("flow_events").insertOne({
    eventType: "marketplace_checkout_created",
    pageRoute: "/api/checkout/create-session",
    section: "marketplace_checkout_api",
    source: "marketplace_checkout_api",
    source_variant: "canonical_checkout_session",
    path: req.url || "/api/checkout/create-session",
    checkout_variant: "canonical_checkout_session",
    productId: String(product._id),
    entityId: String(product._id),
    entityType: "product",
    sellerId: String(seller._id),
    stripeSessionId: session.id,
    payoutMode,
    orderId,
    createdAt: new Date(),
  });

  return {
    status: 200,
    body: {
      sessionId: session.id,
      url: session.url,
      payoutMode,
      orderId,
      warning:
        payoutMode === "platform_hold"
          ? "Seller payout is not transfer-ready yet. Payment will be held on the platform until seller payout setup is completed."
          : undefined,
    },
  };
}
