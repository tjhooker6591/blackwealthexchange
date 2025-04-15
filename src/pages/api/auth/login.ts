// src/pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "../../../lib/mongodb";
import { serialize } from "cookie";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

interface UserRecord {
  _id: ObjectId;
  email: string;
  password?: string;
  accountType?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  fullName?: string;
  createdAt?: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const { email, password, accountType } = req.body as {
      email: string;
      password: string;
      accountType: string;
    };

    if (!email || !password || !accountType) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and accountType are required.",
      });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Determine which collection to query
    let collectionName = "users";
    if (accountType === "business") collectionName = "businesses";
    else if (accountType === "seller") collectionName = "sellers";
    else if (accountType === "employer") collectionName = "employers";

    const collection = db.collection<UserRecord>(collectionName);

    // Attempt to find the user
    let user = await collection.findOne({ email });

    // Optionally auto-create a business profile on first login
    if (accountType === "business" && !user) {
      const newBiz: Omit<UserRecord, "_id"> = {
        email,
        accountType: "business",
        businessName: "",
        businessAddress: "",
        businessPhone: "",
        createdAt: new Date(),
      };
      const result = await collection.insertOne(newBiz as any);
      user = {
        _id: result.insertedId,
        ...newBiz,
      };
      console.warn("Auto‑created business profile without password");
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // If a password exists on the record, verify it
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid credentials" });
      }
    }

    // Determine the final accountType
    const actualAccountType = user.accountType || accountType;

    // Sign the JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        accountType: actualAccountType,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookies
    res.setHeader("Set-Cookie", [
      serialize("session_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      }),
      serialize("accountType", actualAccountType, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      }),
    ]);

    // Return user info
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        userId: user._id.toString(),
        email: user.email,
        accountType: actualAccountType,
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


