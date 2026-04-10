import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

interface JwtPayload {
  userId: string;
  email: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    } catch {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const userDoc = await db.collection("users").findOne(
      ObjectId.isValid(payload.userId)
        ? { _id: new ObjectId(payload.userId) }
        : { email: payload.email },
      {
        projection: {
          email: 1,
          fullName: 1,
          blackCardTier: 1,
          blackCardStatus: 1,
          blackCardMemberSince: 1,
          blackCardPlanExpiresAt: 1,
          blackCardRewardsBalance: 1,
        },
      },
    );

    if (!userDoc) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const recentActivity = await db
      .collection("flow_events")
      .find({
        userId: payload.userId,
        eventType: { $regex: /^black_card_/i },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const recentRedemptions = await db
      .collection("black_card_redemptions")
      .find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return res.status(200).json({
      ok: true,
      member: {
        fullName: userDoc.fullName || null,
        email: userDoc.email || payload.email,
        tier:
          typeof userDoc.blackCardTier === "string"
            ? userDoc.blackCardTier
            : null,
        status:
          typeof userDoc.blackCardStatus === "string"
            ? userDoc.blackCardStatus
            : "inactive",
        memberSince: userDoc.blackCardMemberSince || null,
        planExpiresAt: userDoc.blackCardPlanExpiresAt || null,
      },
      rewards: {
        balance:
          typeof userDoc.blackCardRewardsBalance === "number"
            ? userDoc.blackCardRewardsBalance
            : 0,
      },
      activity: recentActivity.map((item) => ({
        id: String(item._id),
        type: String(item.eventType || "black_card_activity"),
        at: item.createdAt || null,
      })),
      redemptions: recentRedemptions.map((item) => ({
        id: String(item._id),
        rewardType: String(item.rewardType || "reward"),
        value: typeof item.value === "number" ? item.value : 0,
        status: String(item.status || "pending"),
        at: item.createdAt || null,
      })),
    });
  } catch (error) {
    console.error("GET /api/black-card/member-summary error:", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
