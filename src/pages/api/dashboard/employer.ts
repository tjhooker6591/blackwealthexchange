// /pages/api/dashboard/employer.ts

import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import cookie from "cookie"; // ✅ FIX: Add this import

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // ✅ Parse and verify token from cookies
    const rawCookie = req.headers.cookie || "";
    const parsed = cookie.parse(rawCookie);
    const token = parsed.token;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      accountType: string;
    };

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // ✅ Fetch business/employer by email
    const business = await db
      .collection("businesses")
      .findOne({ email: decoded.email });

    if (!business) {
      return res
        .status(404)
        .json({ success: false, error: "Employer not found" });
    }

    // ✅ Count jobs by this employer
    const jobs = db.collection("jobs");
    const jobCount = await jobs.countDocuments({
      userId: business._id.toString(),
    });

    // ✅ Count total applicants for those jobs
    const applicants = db.collection("applicants");
    const jobIds = await jobs
      .find({ userId: business._id.toString() })
      .project({ _id: 1 })
      .toArray();

    const jobIdList = jobIds.map((job) => job._id.toString());
    const applicantCount = await applicants.countDocuments({
      jobId: { $in: jobIdList },
    });

    // Optional: messages or notifications
    const messageCount = 0;

    return res.status(200).json({
      success: true,
      businessName: business.businessName || business.company || business.email,
      jobCount,
      applicants: applicantCount,
      messages: messageCount,
    });
  } catch (err) {
    console.error("Employer dashboard error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
