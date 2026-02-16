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
  isAdmin?: boolean;
  [key: string]: unknown;
}

const ADMIN_EMAIL = "blackwealth24@gmail.com";

function getSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Define JWT_SECRET or NEXTAUTH_SECRET in env vars");
  }
  return secret;
}

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

// Escape regex special chars for safe fallback match
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      accountType?: "user" | "business" | "seller" | "employer";
    };

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const emailNorm = normalizeEmail(email);

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    let collName: "users" | "businesses" | "sellers" | "employers" = "users";
    if (bodyAccountType === "business") collName = "businesses";
    else if (bodyAccountType === "seller") collName = "sellers";
    else if (bodyAccountType === "employer") collName = "employers";

    const collection = db.collection<UserRecord>(collName);

    // Primary lookup (normalized email)
    let user = await collection.findOne({ email: emailNorm });

    // Fallback for legacy mixed-case emails (optional but helpful)
    if (!user) {
      user = await collection.findOne({
        email: { $regex: `^${escapeRegex(email.trim())}$`, $options: "i" },
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    // If accountType was selected, enforce it matches the record (prevents wrong role tokens)
    if (bodyAccountType && user.accountType && bodyAccountType !== user.accountType) {
      return res.status(400).json({
        success: false,
        error: "Wrong account type selected for this account. Please choose the correct account type.",
      });
    }

    // Must have a password hash to login (unless you later support OAuth)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: "This account does not have a password set. Please use Forgot Password to set one.",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    const role = user.accountType || bodyAccountType || "user";
    const isAdmin = emailNorm === normalizeEmail(ADMIN_EMAIL) || user.isAdmin === true;

    // 30-minute JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: emailNorm,
        accountType: role,
        isAdmin,
      },
      SECRET,
      { expiresIn: "30m" },
    );

    const isProd = process.env.NODE_ENV === "production";
    const cookieDomain = isProd ? ".blackwealthexchange.com" : undefined;

    res.setHeader("Set-Cookie", [
      cookie.serialize("session_token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 30,
        domain: cookieDomain,
      }),
      cookie.serialize("accountType", role, {
        httpOnly: false,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 30,
        domain: cookieDomain,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        // return BOTH styles so your frontends don’t break
        id: user._id.toString(),
        userId: user._id.toString(),
        email: emailNorm,
        accountType: role,
        isAdmin,
      },
    });
  } catch (err) {
    console.error("Login handler unexpected error:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
