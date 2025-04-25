// /pages/api/payouts/request.ts

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb"; // Adjust if your path is different

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { sellerId, amount, paymentMethod, paymentDetails } = JSON.parse(
      req.body,
    );

    // Basic Validation
    if (!sellerId || !amount || !paymentMethod || !paymentDetails) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be greater than zero." });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Optional: Check if seller exists
    const seller = await db.collection("sellers").findOne({ _id: sellerId });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found." });
    }

    // Insert payout request
    const payoutData = {
      sellerId,
      amount,
      paymentMethod,
      paymentDetails,
      status: "pending", // Other statuses: 'paid', 'rejected'
      requestedAt: new Date(),
      paidAt: null,
      notes: "",
    };

    const result = await db.collection("payouts").insertOne(payoutData);

    return res.status(200).json({
      message: "Payout request submitted successfully.",
      payoutId: result.insertedId,
    });
  } catch (error) {
    console.error("Payout Request Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
