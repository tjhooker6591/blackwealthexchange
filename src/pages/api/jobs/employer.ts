import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

interface DecodedToken {
  email: string;
  userId: string;
  accountType: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const rawCookie = req.headers.cookie || "";
    const cookies = parse(rawCookie);
    const token = cookies.session_token;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized. No token." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (
      decoded.accountType !== "business" &&
      decoded.accountType !== "employer"
    ) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const jobs = await db
      .collection("jobs")
      .find({ email: decoded.email })
      .sort({ createdAt: -1 })
      .toArray();

    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await db
          .collection("applicants")
          .countDocuments({ jobId: job._id });

        return {
          _id: job._id.toString(),
          title: job.title || "Untitled Job",
          company: job.company || "Your Company",
          location: job.location || "Remote",
          type: job.type || "Full-Time",
          datePosted:
            job.datePosted ||
            job.createdAt?.toISOString()?.split("T")[0] ||
            "N/A",
          applicants: count,
        };
      }),
    );

    return res.status(200).json({ success: true, jobs: jobsWithCounts });
  } catch (error) {
    console.error("Employer jobs fetch error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
