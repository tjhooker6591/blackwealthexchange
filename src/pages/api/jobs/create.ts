import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

// Fallback secret for local dev
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// Basic sanitization function to strip HTML/script tags
function sanitize(input: string): string {
  return input.replace(/<[^>]*>?/gm, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Get and parse token from cookies
    const rawCookie = req.headers.cookie || "";
    const cookies = parse(rawCookie);
    const token = cookies.token;

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
      return res.status(403).json({ error: "Forbidden: Only employers can post jobs." });
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
    } = req.body;

    // Basic required field check
    if (!title || !company || !location || !type || !description || !contactEmail) {
      return res.status(400).json({ error: "Missing required job fields" });
    }

    const job = {
      title: sanitize(title),
      company: sanitize(company),
      location: sanitize(location),
      type: sanitize(type),
      description: sanitize(description),
      salary: sanitize(salary || ""),
      contactEmail: sanitize(contactEmail),
      email: decoded.email,
      userId: decoded.userId,
      applicants: [],
      isFeatured: !!isFeatured,
      isPaid: !!isPaid,
      status: "active",
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const result = await db.collection("jobs").insertOne(job);

    return res.status(201).json({
      success: true,
      message: "Job posted successfully",
      jobId: result.insertedId,
    });
  } catch (err) {
    console.error("Job creation error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

