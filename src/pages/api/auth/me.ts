import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

interface JwtPayload {
  userId: string;
  email: string;
  accountType?: string;
}

interface UserProfile {
  _id: ObjectId;
  email: string;
  accountType?: string;
  fullName?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  createdAt?: Date;
  updatedAt?: Date;
  password?: string;
  isPremium?: boolean;
  currentPlan?: string;
  premiumStatus?: string;
  premiumActivatedAt?: Date | null;
  [key: string]: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const raw = req.headers.cookie || "";
    const cookies = cookie.parse(raw);
    const token = cookies.session_token;
    const cookieRole = cookies.accountType;

    if (!token) {
      return res
        .status(401)
        .json({ user: null, error: "No token cookie found." });
    }

    let secret: string;
    try {
      secret = getJwtSecret();
    } catch {
      return res.status(500).json({
        user: null,
        error: "Server auth configuration is missing required secrets.",
      });
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, secret) as JwtPayload;
    } catch (err) {
      console.error("[/api/auth/me] JWT verification failed:", err);
      return res
        .status(401)
        .json({ user: null, error: "Invalid or expired token." });
    }

    const role = payload.accountType || cookieRole || "user";

    const collectionName =
      role === "seller"
        ? "sellers"
        : role === "employer"
          ? "employers"
          : role === "business"
            ? "businesses"
            : "users";

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const profile = await db
      .collection<UserProfile>(collectionName)
      .findOne({ email: payload.email });

    if (!profile) {
      return res.status(404).json({ user: null, error: "User not found." });
    }

    const { password: _password, ...sanitized } = profile;

    const normalizedAccountType =
      typeof profile.accountType === "string" && profile.accountType.trim()
        ? profile.accountType
        : role;

    const normalizedCurrentPlan =
      typeof profile.currentPlan === "string" && profile.currentPlan.trim()
        ? profile.currentPlan.toLowerCase()
        : profile.isPremium === true
          ? "premium"
          : "free";

    const normalizedPremiumStatus =
      typeof profile.premiumStatus === "string" && profile.premiumStatus.trim()
        ? profile.premiumStatus.toLowerCase()
        : normalizedCurrentPlan === "premium" || profile.isPremium === true
          ? "active"
          : "inactive";

    const normalizedIsPremium =
      profile.isPremium === true ||
      normalizedCurrentPlan === "premium" ||
      normalizedPremiumStatus === "active";

    return res.status(200).json({
      user: {
        ...sanitized,
        id: payload.userId,
        email: payload.email,
        accountType: normalizedAccountType,
        isPremium: normalizedIsPremium,
        currentPlan: normalizedCurrentPlan,
        premiumStatus: normalizedPremiumStatus,
        premiumActivatedAt: profile.premiumActivatedAt ?? null,
      },
    });
  } catch (err) {
    console.error("[/api/auth/me] Unexpected error:", err);
    return res
      .status(500)
      .json({ user: null, error: "Internal server error." });
  }
}