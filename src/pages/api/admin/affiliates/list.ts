// src/pages/api/admin/affiliates/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const [pending, active, rejected] = await Promise.all([
      db.collection("affiliates").find({ status: "pending" }).toArray(),
      db.collection("affiliates").find({ status: "active" }).toArray(),
      db.collection("affiliates").find({ status: "rejected" }).toArray(),
    ]);

    return res.status(200).json({
      pending: pending.map(formatAffiliate),
      active: active.map(formatAffiliate),
      rejected: rejected.map(formatAffiliate),
    });
  } catch (err) {
    console.error("Error fetching affiliates:", err);
    return res
      .status(500)
      .json({ message: "Internal server error while fetching affiliates" });
  }
}

function formatAffiliate(affiliate: any) {
  const totalEarned = Number(
    affiliate.totalEarned || affiliate.lifetimeEarnings || 0,
  );
  const totalPaid = Number(affiliate.totalPaid || 0);

  return {
    _id: affiliate._id.toString(),
    userId: affiliate.userId || null,
    name: affiliate.name,
    email: affiliate.email,
    status: affiliate.status,
    clicks: affiliate.clicks || 0,
    conversions: affiliate.conversions || 0,
    totalEarned,
    totalPaid,
    availableEarnings: Number((totalEarned - totalPaid).toFixed(2)),
    appliedAt: affiliate.createdAt || null,
    approvedAt: affiliate.approvedAt || null,
    rejectedAt: affiliate.rejectedAt || null,
    updatedAt: affiliate.updatedAt || null,
  };
}
