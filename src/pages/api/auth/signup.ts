import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import clientPromise from "../../../lib/mongodb"; // Ensure this points to your MongoDB connection file

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

    // 🔹 Hash the Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Connect to MongoDB using clientPromise
    const client = await clientPromise;
    const db = client.db("bwes-cluster"); // Ensure to replace with your database name if needed

    if (accountType === "user") {
      const usersCollection = db.collection("users");

      // 🔹 Check if Email Already Exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // 🔹 Save New User
      await usersCollection.insertOne({
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });

      return res.status(201).json({ message: "User created successfully!" });
    } else if (accountType === "business") {
      const businessesCollection = db.collection("businesses");

      // 🔹 Validate Business Fields
      if (!businessName || !businessAddress || !businessPhone) {
        return res.status(400).json({
          error: "Business name, address, and phone number are required",
        });
      }

      // 🔹 Check if Business Already Exists
      const existingBusiness = await businessesCollection.findOne({
        businessName,
      });
      if (existingBusiness) {
        return res.status(400).json({ error: "Business already exists" });
      }

      // 🔹 Insert New Business
      await businessesCollection.insertOne({
        businessName,
        email,
        password: hashedPassword,
        businessAddress,
        businessPhone,
        description: description || "", // Optional description
        isVerified: false, // Default verification status
        createdAt: new Date(),
        accountType: "seller", // ✅ Added this without removing anything
      });

      return res
        .status(201)
        .json({ message: "Business created successfully!" });
    } else {
      return res.status(400).json({ error: "Invalid account type" });
    }
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
