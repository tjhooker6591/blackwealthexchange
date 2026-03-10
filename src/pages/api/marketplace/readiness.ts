import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import Stripe from "stripe";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, getJwtSecret()) as any;
    const userId = String(payload?.userId || "");
    const email = String(payload?.email || "").toLowerCase();
    if (!userId && !email)
      return res.status(401).json({ error: "Unauthorized" });

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const seller = await db.collection("sellers").findOne({
      $or: [{ userId }, { email }],
    });

    if (!seller) {
      return res.status(200).json({
        sellerExists: false,
        onboardingStatus: "none",
        payoutConnected: false,
        payoutReady: false,
        dashboardReady: false,
      });
    }

    const stripeAccountId = seller?.stripeAccountId || null;
    let payoutConnected = Boolean(stripeAccountId);
    let payoutReady = false;
    let requirements: string[] = [];

    if (stripeAccountId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-02-24.acacia",
        });
        const acct = await stripe.accounts.retrieve(stripeAccountId);
        payoutConnected = true;
        payoutReady = Boolean(acct.charges_enabled && acct.payouts_enabled);
        requirements = acct.requirements?.currently_due || [];
      } catch {
        // keep fallback state
      }
    }

    return res.status(200).json({
      sellerExists: true,
      sellerId: String(seller._id),
      onboardingStatus: seller?.creatorOnboardingStatus || "seller-created",
      payoutConnected,
      payoutReady,
      dashboardReady: payoutReady,
      stripeAccountId,
      requirements,
    });
  } catch (e) {
    console.error("marketplace readiness failed", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
