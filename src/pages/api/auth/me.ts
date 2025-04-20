// src/pages/api/auth/me.ts

import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Use a single SECRET for both signing and verification
interface JwtPayload {
  userId: string;
  email: string;
  accountType?: string;
}
// Load secret from environment
function getSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "🛑 Define JWT_SECRET or NEXTAUTH_SECRET in your environment variables",
    );
  }
  return secret;
}
const SECRET = getSecret();

interface UserProfile {
  _id: ObjectId;
  email: string;
  accountType: string;
  fullName?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  createdAt?: Date;
  password?: string;
  [key: string]: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    // Parse cookies
    const raw = req.headers.cookie || "";
    const cookies = cookie.parse(raw);
    const token = cookies.session_token;
    const cookieRole = cookies.accountType;

    if (!token) {
      return res
        .status(401)
        .json({ user: null, error: "No token cookie found." });
    }

    // Verify token
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, SECRET) as JwtPayload;
    } catch (err) {
      console.error("JWT verify failed", err);
      return res
        .status(401)
        .json({ user: null, error: "Invalid or expired token." });
    }

    // Resolve accountType (prefer token, fallback to cookie)
    const accountType = payload.accountType || cookieRole;

    // Determine collection name
    const collName =
      accountType === "seller"
        ? "sellers"
        : accountType === "employer"
          ? "employers"
          : accountType === "business"
            ? "businesses"
            : "users";

    // Fetch profile from MongoDB
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const profile = await db
      .collection<UserProfile>(collName)
      .findOne({ email: payload.email });

    if (!profile) {
      return res.status(404).json({ user: null, error: "User not found." });
    }

    // Sanitize profile: strip out password
    const { password: _password, ...sanitized } = profile;

    // Return sanitized user object
    return res.status(200).json({
      user: {
        ...sanitized,
        userId: payload.userId,
        accountType,
      },
    });
  } catch (err) {
    console.error("[API /auth/me] Error:", err);
    return res
      .status(500)
      .json({ user: null, error: "Internal server error." });
  }
}
