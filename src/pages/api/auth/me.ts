import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface JwtPayload {
  userId: string;
  email: string;
  accountType?: string;
}

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

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, SECRET) as JwtPayload;
    } catch (err) {
      console.error("❌ JWT verification failed:", err);
      return res
        .status(401)
        .json({ user: null, error: "Invalid or expired token." });
    }

    const accountType = payload.accountType || cookieRole;

    const collectionName =
      accountType === "seller"
        ? "sellers"
        : accountType === "employer"
          ? "employers"
          : accountType === "business"
            ? "businesses"
            : "users";

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const profile = await db
      .collection<UserProfile>(collectionName)
      .findOne({ email: payload.email });

    if (!profile) {
      return res.status(404).json({ user: null, error: "User not found." });
    }

    // Exclude sensitive fields
    const { password: _password, ...sanitized } = profile;

    return res.status(200).json({
      user: {
        ...sanitized,
        id: payload.userId,
        email: payload.email,
        accountType,
      },
    });
  } catch (err) {
    console.error("[/api/auth/me] Unexpected error:", err);
    return res
      .status(500)
      .json({ user: null, error: "Internal server error." });
  }
}
