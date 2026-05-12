import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret } from "@/lib/env";

const ALLOWED = [
  "new",
  "reviewed",
  "shortlisted",
  "contacted",
  "interview",
  "hired",
  "rejected",
] as const;
type HiringStatus = (typeof ALLOWED)[number];

function asStatus(v: unknown): HiringStatus | null {
  if (typeof v !== "string") return null;
  const x = v.trim().toLowerCase();
  return (ALLOWED as readonly string[]).includes(x)
    ? (x as HiringStatus)
    : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const token = parse(req.headers.cookie || "").session_token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let payload: { email: string; accountType?: string; userId?: string };
  try {
    const secret = getJwtSecret();
    payload = jwt.verify(token, secret) as typeof payload;
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (payload.accountType !== "employer") {
    return res.status(403).json({ error: "Access denied" });
  }

  const applicantId =
    typeof req.body?.applicantId === "string" ? req.body.applicantId : "";
  const nextStatus = asStatus(req.body?.status);
  const note =
    typeof req.body?.note === "string"
      ? req.body.note.trim().slice(0, 1000)
      : "";
  const rejectionReason =
    typeof req.body?.rejectionReason === "string"
      ? req.body.rejectionReason.trim().slice(0, 500)
      : "";
  const manualOverride = req.body?.manualOverride === true;
  const overrideReason =
    typeof req.body?.overrideReason === "string"
      ? req.body.overrideReason.trim().slice(0, 500)
      : "";

  if (!ObjectId.isValid(applicantId) || !nextStatus) {
    return res.status(400).json({ error: "Invalid applicantId or status" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const applicant = await db
      .collection("applicants")
      .findOne(
        { _id: new ObjectId(applicantId) },
        { projection: { jobId: 1, email: 1 } },
      );

    if (!applicant?.jobId) {
      return res.status(404).json({ error: "Applicant not found" });
    }

    const job = await db
      .collection("jobs")
      .findOne(
        { _id: applicant.jobId },
        { projection: { employerEmail: 1, email: 1 } },
      );

    const ownerEmail = String(
      job?.employerEmail || job?.email || "",
    ).toLowerCase();
    if (!job || ownerEmail !== String(payload.email || "").toLowerCase()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const now = new Date();
    const actor = String(
      payload.email || payload.userId || "employer",
    ).toLowerCase();

    const updateDoc: any = {
      $set: {
        hiringStatus: nextStatus,
        statusUpdatedAt: now,
        ...(note ? { employerNote: note } : {}),
        ...(nextStatus === "rejected" && rejectionReason
          ? { rejectionReason }
          : {}),
        ...(manualOverride ? { manualOverride: true, overrideReason } : {}),
      },
      $push: {
        statusHistory: {
          status: nextStatus,
          changedAt: now,
          actor,
          ...(note ? { note } : {}),
          ...(nextStatus === "rejected" && rejectionReason
            ? { rejectionReason }
            : {}),
        },
      },
    };

    await db
      .collection("applicants")
      .updateOne({ _id: new ObjectId(applicantId) }, updateDoc);

    await db.collection("notification_events").insertOne({
      type: "application_status_changed",
      audience: "applicant",
      applicantId,
      jobId: String(applicant.jobId),
      applicantEmail: applicant.email || "",
      employerEmail: ownerEmail,
      title: "Application status updated",
      body: `Your application status is now ${nextStatus}.`,
      read: false,
      createdAt: now,
    });

    return res.status(200).json({
      success: true,
      hiringStatus: nextStatus,
      statusChangedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[PATCH /api/employer/applicants/status]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
