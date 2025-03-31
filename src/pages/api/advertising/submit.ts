// src/pages/api/advertising/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, email, businessName, adText, adImage, website, budget } = req.body;

  if (!name || !email || !businessName || !adText || !adImage || !budget) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes"); // Use your actual DB name
    const collection = db.collection("advertisingRequests");

    const newAd = {
      name,
      email,
      businessName,
      adText,
      adImage,
      website,
      budget,
      status: "pending", // can be approved/rejected later
      submittedAt: new Date(),
    };

    const result = await collection.insertOne(newAd);
    return res.status(201).json({ message: "Ad submitted", adId: result.insertedId });
  } catch (error) {
    console.error("Error saving ad request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
