import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { createProductCheckoutSessionCore } from "@/lib/checkout/createProductCheckoutSession";

function isProd() {
  return process.env.NODE_ENV === "production";
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

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const stripe = getStripe();

    const result = await createProductCheckoutSessionCore({
      req,
      db,
      productId,
      stripe,
    });

    if (result.status === 429 && result.body?.retryAfterSeconds) {
      res.setHeader("Retry-After", String(result.body.retryAfterSeconds));
    }

    return res.status(result.status).json(result.body);
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
