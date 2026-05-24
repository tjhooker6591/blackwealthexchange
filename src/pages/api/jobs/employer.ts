import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

const JWT_SECRET = getJwtSecret();

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
      .find({
        $or: [{ email: decoded.email }, { employerEmail: decoded.email }],
      })
      .sort({ createdAt: -1 })
      .toArray();

    const jobIds = jobs.map((job) => job._id);

    const applicantCounts = await db
      .collection("applicants")
      .aggregate<{
        _id: any;
        total: number;
        new: number;
        reviewed: number;
        shortlisted: number;
        contacted: number;
        rejected: number;
      }>([
        { $match: { jobId: { $in: jobIds } } },
        {
          $group: {
            _id: "$jobId",
            total: { $sum: 1 },
            new: {
              $sum: {
                $cond: [
                  { $eq: [{ $ifNull: ["$hiringStatus", "new"] }, "new"] },
                  1,
                  0,
                ],
              },
            },
            reviewed: {
              $sum: {
                $cond: [{ $eq: ["$hiringStatus", "reviewed"] }, 1, 0],
              },
            },
            shortlisted: {
              $sum: {
                $cond: [{ $eq: ["$hiringStatus", "shortlisted"] }, 1, 0],
              },
            },
            contacted: {
              $sum: {
                $cond: [{ $eq: ["$hiringStatus", "contacted"] }, 1, 0],
              },
            },
            rejected: {
              $sum: {
                $cond: [{ $eq: ["$hiringStatus", "rejected"] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();

    const countsByJob = new Map(
      applicantCounts.map((row) => [String(row._id), row]),
    );

    const jobsWithCounts = jobs.map((job) => {
      const row = countsByJob.get(String(job._id));
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
        applicants: row?.total || 0,
        statusCounts: {
          new: row?.new || 0,
          reviewed: row?.reviewed || 0,
          shortlisted: row?.shortlisted || 0,
          contacted: row?.contacted || 0,
          rejected: row?.rejected || 0,
        },
        isFeatured: Boolean(job.isFeatured),
        viewCount: Number(job.viewCount || 0),
      };
    });

    return res.status(200).json({ success: true, jobs: jobsWithCounts });
  } catch (error) {
    console.error("Employer jobs fetch error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
