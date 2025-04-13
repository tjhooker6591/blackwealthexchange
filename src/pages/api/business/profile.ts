// pages/api/business/profile.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const business = await db.collection("businesses").findOne({ email });

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    return res.status(200).json({
      business: {
        businessName: business.businessName || "",
        businessAddress: business.businessAddress || "",
        businessPhone: business.businessPhone || "",
        description: business.description || "",
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
