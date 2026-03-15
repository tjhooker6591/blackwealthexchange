// /pages/api/jobs/apply.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const { jobId, name, email, resumeUrl } = req.body;

    if (!jobId || !name || !email || !resumeUrl) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

    if (!ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, error: "Invalid jobId." });
    }

    const jobObjectId = new ObjectId(jobId);

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const applicants = db.collection("applicants");

    // ✅ Insert the applicant into the collection
    const insertedAt = new Date();

    const result = await applicants.insertOne({
      jobId: jobObjectId,
      name,
      email,
      resumeUrl,
      appliedAt: insertedAt,
    });

    await db.collection("flow_events").insertOne({
      eventType: "job_application_submitted",
      pageRoute: "/api/jobs/apply",
      section: "jobs_apply_api",
      source: "jobs_apply_api",
      source_variant: "canonical_jobs_apply",
      path: req.url || "/api/jobs/apply",
      jobId,
      entityId: jobId,
      entityType: "job",
      accountType: "candidate",
      applicantId: result.insertedId.toString(),
      createdAt: insertedAt,
    });

    // ✅ Safe increment of appliedCount: ensure it starts at 0 if missing
    await db.collection("jobs").updateOne(
      { _id: jobObjectId },
      {
        $inc: { appliedCount: 1 },
      },
    );

    return res
      .status(201)
      .json({ success: true, applicantId: result.insertedId });
  } catch (error) {
    console.error("Apply error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
