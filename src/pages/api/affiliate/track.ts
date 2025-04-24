import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { userId, referralCode } = req.body;

  if (!userId || !referralCode) {
    return res.status(400).json({ error: "Missing userId or referralCode" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // 1️⃣ Find the affiliate by referralCode
    const affiliate = await db
      .collection("affiliates")
      .findOne({ referralCode });

    if (!affiliate) {
      return res.status(404).json({ error: "Affiliate referrer not found" });
    }

    // 2️⃣ Check if user already linked
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (user?.referredBy) {
      return res.status(200).json({ message: "User already referred." });
    }

    // 3️⃣ Link the new user to the affiliate
    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { referredBy: affiliate.referralCode } },
      );

    return res.status(200).json({ message: "Referral recorded." });
  } catch (err) {
    console.error("Affiliate track error", err);
    return res.status(500).json({ error: "Server error" });
  }
}
