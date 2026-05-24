import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const affiliateId = String(req.body?.affiliateId || "").trim();
    const amount = Number(req.body?.amount || 0);

    if (
      !affiliateId ||
      !ObjectId.isValid(affiliateId) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Valid affiliateId and amount are required" });
    }

    const commissionRate = 0.1;
    const commission = parseFloat((amount * commissionRate).toFixed(2));

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const affiliate = await db
      .collection("affiliates")
      .findOne({ _id: new ObjectId(affiliateId) }, { projection: { _id: 1 } });

    if (!affiliate) {
      return res.status(404).json({ message: "Affiliate not found" });
    }

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
