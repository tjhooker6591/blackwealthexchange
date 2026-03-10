// src/pages/api/admin/complete-affiliate-payout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

type Decoded = {
  userId?: string;
  email?: string;
  accountType?: string;
  role?: string;
  isAdmin?: boolean;
  roles?: string[];
};

function isAdmin(decoded: Decoded) {
  if (decoded?.isAdmin) return true;
  if (decoded?.accountType === "admin") return true;
  if (decoded?.role === "admin") return true;
  if (Array.isArray(decoded?.roles) && decoded.roles.includes("admin"))
    return true;

  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && decoded?.email) {
    return allow.includes(decoded.email.toLowerCase());
  }

  return false;
}

async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<Decoded | null> {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!SECRET) throw new Error("JWT secret missing");

    const decoded = jwt.verify(token, SECRET) as Decoded;

    if (process.env.NODE_ENV === "production" && !isAdmin(decoded)) {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }

    return decoded;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const { payoutId } = body;

    if (!payoutId || !ObjectId.isValid(payoutId)) {
      return res.status(400).json({ error: "Valid payoutId is required" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const payouts = db.collection("affiliatePayouts");
    const affiliates = db.collection("affiliates");

    const payout = await payouts.findOne({ _id: new ObjectId(payoutId) });
    if (!payout) {
      return res.status(404).json({ error: "Payout not found" });
    }
    if (payout.status === "completed") {
      return res
        .status(409)
        .json({ error: "Payout already completed", payoutId });
    }

    const amount = Number(payout.amount || 0);
    const affiliateId = payout.affiliateId;
    const affiliateSelector =
      typeof affiliateId === "string" && ObjectId.isValid(affiliateId)
        ? { _id: new ObjectId(affiliateId) }
        : { _id: affiliateId as any };

    const result = await payouts.updateOne(
      { _id: new ObjectId(payoutId), status: { $ne: "completed" } },
      {
        $set: {
          status: "completed",
          processedAt: new Date(),
          completedAt: new Date(),
          completedBy: admin.email || admin.userId || "admin",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Payout not found or already completed" });
    }

    if (affiliateId && amount > 0) {
      await affiliates.updateOne(affiliateSelector, {
        $inc: { totalPaid: amount },
        $set: { updatedAt: new Date() },
      });
    }

    return res.status(200).json({
      success: true,
      payoutId,
      status: "completed",
      message: "Payout marked as completed.",
    });
  } catch (err) {
    console.error("[/api/admin/complete-affiliate-payout] Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
