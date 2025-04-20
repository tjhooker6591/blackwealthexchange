// src/pages/api/employer/jobs.ts

import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";

interface JobRecord {
  _id: any;
  title: string;
  location: string;
  type: string;
  description: string;
  employerEmail: string;
  createdAt: Date;
  [key: string]: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const raw = req.headers.cookie || "";
  const { session_token: token } = cookie.parse(raw);
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let payload: { userId: string; email: string; accountType?: string };
  try {
    const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET!;
    payload = jwt.verify(token, SECRET) as typeof payload;
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (payload.accountType !== "employer") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { limit } = req.query;
  let num = 10;
  if (typeof limit === "string" && !isNaN(parseInt(limit, 10))) {
    num = parseInt(limit, 10);
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const jobs = await db
      .collection<JobRecord>("jobs")
      .find({ employerEmail: payload.email })
      .sort({ createdAt: -1 })
      .limit(num)
      .toArray();

    const result = jobs.map((j) => ({
      _id: String(j._id),
      title: j.title,
      location: j.location,
      type: j.type,
      description: j.description,
    }));

    return res.status(200).json({ jobs: result });
  } catch (err) {
    console.error("[API /employer/jobs] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
