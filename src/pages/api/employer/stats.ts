// /pages/api/employer/stats.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const raw = req.headers.cookie || "";
    const cookies = parse(raw);
    const token = cookies.session_token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token found" });
    }

    const SECRET = process.env.JWT_SECRET || "dev-secret-key";
    const decoded = jwt.verify(token, SECRET) as {
      email: string;
      accountType: string;
    };

    if (decoded.accountType !== "employer") {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const jobs = await db
      .collection("jobs")
      .find({ employerEmail: decoded.email })
      .toArray();

    const jobsPosted = jobs.length;
    const totalApplicants = jobs.reduce(
      (sum, job) => sum + (job.appliedCount || 0),
      0,
    );

    return res.status(200).json({
      jobsPosted,
      totalApplicants,
      messages: 0, // Add real tracking later if needed
      profileCompletion: 100, // You can calculate this dynamically if desired
    });
  } catch (error) {
    console.error("[API /employer/stats] Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
