// src/pages/api/admin/affiliates/approve.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  const { affiliateId } = req.body;

  if (!affiliateId) {
    console.warn("Approval attempt without affiliateId");
    return res.status(400).json({ message: "Missing affiliateId" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const affiliate = await db
      .collection("affiliates")
      .findOne({ _id: new ObjectId(affiliateId) });

    if (!affiliate) {
      console.warn(`Affiliate with ID ${affiliateId} not found`);
      return res.status(404).json({ message: "Affiliate not found" });
    }

    if (affiliate.status === "active") {
      return res.status(200).json({ message: "Affiliate is already active" });
    }

    await db
      .collection("affiliates")
      .updateOne(
        { _id: new ObjectId(affiliateId) },
        { $set: { status: "active", approvedAt: new Date() } },
      );

    console.log(`✅ Affiliate ${affiliate.email} approved successfully.`);

    return res
      .status(200)
      .json({ message: `Affiliate ${affiliate.email} approved.` });
  } catch (err) {
    console.error("Affiliate approval error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error during approval" });
  }
}
