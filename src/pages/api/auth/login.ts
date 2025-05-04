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
  isAdmin?: boolean;
  [key: string]: unknown;
}

// Your hardcoded admin email for now
const ADMIN_EMAIL = "youradmin@email.com"; // 🔁 Replace with your real admin email

function getSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("🚩 Define JWT_SECRET or NEXTAUTH_SECRET in your environment variables");
  }
  return secret;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  let SECRET: string;
  try {
    SECRET = getSecret();
  } catch (err) {
    console.error("Login handler secret load failed:", err);
    return res.status(500).json({ success: false, error: "Server configuration error." });
  }

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    const { email, password, accountType: bodyAccountType } = req.body as {
      email: string;
      password: string;
      accountType?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    let collName = "users";
    if (bodyAccountType === "business") collName = "businesses";
    else if (bodyAccountType === "seller") collName = "sellers";
    else if (bodyAccountType === "employer") collName = "employers";

    const collection = db.collection<UserRecord>(collName);
    let user = await collection.findOne({ email });

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

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ success: false, error: "Invalid credentials." });
      }
    }

    const role = bodyAccountType || user.accountType;

    // 🔐 Determine if this is an admin login
    const isAdmin = email === ADMIN_EMAIL || user.isAdmin === true;

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        accountType: role,
        isAdmin,
      },
      SECRET,
      { expiresIn: "7d" },
    );

    console.log("🔐 [login] signed token for:", {
      email: user.email,
      accountType: role,
      isAdmin,
    });

    res.setHeader("Set-Cookie", [
      cookie.serialize("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
      cookie.serialize("accountType", role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        userId: user._id.toString(),
        email: user.email,
        accountType: role,
        isAdmin,
      },
    });
  } catch (err) {
    console.error("Login handler unexpected error:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
