import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Count businesses where status is 'pending'
    const pendingBusinesses = await db
      .collection("businesses")
      .countDocuments({ status: "pending" });

    // Count affiliate payouts where status is 'pending'
    const pendingPayouts = await db
      .collection("affiliatePayouts")
      .countDocuments({ status: "pending" });

    // Count active affiliates
    const activeAffiliates = await db
      .collection("affiliates")
      .countDocuments({ status: "active" });

    // Assuming you'll implement these later:
    const pendingJobs = await db
      .collection("jobs")
      .countDocuments({ status: "pending" });

    const pendingProducts = await db
      .collection("products")
      .countDocuments({ status: "pending" });

    // Total users count
    const totalUsers = await db.collection("users").countDocuments();

    res.status(200).json({
      pendingBusinesses,
      pendingPayouts,
      activeAffiliates,
      pendingJobs,
      pendingProducts,
      totalUsers,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
}
