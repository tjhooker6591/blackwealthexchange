// pages/api/affiliate/earnings.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { buyerId, amount, action } = req.body;

  if (!buyerId || !amount || !action) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const buyer = await db.collection("users").findOne({ _id: new ObjectId(buyerId) });

    if (!buyer?.referredBy) {
      return res.status(200).json({ message: "No referrer, no commission" });
    }

    await db.collection("affiliate_earnings").insertOne({
      referrerId: buyer.referredBy,
      referredUserId: buyer._id,
      amount: parseFloat((amount * 0.15).toFixed(2)), // 15% commission
      action,
      createdAt: new Date(),
      paidOut: false,
    });

    res.status(200).json({ message: "Commission logged" });
  } catch (err) {
    console.error("Earnings log error", err);
    res.status(500).json({ error: "Server error" });
  }
}
