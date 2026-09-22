import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import { sanitizeRichHtml } from "@/lib/security/sanitizeHtml";

// Fallback secret for local dev
const JWT_SECRET = getJwtSecret();

function sanitizeText(input: string): string {
  return sanitizeRichHtml(input)
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const rawCookie = req.headers.cookie || "";
    const cookies = parse(rawCookie);
    const token = cookies.session_token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token found." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      email: string;
      userId: string;
      accountType: string;
    };

    // Only allow business/employer roles
    const allowedRoles = ["business", "employer"];
    if (!allowedRoles.includes(decoded.accountType)) {
      return res
        .status(403)
        .json({ error: "Forbidden: Only employers can post jobs." });
    }

    // Extract and sanitize inputs
    const {
      title = "",
      company = "",
      location = "",
      type = "",
      description = "",
      salary,
      contactEmail = "",
      isFeatured,
      isPaid,
      requiredSkills,
      requiredCertifications,
      minimumYearsExperience,
      requiresResume,
      workAuthorizationRequired,
    } = req.body;

    if (
      !title ||
      !company ||
      !location ||
      !type ||
      !description ||
      !contactEmail
    ) {
      return res.status(400).json({ error: "Missing required job fields" });
    }

    const normalizedRequiredSkills = Array.isArray(requiredSkills)
      ? requiredSkills
      : String(requiredSkills || "")
          .split(",")
          .map((s) => sanitizeText(String(s)).toLowerCase())
          .filter(Boolean);
    const normalizedRequiredCertifications = Array.isArray(
      requiredCertifications,
    )
      ? requiredCertifications
      : String(requiredCertifications || "")
          .split(",")
          .map((s) => sanitizeText(String(s)).toLowerCase())
          .filter(Boolean);
    const minYears = Number(minimumYearsExperience || 0);

    const job = {
      title: sanitizeText(title),
      company: sanitizeText(company),
      location: sanitizeText(location),
      type: sanitizeText(type),
      description: sanitizeRichHtml(String(description || "")).trim(),
      salary: sanitizeText(salary || ""),
      contactEmail: sanitizeText(contactEmail),
      email: decoded.email,
      userId: decoded.userId,
      applicants: [],
      isFeatured: !!isFeatured,
      isPaid: !!isPaid,
      requiresResume: requiresResume !== false,
      requiredSkills: normalizedRequiredSkills,
      requiredCertifications: normalizedRequiredCertifications,
      minimumYearsExperience: Number.isFinite(minYears)
        ? Math.max(0, minYears)
        : 0,
      workAuthorizationRequired: Boolean(workAuthorizationRequired),
      status: "pending", // <-- Updated from "active" to "pending"
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const result = await db.collection("jobs").insertOne(job);

    await db.collection("flow_events").insertOne({
      eventType: "job_post_submitted",
      pageRoute: "/api/jobs/create",
      section: "jobs_create_api",
      source: "jobs_create_api",
      source_variant: "canonical_jobs_create",
      path: req.url || "/api/jobs/create",
      jobId: result.insertedId.toString(),
      entityId: result.insertedId.toString(),
      entityType: "job",
      accountType: decoded.accountType || "employer",
      isAuthenticated: true,
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Job posted successfully and is pending approval",
      jobId: result.insertedId,
    });
  } catch (err) {
    console.error("Job creation error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
