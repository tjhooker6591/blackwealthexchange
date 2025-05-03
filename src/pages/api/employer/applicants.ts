// src/pages/api/employer/applicants.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId, WithId } from "mongodb";

interface ApplicantRecord {
  _id: ObjectId;
  userId: string;
  jobId: ObjectId;
  name?: string;
  email: string;
  resumeUrl?: string;
  appliedAt?: Date;
  appliedDate?: string;
}

interface JobRecord {
  _id: ObjectId;
  employerEmail: string;
  title: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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

  const limitParam = req.query.limit;
  const limit =
    typeof limitParam === "string" && !isNaN(Number(limitParam))
      ? parseInt(limitParam, 10)
      : 50;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Fetch jobs owned by the employer
    const jobs = await db
      .collection<WithId<JobRecord>>("jobs")
      .find({ employerEmail: payload.email })
      .project({ _id: 1, title: 1 })
      .toArray();

    const jobMap: Record<string, string> = {};
    const jobObjectIds = jobs.map((job) => {
      jobMap[job._id.toHexString()] = job.title;
      return job._id;
    });

    // Match applicants by job ObjectId
    const applicants = await db
      .collection<WithId<ApplicantRecord>>("applicants")
      .find({ jobId: { $in: jobObjectIds } })
      .sort({ appliedAt: -1 }) // sorting only affects newer records
      .limit(limit)
      .toArray();

    const result = applicants.map((a) => ({
      _id: a._id.toHexString(),
      jobId: a.jobId.toHexString(),
      name: a.name || a.email,
      email: a.email,
      resumeUrl: a.resumeUrl || "",
      jobTitle: jobMap[a.jobId.toHexString()] || "Unknown",
      appliedDate:
        a.appliedAt?.toISOString() ||
        (typeof a.appliedDate === "string" ? a.appliedDate : ""),
    }));

    return res.status(200).json({ applicants: result });
  } catch (err) {
    console.error("[API /employer/applicants] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
