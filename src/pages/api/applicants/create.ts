import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getJwtSecret } from "@/lib/env";
import { runApplicantVetting } from "@/lib/hiring/vetting";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const jobId = typeof req.body?.jobId === "string" ? req.body.jobId : "";
  if (!jobId || !ObjectId.isValid(jobId)) {
    return res.status(400).json({ error: "Invalid jobId" });
  }

  const { session_token } = req.cookies;
  if (!session_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let payload: any;
  try {
    payload = jwt.verify(session_token, getJwtSecret());
  } catch (_err) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userId = payload.userId;
  if (!userId || !ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid session payload" });
  }

  const client = await clientPromise;
  const db = client.db();

  // Prevent duplicate applications
  const existing = await db.collection("applicants").findOne({
    jobId: new ObjectId(jobId),
    userId: new ObjectId(userId),
  });
  if (existing) {
    return res.status(400).json({ error: "Already applied to this job" });
  }

  const now = new Date();
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId) });
  const resumeUrl = typeof user?.resumeUrl === "string" ? user.resumeUrl : "";
  const vetting = await runApplicantVetting(db, {
    userId: new ObjectId(userId),
    jobId: new ObjectId(jobId),
    resumeUrl,
  });

  const result = await db.collection("applicants").insertOne({
    jobId: new ObjectId(jobId),
    userId: new ObjectId(userId),
    name: user?.name || user?.email || "",
    email: user?.email || "",
    resumeUrl,
    appliedAt: now,
    hiringStatus: "new",
    statusUpdatedAt: now,
    vettingStatus: vetting.vettingStatus,
    vettingSignals: vetting.vettingSignals,
    vettingSummary: vetting.vettingSummary,
    vettingUpdatedAt: vetting.vettingUpdatedAt,
    vettingConfidenceBand: vetting.vettingConfidenceBand,
    manualOverride: false,
    overrideReason: "",
    statusHistory: [
      {
        status: "new",
        changedAt: now,
        actor: "system:application_submitted",
      },
    ],
  });

  res.status(201).json({
    success: true,
    applicantId: result.insertedId,
    vettingStatus: vetting.vettingStatus,
  });
}
