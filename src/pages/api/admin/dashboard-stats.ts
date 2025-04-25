import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const pendingBusinesses = await db.collection("businesses").countDocuments({ status: "pending" });
    const pendingPayouts = await db.collection("affiliatePayouts").countDocuments({ status: "pending" });
    const activeAffiliates = await db.collection("affiliates").countDocuments({ status: "active" });

    // If you don't have these collections yet, set to 0
    const pendingJobs = 0;
    const pendingProducts = 0;

    const totalUsers = await db.collection("users").countDocuments();

    res.status(200).json({ pendingBusinesses, pendingPayouts, activeAffiliates, pendingJobs, pendingProducts, totalUsers });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
}
