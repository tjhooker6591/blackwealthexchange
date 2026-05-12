import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import cookie from "cookie";
import jwt from "jsonwebtoken";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

type ApiErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "UNAUTHORIZED"
  | "SELLER_NOT_FOUND"
  | "INTERNAL_ERROR";

function getOrigin(req: NextApiRequest) {
  const origin = req.headers.origin as string | undefined;
  if (origin) return origin;
  const host = req.headers.host;
  return host ? `http://${host}` : "http://localhost:3000";
}

function getSession(req: NextApiRequest) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) return null;

  const SECRET = getJwtSecret();
  if (!SECRET) throw new Error("JWT_SECRET is not set");

  const decoded = jwt.verify(token, SECRET) as any;
  return { userId: decoded?.userId as string, email: decoded?.email as string };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED" satisfies ApiErrorCode,
      message: "Method not allowed",
    });
  }

  try {
    const session = getSession(req);
    if (!session?.userId) {
      return res.status(401).json({
        ok: false,
        code: "UNAUTHORIZED" satisfies ApiErrorCode,
        message: "Login required",
      });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const sellers = db.collection("sellers");

    const seller = await sellers.findOne({
      $or: [
        { userId: session.userId },
        ...(session.email ? [{ email: session.email }] : []),
      ],
    });

    if (!seller) {
      return res.status(400).json({
        ok: false,
        code: "SELLER_NOT_FOUND" satisfies ApiErrorCode,
        message: "Seller not found",
      });
    }

    let stripeAccountId = seller.stripeAccountId as string | undefined;

    const stripe = getStripeClient();

    // Create Stripe Express account if missing
    if (!stripeAccountId) {
      const acct = await stripe.accounts.create({
        type: "express",
        email: session.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = acct.id;

      await sellers.updateOne(
        { _id: seller._id },
        { $set: { stripeAccountId, stripeConnectedAt: new Date() } },
      );
    }

    const origin = getOrigin(req);
    const requestedReturnTo =
      typeof req.body?.returnTo === "string" ? req.body.returnTo.trim() : "";
    const safeReturnTo =
      requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//")
        ? requestedReturnTo
        : "/marketplace/become-a-seller?refresh=1&stripe=return";

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: "account_onboarding",
      refresh_url: `${origin}/marketplace/become-a-seller?refresh=1&stripe=refresh`,
      return_url: `${origin}${safeReturnTo}`,
    });

    return res
      .status(200)
      .json({ ok: true, data: { url: link.url, stripeAccountId } });
  } catch (err: any) {
    console.error("create-account-link error:", err);
    return res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR" satisfies ApiErrorCode,
      message: "Failed to create Stripe account link",
    });
  }
}
