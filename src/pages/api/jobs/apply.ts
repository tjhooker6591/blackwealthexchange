// /pages/api/jobs/apply.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";

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
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!jobId || !name || !normalizedEmail) {
      return res
        .status(400)
        .json({ success: false, error: "Name, email, and job are required." });
    }

    if (!ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, error: "Invalid jobId." });
    }

    const jobObjectId = new ObjectId(jobId);

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const applicants = db.collection("applicants");

    const existing = await applicants.findOne({
      jobId: jobObjectId,
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error:
          "You have already applied for this role with this email. If needed, contact the employer directly to share updates.",
      });
    }

    // ✅ Insert the applicant into the collection
    const insertedAt = new Date();

    const result = await applicants.insertOne({
      jobId: jobObjectId,
      name,
      email: normalizedEmail,
      resumeUrl: typeof resumeUrl === "string" ? resumeUrl : "",
      appliedAt: insertedAt,
      hiringStatus: "new",
      statusUpdatedAt: insertedAt,
      statusHistory: [
        {
          status: "new",
          changedAt: insertedAt,
          actor: "system:application_submitted",
        },
      ],
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

    const job = await db
      .collection("jobs")
      .findOne(
        { _id: jobObjectId },
        { projection: { title: 1, employerEmail: 1, email: 1 } },
      );

    await db.collection("notification_events").insertMany([
      {
        type: "application_submitted",
        audience: "applicant",
        applicantId: result.insertedId.toString(),
        applicantEmail: normalizedEmail,
        jobId,
        title: "Application submitted",
        body: `Your application for ${job?.title || "this role"} was submitted successfully.`,

        read: false,
        createdAt: insertedAt,
      },
      {
        type: "new_applicant",
        audience: "employer",
        employerEmail: String(
          job?.employerEmail || job?.email || "",
        ).toLowerCase(),
        applicantId: result.insertedId.toString(),
        applicantEmail: normalizedEmail,
        jobId,
        title: "New applicant received",
        body: `${name} applied for ${job?.title || "your job posting"}.`,
        read: false,
        createdAt: insertedAt,
      },
    ]);

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
