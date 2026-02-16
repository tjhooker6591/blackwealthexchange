// src/pages/api/stripe/create-account-link.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

function getBaseUrl(req: NextApiRequest) {
  // Prefer env if set; fallback to request host
  const env =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (env) return env.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  return `${proto}://${req.headers.host}`;
}

function toObjectId(id: unknown): ObjectId | null {
  if (typeof id !== "string") return null;
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

/**
 * Requires the user to be logged in as a seller.
 * Reads your cookie JWT: session_token
 */
function requireSeller(req: NextApiRequest): { sellerId: ObjectId; email?: string } | null {
  const token = req.cookies?.session_token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // support common payload shapes
    const rawId = decoded?.id || decoded?._id || decoded?.userId;
    const accountType = decoded?.accountType;
    const email = decoded?.email;

    if (accountType !== "seller") return null;

    const oid = toObjectId(String(rawId));
    if (!oid) return null;

    return { sellerId: oid, email: email ? String(email) : undefined };
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // ✅ Enforce seller login
    const auth = requireSeller(req);
    if (!auth) {
      return res.status(401).json({ error: "Seller login required" });
    }

    const client = await clientPromise;

    // ✅ Force correct DB (fixes “it updated somewhere else” problems)
    const db = client.db("bwes-cluster");
    const sellers = db.collection<any>("sellers");

    const seller = await sellers.findOne({ _id: auth.sellerId });
    if (!seller) return res.status(404).json({ error: "Seller not found" });

    // Optional: enforce accountType in DB too
    if (seller.accountType && seller.accountType !== "seller") {
      return res.status(403).json({ error: "Not a seller account" });
    }

    const sellerEmail = String(seller.email || auth.email || "");
    if (!sellerEmail) return res.status(400).json({ error: "Seller email missing" });

    // 1) Create or reuse Stripe connected account
    let stripeAccountId: string | undefined = seller.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: sellerEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      await sellers.updateOne(
        { _id: auth.sellerId },
        {
          $set: {
            stripeAccountId,
            stripeOnboardingStatus: "incomplete",
            stripeUpdatedAt: new Date(),
          },
        },
      );
    }

    // 2) Retrieve Stripe account to decide link type + persist status flags
    const acct = await stripe.accounts.retrieve(stripeAccountId);

    const detailsSubmitted = Boolean((acct as any).details_submitted);
    const chargesEnabled = Boolean((acct as any).charges_enabled);
    const payoutsEnabled = Boolean((acct as any).payouts_enabled);

    await sellers.updateOne(
      { _id: auth.sellerId },
      {
        $set: {
          detailsSubmitted,
          chargesEnabled,
          payoutsEnabled,
          stripeOnboardingStatus: detailsSubmitted ? "complete" : "incomplete",
          stripeUpdatedAt: new Date(),
        },
      },
    );

    // 3) Link type:
    // - If not complete: onboarding
    // - If complete: update (for bank/card changes later)
    const linkType: Stripe.AccountLinkCreateParams.Type = detailsSubmitted
      ? "account_update"
      : "account_onboarding";

    const baseUrl = getBaseUrl(req);

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/marketplace/dashboard?stripe=refresh`,
      return_url: `${baseUrl}/marketplace/dashboard?stripe=return`,
      type: linkType,
    });

    return res.status(200).json({
      url: accountLink.url,
      stripeAccountId,
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      linkType,
    });
  } catch (err: any) {
    console.error("Stripe create-account-link error:", err);
    return res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err?.message || "Internal Server Error",
    });
  }
}
