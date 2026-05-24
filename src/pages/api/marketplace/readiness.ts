import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import Stripe from "stripe";
import { getJwtSecret } from "@/lib/env";
import { getMarketplaceDbName } from "@/lib/marketplace/db";
import { ObjectId } from "mongodb";

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
    const db = client.db(getMarketplaceDbName());

    const seller = await db.collection("sellers").findOne({
      $or: [{ userId }, { email }],
    });

    if (!seller) {
      return res.status(200).json({
        sellerExists: false,
        readinessState: "not_started",
        readinessLabel: "Not started",
        readinessProgress: 0,
        readinessChecks: {
          profileValid: false,
          publishedProduct: false,
        },
        onboardingStatus: "none",
        payoutConnected: false,
        payoutReady: false,
        dashboardReady: false,
      });
    }

    const sellerId = String(seller._id);
    const sellerObjectId = ObjectId.isValid(sellerId)
      ? new ObjectId(sellerId)
      : null;

    const hasPublishedProduct =
      (await db.collection("products").countDocuments({
        $and: [
          {
            $or: [
              { sellerId },
              ...(sellerObjectId ? [{ sellerId: sellerObjectId }] : []),
            ],
          },
          { status: "active" },
          { isPublished: { $ne: false } },
        ],
      })) > 0;

    const profileValid = Boolean(
      String(seller?.businessName || "").trim() &&
      String(seller?.email || "").trim() &&
      String(seller?.businessPhone || "").trim() &&
      String(seller?.businessAddress || "").trim() &&
      String(seller?.description || "").trim(),
    );

    let readinessState: "not_started" | "in_progress" | "ready_to_sell" =
      "not_started";

    if (profileValid && hasPublishedProduct) {
      readinessState = "ready_to_sell";
    } else if (profileValid || hasPublishedProduct) {
      readinessState = "in_progress";
    }

    const readinessLabel =
      readinessState === "ready_to_sell"
        ? "Ready to sell"
        : readinessState === "in_progress"
          ? "In progress"
          : "Not started";

    const readinessProgress =
      Number(profileValid) + Number(hasPublishedProduct);

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
      sellerId,
      readinessState,
      readinessLabel,
      readinessProgress,
      readinessChecks: {
        profileValid,
        publishedProduct: hasPublishedProduct,
      },
      onboardingStatus: seller?.creatorOnboardingStatus || "seller-created",
      payoutConnected,
      payoutReady,
      dashboardReady: payoutReady,
      creatorPlanStatus: seller?.creatorPlanStatus || "inactive",
      creatorPlanId: seller?.creatorPlanId || null,
      creatorReady: Boolean(seller?.creatorReady),
      musicCreatorReady: Boolean(
        seller?.creatorOnboardingStatus === "onboarded" &&
        seller?.creatorPlanStatus === "active" &&
        payoutReady,
      ),
      stripeAccountId,
      requirements,
    });
  } catch (e) {
    console.error("marketplace readiness failed", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
