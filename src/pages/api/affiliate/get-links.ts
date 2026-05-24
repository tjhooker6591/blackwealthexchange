import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type SessionPayload = {
  userId?: string;
  id?: string;
  accountType?: string;
};

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
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  const session = getSession(req);
  if (!session) {
    return res.status(401).json({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Login required",
    });
  }

  const userId = String(req.query.userId || "").trim();
  if (!userId) return res.status(400).json({ message: "User ID is required" });

  const sessionUserId = String(session.userId || session.id || "").trim();
  const isAdmin = String(session.accountType || "").toLowerCase() === "admin";

  if (!isAdmin && sessionUserId !== userId) {
    return res
      .status(403)
      .json({ message: "Cannot fetch another user's affiliate links" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const affiliate = await db
      .collection("affiliates")
      .findOne(
        { userId },
        { projection: { referralLink: 1, referralCode: 1, status: 1 } },
      );

    if (!affiliate) {
      return res.status(404).json({ message: "Affiliate profile not found." });
    }

    return res.status(200).json({
      referralLink: affiliate.referralLink,
      referralCode: affiliate.referralCode,
      status: affiliate.status || "unknown",
    });
  } catch (err) {
    console.error("Error fetching affiliate link:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
