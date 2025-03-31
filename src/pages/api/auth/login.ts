import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import clientPromise from "../../../lib/mongodb"; // Ensure this points to your MongoDB connection

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, password, accountType } = req.body;

    if (!email || !password || !accountType) {
      return res.status(400).json({ error: "Missing credentials or account type" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    let user = null;

    if (accountType === "user") {
      user = await db.collection("users").findOne({ email });
    } else if (accountType === "seller") {
      user = await db.collection("businesses").findOne({ email });
    } else {
      return res.status(400).json({ error: "Invalid account type" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Return public-facing user data
    return res.status(200).json({
      message: "Login successful!",
      user: {
        email: user.email,
        accountType: accountType,
        businessName: user.businessName || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

