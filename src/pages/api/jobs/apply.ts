// /pages/api/jobs/apply.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const { jobId, name, email, resumeUrl } = req.body;

    if (!jobId || !name || !email || !resumeUrl) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const applicants = db.collection("applicants");

    const result = await applicants.insertOne({
      jobId: new ObjectId(jobId),
      name,
      email,
      resumeUrl,
      appliedDate: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, applicantId: result.insertedId });
  } catch (error) {
    console.error("Apply error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
