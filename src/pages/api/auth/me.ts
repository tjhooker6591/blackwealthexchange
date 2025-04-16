// src/pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// Define the shape of your user profiles in the database
interface UserProfile {
  _id: ObjectId;
  email: string;
  accountType: string;
  password?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  fullName?: string;
  // any other fields you store
  [key: string]: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Disable HTTP caching so the client always gets fresh user data
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    // Parse cookies
    const rawCookie = req.headers.cookie || "";
    const parsed = cookie.parse(rawCookie);
    // Read session_token (set by login) or fallback to legacy token
    const token = parsed.session_token || parsed.token;
    if (!token) {
      return res
        .status(401)
        .json({ user: null, error: "No token cookie found." });
    }

    // Verify and decode the JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      accountType: string;
    };

    // Map accountType to the correct collection
    let collectionName: string;
    switch (decoded.accountType) {
      case "business":
        collectionName = "businesses";
        break;
      case "seller":
        collectionName = "sellers";
        break;
      case "employer":
        collectionName = "employers";
        break;
      case "user":
      default:
        collectionName = "users";
    }

    // Fetch the profile
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const profile = await db
      .collection<UserProfile>(collectionName)
      .findOne({ email: decoded.email });

    if (!profile) {
      return res
        .status(404)
        .json({ user: null, error: "User not found in database." });
    }

    // Exclude sensitive data
    const { password: _password, ...sanitized } = profile;

    // Return the user object
    return res.status(200).json({
      user: {
        ...sanitized,
        userId: decoded.userId,
        accountType: decoded.accountType,
      },
    });
  } catch (error) {
    console.error("JWT auth error:", error);
    return res
      .status(401)
      .json({ user: null, error: "Invalid or expired token." });
  }
}
