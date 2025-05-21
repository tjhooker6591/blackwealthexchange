// src/pages/api/user/saved-jobs.ts

import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET!;

type SavedJob = {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SavedJob[] | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Disable caching to ensure fresh data every request
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Parse & verify session
  const rawCookies = req.headers.cookie ?? "";
  const { session_token: token } = cookie.parse(rawCookies);
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let payload: { userId: string; email: string; accountType: string };
  try {
    payload = jwt.verify(token, SECRET) as any;
  } catch (err) {
    console.error("[saved-jobs] JWT verify failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Enforce only general users
  const { userId, accountType } = payload;
  if (accountType !== "user") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Fetch user document to get savedJobs array
    const userDoc = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) }, { projection: { savedJobs: 1 } });

    const savedIds = Array.isArray(userDoc?.savedJobs)
      ? userDoc.savedJobs.map((id: any) => new ObjectId(id))
      : [];

    // Fetch job details
    const jobs = await db
      .collection("jobs")
      .find({ _id: { $in: savedIds } })
      .toArray();

    // Map to response type
    const response: SavedJob[] = jobs.map((job: any) => ({
      _id: job._id.toHexString(),
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      salary: job.salary,
      description: job.description,
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("[saved-jobs] DB error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
