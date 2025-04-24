// src/pages/api/admin/affiliates/reject.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    console.warn(
      `Method ${req.method} not allowed on /api/admin/affiliates/reject`,
    );
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { affiliateId } = req.body;
  if (!affiliateId)
    return res.status(400).json({ message: "Missing affiliateId" });

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const affiliate = await db
      .collection("affiliates")
      .findOne({ _id: new ObjectId(affiliateId) });

    if (!affiliate) {
      console.warn(
        `Attempted to reject non-existent affiliate ID: ${affiliateId}`,
      );
      return res.status(404).json({ message: "Affiliate not found" });
    }

    // Soft delete: mark as rejected
    await db
      .collection("affiliates")
      .updateOne(
        { _id: new ObjectId(affiliateId) },
        { $set: { status: "rejected", rejectedAt: new Date() } },
      );

    console.log(`❌ Affiliate ${affiliate.email} has been rejected.`);

    return res
      .status(200)
      .json({ message: `Affiliate ${affiliate.email} rejected.` });
  } catch (err) {
    console.error("Affiliate rejection error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error during rejection" });
  }
}
