import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  BLACK_CARD_REDEMPTION_COSTS,
  BLACK_CARD_REDEMPTION_MIN_TIER,
  getBlackCardSession,
  isTierAllowed,
} from "@/lib/black-card-member";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = getBlackCardSession(req);
  if (!session)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  const rewardType = String(req.body?.rewardType || "").trim();
  const referenceId = String(
    req.body?.referenceId || `redeem-${Date.now()}`,
  ).trim();
  const cost = BLACK_CARD_REDEMPTION_COSTS[rewardType];
  if (!cost)
    return res.status(400).json({ ok: false, error: "Unsupported rewardType" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();

  const recentRedeemCount = await db
    .collection("black_card_redemptions")
    .countDocuments({
      userId: session.userId,
      createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 10) },
    });
  if (recentRedeemCount >= 5) {
    return res.status(429).json({
      ok: false,
      error: "Too many redemption attempts. Please wait and try again.",
      code: "RATE_LIMITED",
    });
  }

  const user = await db
    .collection("users")
    .findOne(
      ObjectId.isValid(session.userId)
        ? { _id: new ObjectId(session.userId) }
        : { email: session.email },
      {
        projection: {
          blackCardStatus: 1,
          blackCardPlanExpiresAt: 1,
          blackCardRewardsBalance: 1,
          blackCardTier: 1,
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

  if (
    !user ||
    String(user.blackCardStatus || "inactive").toLowerCase() !== "active" ||
    isExpired
  ) {
    return res
      .status(403)
      .json({ ok: false, error: "Active Black Card membership required" });
  }

  const minimumTier = BLACK_CARD_REDEMPTION_MIN_TIER[rewardType];
  const tier =
    typeof user.blackCardTier === "string" ? user.blackCardTier : null;
  if (minimumTier && !isTierAllowed(tier, minimumTier)) {
    return res.status(403).json({
      ok: false,
      error: `This redemption requires ${minimumTier} tier or higher`,
      code: "INSUFFICIENT_TIER",
    });
  }

  const balance = Number(user.blackCardRewardsBalance || 0);
  if (balance < cost) {
    return res.status(409).json({
      ok: false,
      error: "Insufficient rewards balance",
      code: "INSUFFICIENT_BALANCE",
    });
  }

  const nextBalance = balance - cost;

  await db
    .collection("users")
    .updateOne(
      ObjectId.isValid(session.userId)
        ? { _id: new ObjectId(session.userId) }
        : { email: session.email },
      { $set: { blackCardRewardsBalance: nextBalance, updatedAt: now } },
    );

  const redemption = {
    userId: session.userId,
    rewardType,
    value: cost,
    pointsCost: cost,
    referenceId,
    status: "pending",
    createdAt: now,
  };

  await db.collection("black_card_redemptions").insertOne(redemption);

  await db.collection("black_card_rewards_ledger").insertOne({
    userId: session.userId,
    type: "debit",
    points: -cost,
    actionType: "redemption",
    referenceId,
    rewardType,
    balanceAfter: nextBalance,
    createdAt: now,
  });

  await db.collection("flow_events").insertOne({
    eventType: "black_card_rewards_redeemed",
    userId: session.userId,
    rewardType,
    pointsCost: cost,
    balanceAfter: nextBalance,
    createdAt: now,
  });

  return res.status(200).json({
    ok: true,
    redemption: { rewardType, status: "pending", pointsCost: cost },
    balance: nextBalance,
  });
}
