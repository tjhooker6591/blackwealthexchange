import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { jobId } = req.body;
  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId" });
  }

  const { session_token } = req.cookies;
  if (!session_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let payload: any;
  try {
    payload = jwt.verify(session_token, process.env.JWT_SECRET!);
  } catch (_err) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userId = payload.userId;
  if (!userId) {
    return res.status(401).json({ error: "Invalid session payload" });
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

  const result = await db.collection("applicants").insertOne({
    jobId: new ObjectId(jobId),
    userId: new ObjectId(userId),
    appliedAt: new Date(),
  });

  res.status(201).json({ success: true, applicantId: result.insertedId });
}
