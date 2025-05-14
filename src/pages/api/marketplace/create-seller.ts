// pages/api/marketplace/create-seller.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const {
    userId,
    businessName,
    description,
    website,
    businessPhone,
    email,
    businessAddress,
    accountType,
  } = req.body;

  if (
    !userId ||
    !businessName ||
    !description ||
    !businessPhone ||
    !email ||
    !businessAddress ||
    accountType !== "seller"
  ) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const existing = await db.collection("sellers").findOne({ userId });
    if (existing) {
      return res.status(409).json({ message: "Seller already exists" });
    }

    const passwordHash = await bcrypt.hash("temporaryPass123!", 10);
    const now = new Date();

    const sellerDoc = {
      userId,
      email,
      password: passwordHash, // still present here
      accountType,
      storeName: businessName,
      createdAt: now,
      joinedAt: now,
      lastLogin: null,
      productsListed: 0,
      totalSales: 0,
      status: "active",
      address: businessAddress,
      phone: businessPhone,
      storeDescription: description,
      website: website || "",
      logoUrl: "",
      payoutDetails: "",
      payoutMethod: "",
      isPremium: false,
      isVerified: false,
    };

    const result = await db.collection("sellers").insertOne(sellerDoc);

    // Strip out `password` for the response
    const { password: _password, ...sellerWithoutPassword } = sellerDoc;

    return res.status(201).json({
      seller: { _id: result.insertedId, ...sellerWithoutPassword },
    });
  } catch (err: any) {
    console.error("create-seller error:", err);
    return res.status(500).json({ message: err.message });
  }
}
