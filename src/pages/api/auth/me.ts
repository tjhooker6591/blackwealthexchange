import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const rawCookie = req.headers.cookie || "";

    if (!rawCookie.includes("token")) {
      return res
        .status(401)
        .json({ user: null, error: "No token cookie found." });
    }

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token;

    if (!token) {
      return res.status(401).json({ user: null, error: "Token missing." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      accountType: string;
    };

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    let collectionName = "users";
    if (
      decoded.accountType === "business" ||
      decoded.accountType === "seller"
    ) {
      collectionName = "businesses";
    }

    const profile = await db
      .collection(collectionName)
      .findOne({ email: decoded.email });

    if (!profile) {
      return res
        .status(404)
        .json({ user: null, error: "User not found in database." });
    }

    // Exclude sensitive data
    delete profile.password;

    return res.status(200).json({
      user: {
        ...profile,
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
