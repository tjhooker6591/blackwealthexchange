import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const client = await clientPromise;
  const db = client.db("bwes-cluster");

  try {
    const jobs = await db.collection("jobs").find({}).toArray();
    const applicants = jobs.flatMap((job) => job.applicants || []);
    res.status(200).json({
      jobsPosted: jobs.length,
      totalApplicants: applicants.length,
    });
  } catch (error) {
    console.error("Error fetching employer stats:", error);
    res.status(500).json({ error: "Failed to load stats" });
  }
}
