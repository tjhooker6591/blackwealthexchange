// src/pages/api/user/get-dashboard.ts

import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "../../../lib/mongodb";

const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET!;

type DashboardResponse = {
  fullName?: string;
  applications: number;
  savedJobs: number;
  messages: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardResponse | { error: string }>,
) {
  // Only GET allowed
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Disable caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // 1) Parse & verify session cookie
  const raw = req.headers.cookie ?? "";
  const { session_token: token } = cookie.parse(raw);
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let payload: { userId: string; email: string; accountType: string };
  try {
    payload = jwt.verify(token, SECRET) as any;
  } catch (err) {
    console.error("[get-dashboard] JWT verify failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // 2) Enforce only general users
  if (payload.accountType !== "user") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const db = (await clientPromise).db("bwes-cluster");
    const email = payload.email;

    // 3) Count applications
    const applications = await db
      .collection("applications")
      .countDocuments({ email });

    // 4) Count saved jobs
    const savedJobs = await db
      .collection("savedJobs")
      .countDocuments({ email });

    // 5) Count messages addressed to this user
    const messages = await db
      .collection("messages")
      .countDocuments({ recipientEmail: email });

    // 6) Optionally get fullName from your users collection
    const userDoc = await db
      .collection("users")
      .findOne({ email }, { projection: { fullName: 1 } });

    return res.status(200).json({
      fullName: userDoc?.fullName ?? undefined,
      applications,
      savedJobs,
      messages,
    });
  } catch (err) {
    console.error("[get-dashboard] DB error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
