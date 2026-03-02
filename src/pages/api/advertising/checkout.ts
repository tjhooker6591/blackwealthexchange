// src/pages/api/admin/advertising/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";

type ApiResponse =
  | {
      ok: true;
      url: string;
      sessionId: string;
      campaignId: string;
      amountCents: number;
    }
  | {
      ok: false;
      error: string;
      details?: string;
    };

type CheckoutBody = {
  // Identity / contact
  userId?: string;
  businessId?: string;
  advertiserName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  website?: string;

  // Ad selection
  option?: string; // featured-sponsor, homepage-banner, sponsored-listing, etc.
  adType?: string; // alias for option
  placement?: string;
  duration?: string | number; // 30 / "30" / "30-days"
  durationDays?: number; // alias
  plan?: string;

  // Creative / content
  title?: string;
  headline?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  ctaText?: string;
  ctaUrl?: string;

  // Pricing overrides (admin-only/manual)
  amountCents?: number;
  amount?: number; // dollars
  quantity?: number;

  // Optional routing (relative paths only)
  successPath?: string;
  cancelPath?: string;

  // Extra metadata/notes
  notes?: string;
  startDate?: string;
  endDate?: string;
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * Optional lightweight admin protection.
 * If ADMIN_API_KEY is set, requests must include x-admin-key header.
 * (If you already have admin auth middleware, keep that and remove this.)
 */
function requireAdminKey(req: NextApiRequest): string | null {
  const required = process.env.ADMIN_API_KEY;
  if (!required) return null; // dev convenience; set in production

  const provided = req.headers["x-admin-key"];
  const key = Array.isArray(provided) ? provided[0] : provided;

  if (!key || key !== required) return "Unauthorized";
  return null;
}

function s(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const out = value.trim();
  return out.length ? out : undefined;
}

function n(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function getBaseUrl(req: NextApiRequest): string {
  const envBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXTAUTH_URL;

  if (envBase) return envBase.replace(/\/+$/, "");

  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const protocol = proto || "http";
  const host = req.headers.host || "localhost:3000";
  return `${protocol}://${host}`;
}

function sanitizePath(input: string | undefined, fallback: string): string {
  const p = (input || "").trim();
  if (!p) return fallback;

  // Only allow app-relative paths to avoid malformed URLs / open redirects
  if (!p.startsWith("/")) return fallback;
  if (p.startsWith("//")) return fallback;
  return p;
}

function normalizeOption(input?: string): string {
  if (!input) return "";

  const raw = input
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  // Aliases -> canonical item IDs used by webhook/admin analytics
  const aliases: Record<string, string> = {
    "featured-sponsor-ad": "featured-sponsor",

    "homepage-banner": "banner-ad",
    "home-banner": "banner-ad",
    "top-banner": "banner-ad",
    "sidebar-banner": "banner-ad",
    "footer-banner": "banner-ad",
    "dashboard-banner": "banner-ad",

    "directory-standard-listing": "directory-standard",
    "directory-featured-listing": "directory-featured",
  };

  return aliases[raw] || raw;
}

function normalizeDurationDays(body: CheckoutBody): number {
  const direct = n(body.durationDays);
  if (direct && direct > 0) return Math.floor(direct);

  const raw = body.duration;
  if (typeof raw === "number" && raw > 0) return Math.floor(raw);

  if (typeof raw === "string") {
    const m = raw.match(/\d+/);
    if (m) {
      const parsed = Number(m[0]);
      if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
    }
  }

  // sensible default for ad campaigns
  return 30;
}

/**
 * Default pricing table (in cents).
 * Update these to match your real ad offerings.
 * If admin passes amountCents/amount, that overrides this table.
 */
const AD_PRICES_CENTS: Record<string, Record<number, number>> = {
  "featured-sponsor": {
    7: 2500,
    14: 4500,
    30: 8000,
    60: 15000, // admin extension (optional)
  },
  "banner-ad": {
    14: 19900,
    30: 34900,
    60: 64900,
    90: 94900,
  },
  "sponsored-listing": {
    30: 7900,
    60: 14900,
    90: 21900,
  },
  "directory-standard": {
    7: 2500,
    14: 4500,
    30: 4900, // if you want older admin pricing compatibility
  },
  "directory-featured": {
    14: 5000,
    30: 9900,
    60: 17900,
  },
  "top-sponsor": {
    30: 29900,
    60: 54900,
    90: 79900,
  },
  "newsletter-sponsor": {
    30: 14900,
    60: 27900,
    90: 39900,
  },
};

function resolveAmountCents(
  body: CheckoutBody,
  option: string,
  durationDays: number,
): { amountCents: number; source: "override" | "table" | "prorated" } {
  const explicitCents = n(body.amountCents);
  if (explicitCents && explicitCents > 0) {
    return { amountCents: Math.round(explicitCents), source: "override" };
  }

  const explicitDollars = n(body.amount);
  if (explicitDollars && explicitDollars > 0) {
    return {
      amountCents: Math.round(explicitDollars * 100),
      source: "override",
    };
  }

  const table = AD_PRICES_CENTS[option];
  if (!table) {
    throw new Error(
      `Unknown ad option "${option}" and no amount override provided`,
    );
  }

  const exact = table[durationDays];
  if (exact) return { amountCents: exact, source: "table" };

  // Fallback pricing heuristic if option exists but duration isn't in table
  const base30 = table[30];
  if (base30) {
    const prorated = Math.round((base30 / 30) * durationDays);
    return { amountCents: Math.max(prorated, 100), source: "prorated" };
  }

  throw new Error(
    `No pricing configured for option="${option}" durationDays=${durationDays}`,
  );
}

function buildDisplayName(option: string): string {
  return option
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function isHttpUrl(value?: string): value is string {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function clampQuantity(value: unknown): number {
  const q = Math.floor(n(value) || 1);
  return Math.min(Math.max(q, 1), 100);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const adminErr = requireAdminKey(req);
  if (adminErr) {
    return res.status(401).json({ ok: false, error: adminErr });
  }

  if (!stripe || !stripeSecretKey) {
    return res.status(500).json({
      ok: false,
      error: "Stripe is not configured",
      details: "Missing STRIPE_SECRET_KEY",
    });
  }

  let body: CheckoutBody;
  try {
    body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
  } catch {
    return res.status(400).json({
      ok: false,
      error: "Invalid JSON body",
    });
  }

  const option = normalizeOption(s(body.option) || s(body.adType));
  if (!option) {
    return res.status(400).json({
      ok: false,
      error: "Missing advertising option",
      details: "Provide body.option or body.adType",
    });
  }

  const durationDays = normalizeDurationDays(body);
  const quantity = clampQuantity(body.quantity);

  let amountCents: number;
  let pricingSource: "override" | "table" | "prorated";
  try {
    const pricing = resolveAmountCents(body, option, durationDays);
    amountCents = pricing.amountCents;
    pricingSource = pricing.source;
  } catch (err: any) {
    return res.status(400).json({
      ok: false,
      error: "Invalid pricing request",
      details: err?.message || "Unable to resolve price",
    });
  }

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return res.status(400).json({
      ok: false,
      error: "Invalid amount",
    });
  }

  const email = s(body.email);
  const businessName = s(body.businessName);
  const advertiserName = s(body.advertiserName);
  const website = s(body.website);
  const phone = s(body.phone);

  const imageUrlRaw = s(body.imageUrl) || s(body.bannerUrl);
  const imageUrl = isHttpUrl(imageUrlRaw) ? imageUrlRaw : undefined;

  const title =
    s(body.title) || s(body.headline) || `${buildDisplayName(option)} Campaign`;

  const description = s(body.description);
  const ctaText = s(body.ctaText);
  const ctaUrl = s(body.ctaUrl);
  const notes = s(body.notes);

  const userId = s(body.userId);
  const businessId = s(body.businessId);

  const placement = s(body.placement);
  const startDate = s(body.startDate);
  const endDate = s(body.endDate);
  const plan = s(body.plan);

  const baseUrl = getBaseUrl(req);

  // Align defaults to your unified checkout success/cancel pages
  const successPath = sanitizePath(body.successPath, "/payment-success");
  const cancelPath = sanitizePath(body.cancelPath, "/payment-cancel");

  const db = (await clientPromise).db("bwes-cluster");
  const campaigns = db.collection("advertising_campaigns");

  const now = new Date();

  // Create pending campaign/order record first (so Stripe metadata can reference it)
  const pendingDoc = {
    type: "advertising",
    source: "admin_checkout_api",

    // campaign lifecycle
    status: "pending_payment",
    // payment lifecycle
    paymentStatus: "unpaid",

    option,
    placement: placement || null,
    durationDays,
    plan: plan || null,

    title,
    description: description || null,
    imageUrl: imageUrl || null,
    ctaText: ctaText || null,
    ctaUrl: ctaUrl || null,

    advertiserName: advertiserName || null,
    businessName: businessName || null,
    email: email || null,
    phone: phone || null,
    website: website || null,

    userId: userId || null,
    businessId: businessId || null,

    amountCents,
    currency: "usd",
    quantity,
    pricingSource,

    notes: notes || null,
    requestedStartDate: startDate || null,
    requestedEndDate: endDate || null,

    stripeSessionId: null as string | null,
    stripeCheckoutUrl: null as string | null,
    stripePaymentIntentId: null as string | null,

    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await campaigns.insertOne(pendingDoc);
  const campaignId = insertResult.insertedId.toString();

  const successUrl =
    `${baseUrl}${successPath}` +
    `?session_id={CHECKOUT_SESSION_ID}` +
    `&type=advertising&campaignId=${encodeURIComponent(campaignId)}`;

  const cancelUrl =
    `${baseUrl}${cancelPath}` +
    `?canceled=1&type=advertising&campaignId=${encodeURIComponent(campaignId)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: campaignId,
      customer_email: email || undefined,
      allow_promotion_codes: true,

      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${buildDisplayName(option)} (${durationDays} days)`,
              description:
                businessName || advertiserName
                  ? `Advertising purchase for ${businessName || advertiserName}`
                  : "Advertising campaign purchase",
              ...(imageUrl ? { images: [imageUrl] } : {}),
            },
          },
        },
      ],

      metadata: {
        /**
         * IMPORTANT:
         * Use type="ad" and itemId=<ad option> so your existing webhook +
         * admin analytics/ad_purchases tracking can recognize this purchase.
         */
        type: "ad",
        campaignId,
        itemId: option,

        option,
        placement: placement || "",

        duration: String(durationDays),
        durationDays: String(durationDays),
        quantity: String(quantity),

        userId: userId || "",
        businessId: businessId || "",
        email: email || "",
        businessName: businessName || "",
      },
    });

    await campaigns.updateOne(
      { _id: insertResult.insertedId },
      {
        $set: {
          stripeSessionId: session.id,
          stripeCheckoutUrl: session.url || null,
          updatedAt: new Date(),
        },
      },
    );

    if (!session.url) {
      return res.status(500).json({
        ok: false,
        error: "Stripe session created without checkout URL",
      });
    }

    return res.status(200).json({
      ok: true,
      url: session.url,
      sessionId: session.id,
      campaignId,
      amountCents,
    });
  } catch (error: any) {
    console.error("[/api/admin/advertising/checkout] error:", error);

    // Mark campaign row for admin visibility/retry
    await campaigns.updateOne(
      { _id: insertResult.insertedId },
      {
        $set: {
          status: "checkout_error",
          paymentStatus: "unpaid",
          checkoutError:
            error?.message ||
            (typeof error === "string" ? error : "Unknown error"),
          updatedAt: new Date(),
        },
      },
    );

    return res.status(500).json({
      ok: false,
      error: "Failed to create advertising checkout session",
      details:
        error?.message || (typeof error === "string" ? error : "Unknown error"),
    });
  }
}
