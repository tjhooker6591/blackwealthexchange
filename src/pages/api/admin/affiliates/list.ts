// src/pages/api/admin/affiliates/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    console.warn(`Method ${req.method} not allowed on /api/admin/affiliates/list`);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Fetch all statuses in parallel
    const [pending, active, rejected] = await Promise.all([
      db.collection("affiliates").find({ status: "pending" }).toArray(),
      db.collection("affiliates").find({ status: "active" }).toArray(),
      db.collection("affiliates").find({ status: "rejected" }).toArray(),
    ]);

    console.log(`Pending: ${pending.length}, Active: ${active.length}, Rejected: ${rejected.length}`);

    return res.status(200).json({ 
      pending: pending.map(formatAffiliate),
      active: active.map(formatAffiliate),
      rejected: rejected.map(formatAffiliate),
    });
  } catch (err) {
    console.error("❌ Error fetching affiliates:", err);
    return res.status(500).json({ message: "Internal server error while fetching affiliates" });
  }
}

function formatAffiliate(affiliate: any) {
  return {
    _id: affiliate._id.toString(),
    name: affiliate.name,
    email: affiliate.email,
    status: affiliate.status,
    clicks: affiliate.clicks || 0,
    conversions: affiliate.conversions || 0,
    lifetimeEarnings: affiliate.lifetimeEarnings || 0,
    appliedAt: affiliate.createdAt || null,
    approvedAt: affiliate.approvedAt || null,
    rejectedAt: affiliate.rejectedAt || null,
  };
}
