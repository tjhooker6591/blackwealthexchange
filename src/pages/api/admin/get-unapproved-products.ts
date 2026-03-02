// src/pages/api/admin/get-pending-products.ts
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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const unapprovedProducts = await db
      .collection("products")
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .project({
        name: 1,
        price: 1,
        imageUrl: 1,
        category: 1,
        sellerId: 1,
        status: 1,
        createdAt: 1,
      })
      .toArray();

    return res.status(200).json({
      ok: true,
      products: unapprovedProducts.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name || "",
        price: p.price ?? null,
        imageUrl: p.imageUrl || "",
        category: p.category || "",
        sellerId: p.sellerId || "",
        status: p.status || "pending",
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("[/api/admin/get-pending-products] Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch unapproved products" });
  }
}
