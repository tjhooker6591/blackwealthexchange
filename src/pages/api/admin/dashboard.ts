// src/pages/api/admin/dashboard.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
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

type Business = {
  _id: string;
  businessName: string;
  email: string;
  address: string;
  approved: boolean;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
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
  res: NextApiResponse<
    { ok: true; businesses: Business[] } | { error: string }
  >,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const dbName =
      process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "bwes-cluster";
    const db = client.db(dbName);

    const businesses = await db
      .collection("businesses")
      .find({})
      .sort({ createdAt: -1 })
      .project({
        businessName: 1,
        email: 1,
        address: 1,
        approved: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .toArray();

    const formattedBusinesses: Business[] = businesses.map((business: any) => ({
      _id: business._id.toString(),
      businessName: business.businessName || "",
      email: business.email || "",
      address: business.address || "",
      approved: !!business.approved,
      status: business.status || (business.approved ? "active" : "pending"),
      createdAt: business.createdAt
        ? new Date(business.createdAt).toISOString()
        : null,
      updatedAt: business.updatedAt
        ? new Date(business.updatedAt).toISOString()
        : null,
    }));

    return res.status(200).json({
      ok: true,
      businesses: formattedBusinesses,
    });
  } catch (error) {
    console.error("[/api/admin/dashboard] Error fetching businesses:", error);
    return res.status(500).json({ error: "Error fetching businesses" });
  }
}
