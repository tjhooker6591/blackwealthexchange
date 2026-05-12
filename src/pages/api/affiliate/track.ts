import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type SessionPayload = { userId?: string; id?: string; email?: string };

function getSession(req: NextApiRequest): SessionPayload | null {
  const parsed = cookie.parse(req.headers.cookie || "");
  const token = parsed.session_token || req.cookies?.session_token;
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sessionUserId = String(session.userId || session.id || "").trim();
  const { userId, referralCode } = req.body || {};
  const targetUserId = String(userId || "").trim();

  if (!targetUserId || !referralCode) {
    return res.status(400).json({ error: "Missing userId or referralCode" });
  }

  if (sessionUserId && sessionUserId !== targetUserId) {
    return res
      .status(403)
      .json({ error: "Cannot attribute referral for another user" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const affiliate = await db.collection("affiliates").findOne({
      referralCode: String(referralCode).trim().toUpperCase(),
      status: { $in: ["approved", "active"] },
    });

    if (!affiliate) {
      return res.status(404).json({ error: "Affiliate referrer not found" });
    }

    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(targetUserId) },
        { projection: { referredBy: 1 } },
      );

    if (!user) {
      return res.status(404).json({ error: "Target user not found" });
    }

    if ((user as any)?.referredBy) {
      return res.status(200).json({ message: "User already referred." });
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(targetUserId) },
      {
        $set: {
          referredBy: affiliate.referralCode,
          referredByAffiliateId: String(affiliate._id),
          referralAttributedAt: new Date(),
        },
      },
    );

    return res.status(200).json({ message: "Referral recorded." });
  } catch (err) {
    console.error("Affiliate track error", err);
    return res.status(500).json({ error: "Server error" });
  }
}
