import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "bson";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const { jobId, name, email, resumeUrl } = req.body;

    if (!jobId || !name || !email || !resumeUrl) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let jobObjectId;
    try {
      jobObjectId = ObjectId.createFromHexString(jobId); // ✅ Recommended way to create ObjectId
    } catch {
      return res.status(400).json({ success: false, message: "Invalid job ID format" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const newApplicant = {
      jobId: jobObjectId,
      name,
      email,
      resumeUrl,
      appliedDate: new Date(),
    };

    const result = await db.collection("applicants").insertOne(newApplicant);

    return res.status(200).json({ success: true, applicantId: result.insertedId });
  } catch (error) {
    console.error("Error submitting applicant:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
}


