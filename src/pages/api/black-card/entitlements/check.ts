import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  getBlackCardSession,
  isTierAllowed,
  type BlackCardTier,
} from "@/lib/black-card-member";

const BENEFIT_MIN_TIER: Record<string, BlackCardTier> = {
  selected_events: "standard",
  selected_seminars: "standard",
  basic_offers: "standard",
  priority_events: "signature",
  premium_partner_offers: "signature",
  vip_events: "elite",
  elite_networking: "elite",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = getBlackCardSession(req);
  if (!session)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  const benefit = String(req.query.benefit || "").trim();
  const minimumTier = BENEFIT_MIN_TIER[benefit];
  if (!minimumTier) {
    return res.status(400).json({ ok: false, error: "Unknown benefit" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const user = await db
    .collection("users")
    .findOne(
      ObjectId.isValid(session.userId)
        ? { _id: new ObjectId(session.userId) }
        : { email: session.email },
      {
        projection: {
          blackCardTier: 1,
          blackCardStatus: 1,
          blackCardPlanExpiresAt: 1,
        },
      },
    );

  const planExpiresAt =
    user?.blackCardPlanExpiresAt instanceof Date
      ? user.blackCardPlanExpiresAt
      : user?.blackCardPlanExpiresAt
        ? new Date(user.blackCardPlanExpiresAt as string)
        : null;
  const isExpired =
    !!planExpiresAt &&
    Number.isFinite(planExpiresAt.getTime()) &&
    planExpiresAt.getTime() <= Date.now();

  const active =
    String(user?.blackCardStatus || "inactive").toLowerCase() === "active" &&
    !isExpired;
  const tier =
    typeof user?.blackCardTier === "string"
      ? user.blackCardTier.toLowerCase()
      : null;
  const allowed = active && isTierAllowed(tier, minimumTier);

  return res
    .status(200)
    .json({ ok: true, active, tier, benefit, minimumTier, allowed });
}
