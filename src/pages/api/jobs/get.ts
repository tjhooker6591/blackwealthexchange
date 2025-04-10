import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Missing job ID." });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const jobs = db.collection("jobs");

    const job = await jobs.findOne({ _id: new ObjectId(id) });

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found." });
    }

    return res.status(200).json({ success: true, job });
  } catch (error) {
    console.error("Job fetch error:", error);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}
