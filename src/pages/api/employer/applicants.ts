// src/pages/api/employer/applicants.ts

import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId, WithId } from "mongodb";

interface ApplicantRecord {
  _id: ObjectId;
  userId: string;
  jobId: string;
  name?: string;
  email: string;
  resumeUrl?: string;
  appliedAt: Date;
}

interface JobRecord {
  _id: ObjectId;
  employerEmail: string;
  title: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Parse and verify auth token
  const raw = req.headers.cookie || "";
  const { session_token: token } = parse(raw);
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let payload: { userId: string; email: string; accountType?: string };
  try {
    const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET!;
    payload = jwt.verify(token, SECRET) as typeof payload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (payload.accountType !== "employer") {
    return res.status(403).json({ error: "Access denied" });
  }

  // Determine how many applicants to fetch
  const limitParam = req.query.limit;
  const limit =
    typeof limitParam === "string" && !isNaN(Number(limitParam))
      ? parseInt(limitParam, 10)
      : 5;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Fetch jobs owned by this employer
    const jobs = await db
      .collection<WithId<JobRecord>>("jobs")
      .find({ employerEmail: payload.email })
      .project({ _id: 1, title: 1 })
      .toArray();

    const jobMap: Record<string, string> = {};
    const jobIds = jobs.map((j) => {
      const key = j._id.toHexString();
      jobMap[key] = j.title;
      return key;
    });

    // Fetch recent applicants for those jobs
    const applicants = await db
      .collection<WithId<ApplicantRecord>>("applicants")
      .find({ jobId: { $in: jobIds } })
      .sort({ appliedAt: -1 })
      .limit(limit)
      .toArray();

    // Format response
    const result = applicants.map((a) => ({
      _id: a._id.toHexString(),
      name: a.name || a.email,
      jobTitle: jobMap[a.jobId] || "Unknown",
      appliedAt: a.appliedAt.toISOString(),
    }));

    return res.status(200).json({ applicants: result });
  } catch (err) {
    console.error("[API /employer/applicants] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
