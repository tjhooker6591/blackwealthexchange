// src/pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import { ObjectId } from "mongodb";

interface UserRecord {
  _id: ObjectId;
  email: string;
  password?: string;
  accountType: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  fullName?: string;
  createdAt?: Date;
  [key: string]: unknown;
}

// Helper to load the JWT secret
function getSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("🛑 Define JWT_SECRET or NEXTAUTH_SECRET in your environment variables");
  }
  return secret;
}
const SECRET = getSecret();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Disable HTTP caching
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // Extract credentials and desired accountType from request
  const {
    email,
    password,
    accountType: bodyAccountType,
  } = req.body as { email: string; password: string; accountType?: string };

  // Validate input
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password are required." });
  }

  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Select collection based on requested or fallback accountType
    let collName = "users";
    if (bodyAccountType === "business") collName = "businesses";
    else if (bodyAccountType === "seller") collName = "sellers";
    else if (bodyAccountType === "employer") collName = "employers";

    const collection = db.collection<UserRecord>(collName);
    let user = await collection.findOne({ email });

    // Auto-create business profile if needed
    if (bodyAccountType === "business" && !user) {
      const newBiz: Omit<UserRecord, "_id"> = {
        email,
        accountType: "business",
        businessName: "",
        businessAddress: "",
        businessPhone: "",
        createdAt: new Date(),
      };
      const result = await (collection as any).insertOne(newBiz);
      user = { _id: result.insertedId, ...newBiz } as UserRecord;
    }

    // Invalid credentials if missing user record
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    // Verify password if present
    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ success: false, error: "Invalid credentials." });
      }
    }

    // Determine final role
    const role = bodyAccountType || user.accountType;

    // Sign JWT with unified secret
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        accountType: role,
      },
      SECRET,
      { expiresIn: "7d" }
    );

    console.log("🔐 [login] signed token for:", { email: user.email, accountType: role });

    // Set cookies: session token and accountType
    res.setHeader(
      "Set-Cookie",
      [
        cookie.serialize("session_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }),
        cookie.serialize("accountType", role, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }),
      ]
    );

    // Respond with sanitized user data
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        userId: user._id.toString(),
        email: user.email,
        accountType: role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
