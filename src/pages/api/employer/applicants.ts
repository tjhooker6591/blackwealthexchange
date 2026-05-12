// src/pages/api/employer/applicants.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId, WithId } from "mongodb";
import { getJwtSecret } from "@/lib/env";

interface ApplicantRecord {
  _id: ObjectId;
  userId: string;
  jobId: ObjectId;
  name?: string;
  email: string;
  resumeUrl?: string;
  appliedAt?: Date;
  appliedDate?: string;
  hiringStatus?:
    | "new"
    | "reviewed"
    | "shortlisted"
    | "contacted"
    | "rejected"
    | "interview"
    | "hired";
  vettingStatus?: "qualified" | "review_needed" | "not_yet_qualified";
  vettingSignals?: any;
  vettingSummary?: string;
  vettingUpdatedAt?: Date;
  vettingConfidenceBand?: "high" | "medium" | "low";
  manualOverride?: boolean;
  overrideReason?: string;
  statusUpdatedAt?: Date;
  employerNote?: string;
  rejectionReason?: string;
  statusHistory?: Array<{
    status: string;
    changedAt?: Date;
    actor?: string;
    note?: string;
    rejectionReason?: string;
  }>;
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

  const raw = req.headers.cookie || "";
  const { session_token: token } = parse(raw);
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let payload: { userId: string; email: string; accountType?: string };
  try {
    const SECRET = getJwtSecret();
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
  const jobIdFilter =
    typeof req.query.jobId === "string" && ObjectId.isValid(req.query.jobId)
      ? new ObjectId(req.query.jobId)
      : null;
  const statusFilter =
    typeof req.query.status === "string"
      ? req.query.status.trim().toLowerCase()
      : "all";
  const searchQuery =
    typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

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
    if (
      jobIdFilter &&
      !jobObjectIds.some((id) => id.toHexString() === jobIdFilter.toHexString())
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const applicantsQuery: Record<string, any> = jobIdFilter
      ? { jobId: jobIdFilter }
      : { jobId: { $in: jobObjectIds } };

    if (
      statusFilter &&
      statusFilter !== "all" &&
      ["new", "reviewed", "shortlisted", "contacted", "rejected"].includes(
        statusFilter,
      )
    ) {
      applicantsQuery.hiringStatus = statusFilter;
    }

    const applicants = await db
      .collection<WithId<ApplicantRecord>>("applicants")
      .find(applicantsQuery)
      .sort({ appliedAt: -1 }) // sorting only affects newer records
      .limit(limit)
      .toArray();

    const result = applicants
      .map((a) => {
        const applicantId =
          a._id && typeof (a._id as any).toHexString === "function"
            ? (a._id as any).toHexString()
            : String(a._id || "");
        const jobIdStr =
          a.jobId && typeof (a.jobId as any).toHexString === "function"
            ? (a.jobId as any).toHexString()
            : String(a.jobId || "");

        return {
          _id: applicantId,
          jobId: jobIdStr,
          name: a.name || a.email,
          email: a.email,
          resumeUrl: a.resumeUrl || "",
          jobTitle: jobMap[jobIdStr] || "Unknown",
          hiringStatus: a.hiringStatus || "new",
          employerNote: a.employerNote || "",
          rejectionReason: a.rejectionReason || "",
          statusHistory: Array.isArray(a.statusHistory)
            ? a.statusHistory.map((h) => ({
                status: h.status,
                changedAt: h.changedAt
                  ? new Date(h.changedAt).toISOString()
                  : "",
                actor: h.actor || "",
                note: h.note || "",
                rejectionReason: h.rejectionReason || "",
              }))
            : [],
          appliedDate:
            a.appliedAt?.toISOString() ||
            (typeof a.appliedDate === "string" ? a.appliedDate : ""),
          vettingStatus: a.vettingStatus || "review_needed",
          vettingSignals: a.vettingSignals || null,
          vettingSummary: a.vettingSummary || "Awaiting screening summary.",
          vettingUpdatedAt: a.vettingUpdatedAt
            ? new Date(a.vettingUpdatedAt).toISOString()
            : "",
          vettingConfidenceBand: a.vettingConfidenceBand || "low",
          manualOverride: Boolean(a.manualOverride),
          overrideReason: a.overrideReason || "",
        };
      })
      .filter((item) => {
        if (!searchQuery) return true;
        const hay = `${item.name} ${item.email} ${item.jobTitle}`.toLowerCase();
        return hay.includes(searchQuery);
      });

    const statusCounts = result.reduce(
      (acc, item) => {
        const key = item.hiringStatus || "new";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {
        new: 0,
        reviewed: 0,
        shortlisted: 0,
        contacted: 0,
        rejected: 0,
      } as Record<string, number>,
    );

    return res.status(200).json({ applicants: result, meta: { statusCounts } });
  } catch (err) {
    console.error("[API /employer/applicants] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
