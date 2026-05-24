import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

type Resp = {
  ok: boolean;
  summary?: {
    active: number;
    canceled: number;
    failed: number;
  };
  subscriptions?: Array<Record<string, unknown>>;
  renewalHistory?: Array<Record<string, unknown>>;
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

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const [active, canceled, failed, subscriptions, renewalHistory] =
      await Promise.all([
        db.collection("users").countDocuments({ subscriptionStatus: "active" }),
        db.collection("users").countDocuments({
          $or: [
            { subscriptionStatus: "canceled" },
            { subscriptionCancelAtPeriodEnd: true },
          ],
        }),
        db.collection("users").countDocuments({
          subscriptionStatus: { $in: ["past_due", "unpaid"] },
        }),
        db
          .collection("users")
          .find(
            { stripeSubscriptionId: { $exists: true, $ne: null } },
            {
              projection: {
                email: 1,
                currentPlan: 1,
                subscriptionPlan: 1,
                subscriptionStatus: 1,
                subscriptionCancelAtPeriodEnd: 1,
                nextBillingDate: 1,
                stripeSubscriptionId: 1,
                stripeCustomerId: 1,
                premiumStatus: 1,
                renewalStatus: 1,
              },
            },
          )
          .sort({ updatedAt: -1 })
          .limit(500)
          .toArray(),
        db
          .collection("subscription_events")
          .find({}, { projection: { _id: 0 } })
          .sort({ createdAt: -1 })
          .limit(500)
          .toArray(),
      ]);

    return res.status(200).json({
      ok: true,
      summary: { active, canceled, failed },
      subscriptions,
      renewalHistory,
    });
  } catch (err) {
    console.error("[admin/subscriptions]", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
