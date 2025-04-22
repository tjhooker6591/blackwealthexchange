// pages/api/affiliate/track.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { userId, referralCode } = req.body;

  if (!userId || !referralCode) {
    return res.status(400).json({ error: "Missing userId or referralCode" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Find the referrer by username or referral code
    const referrer = await db.collection("users").findOne({ username: referralCode });

    if (!referrer) {
      return res.status(404).json({ error: "Referrer not found" });
    }

    // Link the new user to the referrer
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { referredBy: referrer._id } }
    );

    res.status(200).json({ message: "Referral recorded" });
  } catch (err) {
    console.error("Affiliate track error", err);
    res.status(500).json({ error: "Server error" });
  }
}
