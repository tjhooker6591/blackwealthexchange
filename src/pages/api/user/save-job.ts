// pages/api/user/save-job.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { ObjectId } from "mongodb";

const SECRET = process.env.JWT_SECRET!;

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

  // Parse & verify session token
  const rawCookies = req.headers.cookie ?? "";
  const { session_token: token } = cookie.parse(rawCookies);
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let payload: { userId: string; accountType: string };
  try {
    payload = jwt.verify(token, SECRET) as any;
  } catch (_err) {
    return res.status(401).json({ error: "Invalid session" });
  }

  // Only general users can save jobs
  if (payload.accountType !== "user") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const userId = payload.userId;

  const client = await clientPromise;
  const db = client.db("bwes-cluster");

  // Insert into savedJobs collection
  await db.collection("savedJobs").insertOne({
    userId: new ObjectId(userId),
    jobId: new ObjectId(jobId),
    savedAt: new Date(),
  });

  return res.status(201).json({ success: true });
}
