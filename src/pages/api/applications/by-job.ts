import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

interface DecodedToken {
  email?: string;
  id?: string;
  accountType?: string;
  exp?: number;
  iat?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobId } = req.query;

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Missing or invalid jobId" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // 🔐 Validate session token
    const token = req.cookies.session_token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const employerEmail = decoded.email;
    if (!employerEmail) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // 🔎 Verify the job belongs to this employer
    const job = await db.collection("jobs").findOne({ _id: new ObjectId(jobId) });
    if (!job || job.employerEmail !== employerEmail) {
      return res.status(403).json({ error: "Access denied" });
    }

    // 🧾 Get applicants for the job
    const applicants = await db
      .collection("applicants")
      .find({ jobId: new ObjectId(jobId) })
      .project({ name: 1, email: 1, resumeUrl: 1, appliedDate: 1 })
      .sort({ appliedDate: -1 })
      .toArray();

    return res.status(200).json({ applicants });
  } catch (error) {
    console.error("Failed to fetch applicants:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
