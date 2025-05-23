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
    const { affiliateId, amount } = req.body;

    if (!affiliateId || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const commissionRate = 0.1; // 10% commission
    const commission = parseFloat((amount * commissionRate).toFixed(2));

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    await db.collection("affiliateConversions").insertOne({
      affiliateId,
      amount,
      commission,
      convertedAt: new Date(),
    });

    await db.collection("affiliates").updateOne(
      { _id: new ObjectId(affiliateId) },
      {
        $inc: {
          conversions: 1,
          totalEarned: commission,
        },
      },
    );

    return res.status(200).json({ message: "Conversion tracked." });
  } catch (err) {
    console.error("Track Conversion Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
