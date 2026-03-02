// src/pages/api/admin/expire-directory-listing.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

type Decoded = {
  userId?: string;
  email?: string;
  accountType?: string;
  role?: string;
  isAdmin?: boolean;
  roles?: string[];
};

function isAdmin(decoded: Decoded) {
  if (decoded?.isAdmin) return true;
  if (decoded?.accountType === "admin") return true;
  if (decoded?.role === "admin") return true;
  if (Array.isArray(decoded?.roles) && decoded.roles.includes("admin"))
    return true;

  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && decoded?.email) {
    return allow.includes(decoded.email.toLowerCase());
  }

  return false;
}

async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<Decoded | null> {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!SECRET) throw new Error("JWT secret missing");

    const decoded = jwt.verify(token, SECRET) as Decoded;

    if (process.env.NODE_ENV === "production" && !isAdmin(decoded)) {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }

    return decoded;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const { listingId } =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    if (!listingId || !ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: "Valid listingId is required" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const now = new Date();

    const result = await db.collection("directory_listings").findOneAndUpdate(
      { _id: new ObjectId(listingId) },
      {
        $set: {
          // compatibility + new truth model
          status: "expired",
          listingStatus: "expired",

          // payment should remain whatever it already was; if not set, keep paid if previously paid
          updatedAt: now,
          expiredAt: now,
          expiredBy: admin.email || admin.userId || "admin",

          // slot/featured cleanup
          featuredSlot: null,
          featuredStartDate: null,
          featuredEndDate: null,

          // no longer active, no longer needs queue placement
          needsAttention: false,
        },
        $unset: {
          queuePosition: "",
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return res.status(404).json({ error: "Directory listing not found" });
    }

    return res.status(200).json({
      success: true,
      listingId,
      status: "expired",
      listingStatus: "expired",
    });
  } catch (err) {
    console.error("[expire-directory-listing] Error:", err);
    return res.status(500).json({ error: "Expire failed" });
  }
}
