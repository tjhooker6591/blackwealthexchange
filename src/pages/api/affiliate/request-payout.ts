import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

function getSessionUserId(req: NextApiRequest) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) return "";
  try {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) return "";
    const decoded = jwt.verify(token, secret) as any;
    return String(decoded?.userId || "");
  } catch {
    return "";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const sessionUserId = getSessionUserId(req);
    if (!sessionUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { payoutMethod, payoutDetails } = req.body || {};

    if (!payoutMethod || !payoutDetails) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const affiliate = await db
      .collection("affiliates")
      .findOne({ userId: sessionUserId });
    if (!affiliate) {
      return res.status(404).json({ message: "Affiliate not found." });
    }

    const pending = await db.collection("affiliatePayouts").findOne({
      affiliateId: affiliate._id,
      status: { $in: ["pending", "approved"] },
    });

    if (pending) {
      return res.status(409).json({
        message:
          "You already have a pending payout request. Please wait for processing.",
      });
    }

    const totalEarned = Number(affiliate.totalEarned || 0);
    const totalPaid = Number(affiliate.totalPaid || 0);
    const availableEarnings = Number((totalEarned - totalPaid).toFixed(2));

    if (availableEarnings <= 0) {
      return res
        .status(400)
        .json({ message: "No earnings available for payout." });
    }

    await db.collection("affiliatePayouts").insertOne({
      affiliateId: affiliate._id,
      userId: sessionUserId,
      amount: availableEarnings,
      payoutMethod,
      payoutDetails,
      status: "pending",
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({ message: "Payout request submitted." });
  } catch (err) {
    console.error("Payout Request Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
