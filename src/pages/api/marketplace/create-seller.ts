// src/pages/api/marketplace/create-seller.ts
import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    businessName,
    email,
    password,
    businessAddress,
    businessPhone,
    description,
  } = req.body;

  // Validate required fields
  if (
    !businessName ||
    !email ||
    !password ||
    !businessAddress ||
    !businessPhone
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const sellers = db.collection("sellers");

    // Check if a seller with this email already exists
    const existing = await sellers.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Seller already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare the new seller document
    const newSeller = {
      businessName,
      email,
      password: hashedPassword,
      businessAddress,
      businessPhone,
      description: description || "",
      accountType: "seller",
      isVerified: false,
      createdAt: new Date(),
    };

    // Insert and capture the insertedId
    const result = await sellers.insertOne(newSeller);

    return res
      .status(201)
      .json({ message: "Seller created successfully", sellerId: result.insertedId });
  } catch (error) {
    console.error("Create Seller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
