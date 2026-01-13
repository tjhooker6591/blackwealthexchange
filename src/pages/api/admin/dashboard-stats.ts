import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Businesses
    const pendingBusinesses = await db
      .collection("businesses")
      .countDocuments({ status: "pending" });

    // Affiliate payouts
    const pendingPayouts = await db
      .collection("affiliatePayouts")
      .countDocuments({ status: "pending" });

    // Active affiliates
    const activeAffiliates = await db
      .collection("affiliates")
      .countDocuments({ status: "active" });

    // Jobs & products
    const pendingJobs = await db
      .collection("jobs")
      .countDocuments({ status: "pending" });

    const pendingProducts = await db
      .collection("products")
      .countDocuments({ status: "pending" });

    // Users
    const totalUsers = await db.collection("users").countDocuments();

    // 👇 NEW: Intern applications
    const internApplications = await db
      .collection("intern_applications")
      .countDocuments();

    res.status(200).json({
      pendingBusinesses,
      pendingPayouts,
      activeAffiliates,
      pendingJobs,
      pendingProducts,
      totalUsers,
      internApplications, // 👈 returned to dashboard
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
}
