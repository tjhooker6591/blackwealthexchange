import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { nanoid } from "nanoid";
import cookie from "cookie";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  email: string;
  accountType?: string;
}

const SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "default_secret";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { name, website, audienceSize, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Missing required fields" });

  try {
    // Get session token from cookies
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token)
      return res.status(401).json({ error: "Unauthorized. Please log in." });

    const payload = jwt.verify(token, SECRET) as JwtPayload;
    const userId = payload.userId;
    const email = payload.email;

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Prevent duplicate affiliate applications
    const exists = await db
      .collection("affiliates")
      .findOne({ $or: [{ userId }, { email }] });
    if (exists) {
      return res
        .status(200)
        .json({
          message: "You have already applied.",
          referralLink: exists.referralLink,
        });
    }

    const referralCode = nanoid(6).toUpperCase();
    const referralLink = `https://blackwealthexchange.com/?ref=${referralCode}`;

    await db.collection("affiliates").insertOne({
      userId,
      name,
      email,
      website,
      audienceSize,
      notes,
      status: "pending",
      referralCode,
      referralLink,
      commissionTier: "standard",
      lifetimeEarnings: 0,
      clicks: 0,
      conversions: 0,
      paidAt: [],
      createdAt: new Date(),
    });

    return res.status(201).json({
      message:
        "Application submitted. You will receive a response within 3 business days.",
      referralLink,
    });
  } catch (err) {
    console.error("Affiliate Apply Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
