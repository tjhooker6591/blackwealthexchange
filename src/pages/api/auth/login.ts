import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "../../../lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const { email, password, accountType } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Use accountType to decide collection
    let collectionName = "users";
    if (accountType === "business" || accountType === "seller") {
      collectionName = "businesses";
    }

    const user = await db.collection(collectionName).findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        accountType: user.accountType,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.setHeader(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        userId: user._id,
        email: user.email,
        accountType: user.accountType,
        businessName: user.businessName || null,
        fullName: user.fullName || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
}
