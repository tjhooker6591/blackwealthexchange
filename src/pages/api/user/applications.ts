import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret } from "@/lib/env";

type AppRow = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: "new" | "reviewed" | "shortlisted" | "contacted" | "rejected";
  submittedAt: string;
  statusUpdatedAt: string;
};

const SECRET = getJwtSecret();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ applications: AppRow[] } | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const token = cookie.parse(req.headers.cookie || "").session_token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let payload: { userId?: string; email?: string; accountType?: string };
  try {
    payload = jwt.verify(token, SECRET) as typeof payload;
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const userEmail = String(payload.email || "").toLowerCase();

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const match: any = { $or: [{ email: userEmail }] };
    if (payload.userId && ObjectId.isValid(payload.userId)) {
      match.$or.push({ userId: new ObjectId(payload.userId) });
      match.$or.push({ userId: payload.userId });
    }

    const docs = await db
      .collection("applicants")
      .find(match)
      .sort({ appliedAt: -1 })
      .limit(100)
      .toArray();

    const jobIds = docs
      .map((d: any) => d.jobId)
      .filter((id: any) => id && ObjectId.isValid(String(id)))
      .map((id: any) => new ObjectId(String(id)));

    const jobs = await db
      .collection("jobs")
      .find({ _id: { $in: jobIds } })
      .project({ title: 1, company: 1 })
      .toArray();

    const jobMap = new Map(jobs.map((j: any) => [String(j._id), j]));

    const applications: AppRow[] = docs.map((d: any) => {
      const job = jobMap.get(String(d.jobId));
      return {
        id: String(d._id),
        jobId: String(d.jobId),
        jobTitle: job?.title || "Job",
        company: job?.company || "Hiring Company",
        status: (d.hiringStatus || "new") as AppRow["status"],
        submittedAt: d.appliedAt
          ? new Date(d.appliedAt).toISOString()
          : d.appliedDate || "",
        statusUpdatedAt: d.statusUpdatedAt
          ? new Date(d.statusUpdatedAt).toISOString()
          : d.appliedAt
            ? new Date(d.appliedAt).toISOString()
            : "",
      };
    });

    return res.status(200).json({ applications });
  } catch (error) {
    console.error("[GET /api/user/applications]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
