import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ No need to parse req.body
    const { userId, payoutMethod, payoutDetails } = req.body;

    if (!userId || !payoutMethod || !payoutDetails) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Find affiliate by userId
    const affiliate = await db.collection("affiliates").findOne({ userId });
    if (!affiliate) {
      return res.status(404).json({ message: "Affiliate not found." });
    }

    const availableEarnings =
      (affiliate.totalEarned || 0) - (affiliate.totalPaid || 0);
    if (availableEarnings <= 0) {
      return res
        .status(400)
        .json({ message: "No earnings available for payout." });
    }

    // Insert payout request
    await db.collection("affiliatePayouts").insertOne({
      affiliateId: affiliate._id,
      userId,
      amount: availableEarnings,
      payoutMethod,
      payoutDetails,
      status: "pending",
      requestedAt: new Date(),
    });

    // ✅ Increment totalPaid by availableEarnings
    await db
      .collection("affiliates")
      .updateOne({ userId }, { $inc: { totalPaid: availableEarnings } });

    return res.status(200).json({ message: "Payout request submitted." });
  } catch (err) {
    console.error("Payout Request Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
