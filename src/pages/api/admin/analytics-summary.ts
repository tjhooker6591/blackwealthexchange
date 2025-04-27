import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const [users, businesses, products, jobs, sellers] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("businesses").countDocuments(),
      db.collection("products").countDocuments(),
      db.collection("jobs").countDocuments(),
      db.collection("sellers").countDocuments(),
    ]);

    // Aggregate user growth by month (starting from April)
    const userGrowthRaw = await db.collection("users").aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]).toArray();

    // Format data for chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const userGrowth = userGrowthRaw.map(entry => ({
      month: `${monthNames[entry._id.month - 1]} ${entry._id.year}`,
      users: entry.count
    }));

    return res.status(200).json({
      users,
      businesses,
      products,
      jobs,
      sellers,
      userGrowth
    });
  } catch (error) {
    console.error("Analytics Fetch Error:", error);
    return res.status(500).json({ error: "Failed to load analytics data." });
  }
}
