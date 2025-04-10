// /pages/api/applicants/by-job.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
    const applicants = await db
      .collection("applicants")
      .find({ jobId: new ObjectId(jobId) })
      .sort({ appliedDate: -1 })
      .toArray();

    return res.status(200).json({ applicants });
  } catch (error) {
    console.error("Failed to fetch applicants:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
