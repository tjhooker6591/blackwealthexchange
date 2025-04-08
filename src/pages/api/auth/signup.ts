import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import clientPromise from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      email,
      password,
      accountType,
      businessName,
      businessAddress,
      businessPhone,
      description,
    } = req.body;

    // 🔹 Validate Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // 🔹 Validate Password Strength
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // 🔹 Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // 🔸 General User or Job Seeker
    if (accountType === "user" || accountType === "jobSeeker") {
      const usersCollection = db.collection("users");

      // Check for duplicates
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      await usersCollection.insertOne({
        email,
        password: hashedPassword,
        accountType,
        createdAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Account created successfully!",
        accountType,
      });
    }

    // 🔸 Business / Employer
    if (accountType === "business") {
      const businessesCollection = db.collection("businesses");

      if (!businessName || !businessAddress || !businessPhone) {
        return res.status(400).json({
          error: "Business name, address, and phone number are required",
        });
      }

      const existingBusiness = await businessesCollection.findOne({
        businessName,
      });

      if (existingBusiness) {
        return res.status(400).json({ error: "Business already exists" });
      }

      await businessesCollection.insertOne({
        businessName,
        email,
        password: hashedPassword,
        businessAddress,
        businessPhone,
        description: description || "",
        isVerified: false,
        accountType: "business",
        createdAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Business created successfully!",
        accountType,
      });
    }

    return res.status(400).json({ error: "Invalid account type." });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
