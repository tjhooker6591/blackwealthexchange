import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import { requireStripeSecretKey } from "@/lib/stripeSecret";
import { sendEmail } from "@/lib/sendEmail";

type Resp = { ok: boolean; message?: string; error?: string };

const stripe = new Stripe(requireStripeSecretKey(), {
  apiVersion: "2025-02-24.acacia" as any,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
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
      { projection: { _id: 1, email: 1, stripeSubscriptionId: 1 } },
    );

    if (!user)
      return res.status(404).json({ ok: false, error: "user_not_found" });

    const stripeSubscriptionId = String(user.stripeSubscriptionId || "");
    if (!stripeSubscriptionId) {
      return res
        .status(400)
        .json({ ok: false, error: "no_manageable_subscription" });
    }

    const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const periodEnd = (updated as any).current_period_end
      ? new Date((updated as any).current_period_end * 1000)
      : null;

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          subscriptionCancelAtPeriodEnd: true,
          renewalStatus: "canceling",
          membershipPlanStatus: "canceling",
          nextBillingDate: periodEnd,
          updatedAt: new Date(),
        },
      },
    );

    await db.collection("subscription_events").insertOne({
      stripeEventType: "subscription_cancel_requested",
      stripeSubscriptionId,
      userId: String(user._id),
      email: String(user.email || ""),
      cancelAtPeriodEnd: true,
      currentPeriodEnd: periodEnd,
      createdAt: new Date(),
    });

    await db.collection("notifications").insertOne({
      userId: String(user._id),
      email: String(user.email || ""),
      type: "membership_cancel_scheduled",
      message: `Cancellation scheduled. Access remains active until ${
        periodEnd ? periodEnd.toLocaleDateString() : "period end"
      }.`,
      read: false,
      createdAt: new Date(),
    });

    try {
      if (user.email) {
        await sendEmail({
          to: String(user.email),
          subject: "BWE cancellation confirmation",
          text: `Your subscription is set to cancel at period end (${periodEnd ? periodEnd.toLocaleDateString() : "end of current period"}). You keep access until then.`,
          html: `<p>Your subscription is set to cancel at period end (${periodEnd ? periodEnd.toLocaleDateString() : "end of current period"}). You keep access until then.</p>`,
        });
      }
    } catch {}

    return res.status(200).json({
      ok: true,
      message: `Cancellation scheduled. Access remains active until ${
        periodEnd ? periodEnd.toLocaleDateString() : "period end"
      }.`,
    });
  } catch (err) {
    console.error("[billing/cancel-subscription]", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
