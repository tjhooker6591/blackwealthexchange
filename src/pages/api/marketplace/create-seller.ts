// pages/api/marketplace/create-seller.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

type ApiOk = { success: true; seller: Record<string, any> };
type ApiErr = { success: false; error: string };

function getCookie(req: NextApiRequest, name: string) {
  const raw = req.headers.cookie || "";
  const parts = raw.split(";").map((p) => p.trim());
  const hit = parts.find((p) => p.startsWith(`${name}=`));
  if (!hit) return "";
  return decodeURIComponent(hit.substring(name.length + 1));
}

function normalizeEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

// NOTE: this assumes your JWT secret is the same one used in /api/auth/login
function getSessionUserId(req: NextApiRequest) {
  const token = getCookie(req, "session_token");
  if (!token) return "";

  const secret = process.env.JWT_SECRET;
  if (!secret) return "";

  try {
    const payload = jwt.verify(token, secret) as any;
    return String(payload?.userId || payload?.id || payload?._id || "");
  } catch {
    return "";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // Supports two flows:
  // A) Public seller signup: fullName + email + password + businessName + description (+ optional fields)
  // B) Upgrade existing logged-in user to seller: userId + businessName + description (+ optional fields)
  const {
    // Signup fields
    fullName,
    email,
    password,

    // Common business fields
    businessName,
    description,
    website,
    category,
    businessPhone,
    businessAddress,

    // Optional upgrade field
    userId,
  } = req.body || {};

  const storeName = String(businessName || "").trim();
  const storeDescription = String(description || "").trim();
  const websiteStr = String(website || "").trim();
  const categoryStr = String(category || "").trim();
  const phoneStr = String(businessPhone || "").trim();
  const addressStr = String(businessAddress || "").trim();

  // Basic required fields
  if (!storeName || storeName.length < 2) {
    return res
      .status(400)
      .json({ success: false, error: "Business name is required." });
  }
  if (!storeDescription || storeDescription.length < 10) {
    return res.status(400).json({
      success: false,
      error: "Description is required (min 10 characters).",
    });
  }

  const client = await clientPromise;
  const db = client.db(); // If needed: client.db("bwes-cluster")

  // ---------- FLOW B: Upgrade existing user to seller ----------
  // Only allowed if session user matches userId
  if (userId) {
    const sessionUserId = getSessionUserId(req);
    if (!sessionUserId) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated." });
    }
    if (String(userId) !== String(sessionUserId)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: userId does not match your session.",
      });
    }

    const uid = (() => {
      try {
        return new ObjectId(String(userId));
      } catch {
        return null;
      }
    })();

    if (!uid) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid userId." });
    }

    // Check if seller already exists for this user
    const existingSeller = await db
      .collection("sellers")
      .findOne({ userId: String(userId) });

    if (existingSeller) {
      return res
        .status(409)
        .json({ success: false, error: "Seller already exists for this user." });
    }

    // Pull existing user credentials (so they keep their same password hash)
    const existingUser = await db.collection("users").findOne({ _id: uid });

    if (!existingUser?.email || !existingUser?.password) {
      return res.status(400).json({
        success: false,
        error:
          "Could not upgrade: user record missing email/password. Please register as a seller instead.",
      });
    }

    const normalized = normalizeEmail(existingUser.email);

    // Guard against duplicates by email
    const sellerEmailTaken = await db
      .collection("sellers")
      .findOne({ email: normalized });

    if (sellerEmailTaken) {
      return res.status(409).json({
        success: false,
        error: "A seller account already exists for this email.",
      });
    }

    const now = new Date();

    const sellerDoc = {
      userId: String(userId),
      ownerName: String(existingUser.name || existingUser.fullName || "").trim(),
      email: normalized,
      password: existingUser.password, // copy hash from users collection
      accountType: "seller",

      storeName,
      storeDescription,
      website: websiteStr,
      category: categoryStr,
      phone: phoneStr,
      address: addressStr,

      createdAt: now,
      joinedAt: now,
      lastLogin: null,

      productsListed: 0,
      totalSales: 0,

      status: "active", // or "pending_verification" if you want admin verification
      logoUrl: "",
      payoutDetails: "",
      payoutMethod: "",

      isPremium: false,
      isVerified: false,
    };

    const result = await db.collection("sellers").insertOne(sellerDoc);
    // never return password
    const { password: _pw, ...safeSeller } = sellerDoc;

    return res.status(201).json({
      success: true,
      seller: { _id: result.insertedId, ...safeSeller },
    });
  }

  // ---------- FLOW A: New seller signup ----------
  const normalizedEmail = normalizeEmail(String(email || ""));
  const full = String(fullName || "").trim();
  const pass = String(password || "");

  if (!full || full.length < 2) {
    return res
      .status(400)
      .json({ success: false, error: "Full name is required." });
  }
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res
      .status(400)
      .json({ success: false, error: "Valid email is required." });
  }
  if (!pass || pass.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Password is required (min 8 characters).",
    });
  }

  // Prevent duplicates across collections (recommended)
  const [sellerDup, userDup, businessDup, employerDup] = await Promise.all([
    db.collection("sellers").findOne({ email: normalizedEmail }),
    db.collection("users").findOne({ email: normalizedEmail }),
    db.collection("businesses").findOne({ email: normalizedEmail }),
    db.collection("employers").findOne({ email: normalizedEmail }),
  ]);

  if (sellerDup || userDup || businessDup || employerDup) {
    return res.status(409).json({
      success: false,
      error:
        "An account with this email already exists. Please log in instead.",
    });
  }

  const passwordHash = await bcrypt.hash(pass, 10);
  const now = new Date();

  const sellerDoc = {
    // no userId yet; this IS the seller account
    userId: null,

    ownerName: full,
    email: normalizedEmail,
    password: passwordHash,
    accountType: "seller",

    storeName,
    storeDescription,
    website: websiteStr,
    category: categoryStr,
    phone: phoneStr,
    address: addressStr,

    createdAt: now,
    joinedAt: now,
    lastLogin: null,

    productsListed: 0,
    totalSales: 0,

    status: "active", // or "pending_verification"
    logoUrl: "",
    payoutDetails: "",
    payoutMethod: "",

    isPremium: false,
    isVerified: false,
  };

  try {
    const result = await db.collection("sellers").insertOne(sellerDoc);
    const { password: _pw, ...safeSeller } = sellerDoc;

    return res.status(201).json({
      success: true,
      seller: { _id: result.insertedId, ...safeSeller },
    });
  } catch (err: any) {
    console.error("create-seller error:", err);
    return res
      .status(500)
      .json({ success: false, error: err?.message || "Server error" });
  }
}

