// File: /pages/api/user/applications-overview.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests.
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Extract and validate the email from query parameters.
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required and must be a string" });
  }

  try {
    // Connect to your MongoDB client.
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Use an aggregation pipeline to group applications by month.
    // Adjust the collection name ("applications") if your setup is different.
    const pipeline = [
      { $match: { email: email } },
      {
        $group: {
          _id: { month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ];

    const results = await db.collection("applications").aggregate(pipeline).toArray();

    // Map the aggregated results into a simpler array:
    // Each entry will have a 'month' (e.g., "2023-04") and the number of 'applications'.
    const chartData = results.map(result => ({
      month: result._id.month,
      applications: result.count
    }));

    return res.status(200).json(chartData);
  } catch (error) {
    console.error("Error fetching applications overview:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
