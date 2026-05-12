import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type Resp = {
  ok: boolean;
  subscription?: {
    currentPlan: string;
    renewalStatus: string;
    nextBillingDate: string | null;
    cancelAtPeriodEnd: boolean;
    status: string;
    hasManageableSubscription: boolean;
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;
    if (!token)
      return res.status(401).json({ ok: false, error: "unauthorized" });

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const userId = String(decoded?.userId || "");
    const email = String(decoded?.email || "");

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const user = await db.collection("users").findOne(
      {
        $or: [
          ...(ObjectId.isValid(userId) ? [{ _id: new ObjectId(userId) }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      {
        projection: {
          currentPlan: 1,
          subscriptionStatus: 1,
          renewalStatus: 1,
          nextBillingDate: 1,
          subscriptionCancelAtPeriodEnd: 1,
          stripeSubscriptionId: 1,
          isPremium: 1,
          premiumStatus: 1,
          membershipPlanExpiresAt: 1,
        },
      },
    );

    if (!user)
      return res.status(404).json({ ok: false, error: "user_not_found" });

    const nextBillingDate =
      user.nextBillingDate instanceof Date
        ? user.nextBillingDate
        : user.nextBillingDate
          ? new Date(user.nextBillingDate as any)
          : null;

    const fallbackPremium =
      user.isPremium === true ||
      String(user.premiumStatus || "").toLowerCase() === "active";

    const fallbackExpiry =
      user.membershipPlanExpiresAt instanceof Date
        ? user.membershipPlanExpiresAt
        : user.membershipPlanExpiresAt
          ? new Date(user.membershipPlanExpiresAt as any)
          : null;

    const currentPlan = String(
      user.currentPlan || (fallbackPremium ? "premium" : "free"),
    ).toLowerCase();

    return res.status(200).json({
      ok: true,
      subscription: {
        currentPlan,
        renewalStatus: String(
          user.renewalStatus || (fallbackPremium ? "active" : "inactive"),
        ),
        nextBillingDate:
          (nextBillingDate || fallbackExpiry)?.toISOString() || null,
        cancelAtPeriodEnd: Boolean(user.subscriptionCancelAtPeriodEnd),
        status: String(
          user.subscriptionStatus || (fallbackPremium ? "active" : "inactive"),
        ),
        hasManageableSubscription: Boolean(user.stripeSubscriptionId),
      },
    });
  } catch (err) {
    console.error("[billing/subscription-status]", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
