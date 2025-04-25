import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const payouts = await db
      .collection("affiliatePayouts")
      .find({})
      .sort({ requestedAt: -1 })
      .toArray();

    // Fetch affiliate info for each payout
    const enrichedPayouts = await Promise.all(
      payouts.map(async (payout) => {
        const affiliate = await db
          .collection("affiliates")
          .findOne({ _id: payout.affiliateId });
        return {
          ...payout,
          affiliateName: affiliate?.name || "Unknown",
          affiliateEmail: affiliate?.email || "N/A",
        };
      }),
    );

    res.status(200).json({ payouts: enrichedPayouts });
  } catch (err) {
    console.error("Get Payouts Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
