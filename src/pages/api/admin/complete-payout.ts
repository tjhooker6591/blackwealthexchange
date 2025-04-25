import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { payoutId } = req.body;

    if (!payoutId) {
      return res.status(400).json({ message: "Missing payoutId" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const result = await db
      .collection("affiliatePayouts")
      .updateOne(
        { _id: new ObjectId(payoutId) },
        { $set: { status: "completed", processedAt: new Date() } },
      );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Payout not found or already completed" });
    }

    res.status(200).json({ message: "Payout marked as completed." });
  } catch (err) {
    console.error("Complete Payout Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
