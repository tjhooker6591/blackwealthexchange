import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  BLACK_CARD_EARN_RULES,
  getBlackCardSession,
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

  const actionType = String(req.body?.actionType || "").trim();
  const referenceId = String(req.body?.referenceId || "").trim();
  if (!actionType || !referenceId) {
    return res
      .status(400)
      .json({ ok: false, error: "actionType and referenceId are required" });
  }

  const points = BLACK_CARD_EARN_RULES[actionType];
  if (!points) {
    return res
      .status(400)
      .json({ ok: false, error: "Unsupported rewards action" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();
  const actionKey = `${session.userId}:${actionType}:${referenceId}`;

  const existing = await db
    .collection("black_card_reward_actions")
    .findOne({ actionKey });
  if (existing) {
    return res.status(409).json({
      ok: false,
      error: "Duplicate rewards action",
      code: "DUPLICATE_ACTION",
    });
  }

  const recentEarnCount = await db
    .collection("black_card_rewards_ledger")
    .countDocuments({
      userId: session.userId,
      type: "credit",
      createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 5) },
    });
  if (recentEarnCount >= 10) {
    return res.status(429).json({
      ok: false,
      error: "Too many rewards actions in a short period",
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
          blackCardTier: 1,
          blackCardStatus: 1,
          blackCardPlanExpiresAt: 1,
          blackCardRewardsBalance: 1,
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

  await db.collection("black_card_reward_actions").insertOne({
    actionKey,
    userId: session.userId,
    actionType,
    referenceId,
    points,
    createdAt: now,
  });

  const nextBalance = Number(user.blackCardRewardsBalance || 0) + points;

  await db
    .collection("users")
    .updateOne(
      ObjectId.isValid(session.userId)
        ? { _id: new ObjectId(session.userId) }
        : { email: session.email },
      { $set: { blackCardRewardsBalance: nextBalance, updatedAt: now } },
    );

  await db.collection("black_card_rewards_ledger").insertOne({
    userId: session.userId,
    type: "credit",
    points,
    actionType,
    referenceId,
    balanceAfter: nextBalance,
    createdAt: now,
  });

  await db.collection("flow_events").insertOne({
    eventType: "black_card_rewards_earned",
    userId: session.userId,
    actionType,
    referenceId,
    points,
    balanceAfter: nextBalance,
    createdAt: now,
  });

  return res.status(200).json({ ok: true, points, balance: nextBalance });
}
