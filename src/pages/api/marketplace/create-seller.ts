import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      businessName,
      email,
      password,
      businessAddress,
      businessPhone,
      description,
    } = req.body;

    if (
      !businessName ||
      !email ||
      !password ||
      !businessAddress ||
      !businessPhone
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businesses = db.collection("businesses");

    const existing = await businesses.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Seller already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    await businesses.insertOne(newSeller);
    return res.status(201).json({ message: "Seller created successfully" });
  } catch (error) {
    console.error("Create Seller Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
