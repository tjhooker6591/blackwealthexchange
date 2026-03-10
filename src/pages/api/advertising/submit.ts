// src/pages/api/advertising/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const name = String(body.name || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const businessName = String(body.businessName || "").trim();
  const adText = String(body.adText || "").trim();
  const adImage = String(body.adImage || "").trim();
  const website = String(body.website || "").trim();
  const budget = String(body.budget || "").trim();
  const option = String(body.option || "").trim();
  const durationDays = Number(body.durationDays || 0);
  const placement = String(body.placement || "").trim();

  if (!name || !EMAIL_REGEX.test(email) || !businessName || !adText) {
    return res.status(400).json({ error: "Missing required campaign details" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const collection = db.collection("advertising_requests");

    const now = new Date();
    const newAd = {
      requestType: "standard_ad",
      status: "pending_review",
      paymentStatus: "unpaid",
      depositPaid: false,
      name,
      email,
      business: businessName,
      details: adText,
      selectedOptions: option ? [option] : [],
      budget: budget || null,
      adImage: adImage || null,
      website: website || null,
      option: option || null,
      durationDays:
        Number.isFinite(durationDays) && durationDays > 0
          ? Math.floor(durationDays)
          : null,
      placement: placement || null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newAd);
    return res.status(201).json({
      success: true,
      message: "Ad request submitted",
      adId: result.insertedId.toString(),
      requestId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error saving ad request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
