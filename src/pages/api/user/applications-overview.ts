// src/pages/api/user/applications-overview.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET!;

type ApplicationOverview = {
  month: string;
  applications: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApplicationOverview[] | { error: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Parse & verify session cookie
  const rawCookies = req.headers.cookie ?? "";
  const { session_token: token } = cookie.parse(rawCookies);
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  let payload: { userId: string; email: string; accountType: string };
  try {
    payload = jwt.verify(token, SECRET) as any;
  } catch (err) {
    console.error("[applications-overview] JWT verify failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Enforce only general users
  const { userId, accountType } = payload;
  if (accountType !== "user") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Aggregate applications by month for this user
    const pipeline = [
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: "%Y-%m", date: "$appliedAt" } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ];

    const results = await db
      .collection('applicants')
      .aggregate<{ _id: { month: string }; count: number }>(pipeline)
      .toArray();

    const chartData: ApplicationOverview[] = results.map(r => ({
      month: r._id.month,
      applications: r.count
    }));

    return res.status(200).json(chartData);
  } catch (error) {
    console.error("[applications-overview] DB error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
