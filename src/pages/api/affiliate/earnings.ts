import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db("bwes-cluster");

  // Handle GET Request - Fetch Affiliate Earnings
  if (req.method === "GET") {
    const { userId } = req.query;

    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ error: "Invalid or missing userId" });
    }

    try {
      let affiliate = null;

      // Check if userId is a valid ObjectId first
      if (ObjectId.isValid(userId)) {
        affiliate = await db.collection("affiliates").findOne({ _id: new ObjectId(userId) });
      }

      // If not found by _id, try finding by userId field
      if (!affiliate) {
        affiliate = await db.collection("affiliates").findOne({ userId: userId });
      }

      if (!affiliate) {
        return res.status(404).json({ message: "Affiliate not found" });
      }

      return res.status(200).json({
        clicks: affiliate.clicks || 0,
        conversions: affiliate.conversions || 0,
        totalEarned: affiliate.totalEarned || 0,
        totalPaid: affiliate.totalPaid || 0,
      });
    } catch (err) {
      console.error("Fetch earnings error:", err);
      return res.status(500).json({ error: "Server error fetching earnings" });
    }
  }

  // Handle POST Request - Log Conversion Commission
  if (req.method === "POST") {
    const { buyerId, amount, action } = req.body;

    if (!buyerId || !amount || !action) {
      return res.status(400).json({ error: "Missing data in request body" });
    }

    try {
      const buyer = await db.collection("users").findOne({ _id: new ObjectId(buyerId) });

      if (!buyer?.referredBy) {
        return res.status(200).json({ message: "No referrer, no commission" });
      }

      const affiliate = await db.collection("affiliates").findOne({ referralCode: buyer.referredBy });
      if (!affiliate) {
        return res.status(404).json({ message: "Referrer affiliate not found." });
      }

      const commissionRate = affiliate.commissionRate || 0.15;
      const commission = parseFloat((amount * commissionRate).toFixed(2));

      await db.collection("affiliateConversions").insertOne({
        affiliateId: affiliate.affiliateId || affiliate._id,
        referredUserId: buyer._id,
        amount,
        commission,
        action,
        convertedAt: new Date(),
        paidOut: false
      });

      await db.collection("affiliates").updateOne(
        { _id: affiliate._id },
        { $inc: { lifetimeEarnings: commission, conversions: 1 } }
      );

      return res.status(200).json({ message: "Commission logged successfully." });

    } catch (err) {
      console.error("Earnings log error", err);
      return res.status(500).json({ error: "Server error logging commission" });
    }
  }

  // Method Not Allowed
  return res.status(405).end("Method Not Allowed");
}
