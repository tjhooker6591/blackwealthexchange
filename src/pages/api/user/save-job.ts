// pages/api/user/save-job.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { ObjectId } from "mongodb";
import { getJwtSecret } from "@/lib/env";

const SECRET = getJwtSecret();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const jobId = typeof req.body?.jobId === "string" ? req.body.jobId : "";
  if (!jobId || !ObjectId.isValid(jobId)) {
    return res.status(400).json({ error: "Invalid jobId" });
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
  if (!userId || !ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  const client = await clientPromise;
  const db = client.db("bwes-cluster");

  if (req.method === "DELETE") {
    await db.collection("savedJobs").deleteOne({
      userId: new ObjectId(userId),
      jobId: new ObjectId(jobId),
    });
    return res.status(200).json({ success: true });
  }

  // Canonical saved-job store is the standalone savedJobs collection, keyed
  // by { userId, jobId } (protected by a unique compound index). Upsert
  // instead of insertOne so repeat saves are idempotent rather than
  // surfacing a duplicate-key error to the client.
  await db.collection("savedJobs").updateOne(
    { userId: new ObjectId(userId), jobId: new ObjectId(jobId) },
    {
      $setOnInsert: {
        userId: new ObjectId(userId),
        jobId: new ObjectId(jobId),
        savedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return res.status(201).json({ success: true });
}
