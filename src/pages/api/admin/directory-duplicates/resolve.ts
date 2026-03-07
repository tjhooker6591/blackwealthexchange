import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

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
  if (Array.isArray(decoded?.roles) && decoded.roles.includes("admin")) return true;

  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && decoded?.email) {
    return allow.includes(decoded.email.toLowerCase());
  }

  return false;
}

async function requireAdmin(req: NextApiRequest, res: NextApiResponse): Promise<Decoded | null> {
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

function slugify(input: string) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function ensureUniqueApprovedAlias(col: any, desired: string, excludeId: ObjectId) {
  const base = slugify(desired) || `business-${Date.now()}`;
  for (let i = 0; i < 1000; i += 1) {
    const alias = i === 0 ? base : `${base}-${i + 1}`;
    const conflict = await col.findOne({
      _id: { $ne: excludeId },
      status: "approved",
      alias,
    });
    if (!conflict) return alias;
  }
  throw new Error("Unable to generate unique alias");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const businessId = String(body.businessId || "");
  const action = String(body.action || "");
  const preferredAlias = String(body.alias || "");

  if (!ObjectId.isValid(businessId)) {
    return res.status(400).json({ error: "Valid businessId is required" });
  }

  if (!["archive_duplicate", "approve_with_unique_alias"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businesses = db.collection("businesses");
    const _id = new ObjectId(businessId);

    const doc = await businesses.findOne({ _id });
    if (!doc) return res.status(404).json({ error: "Business not found" });

    if (action === "archive_duplicate") {
      const r = await businesses.updateOne(
        { _id },
        {
          $set: {
            status: "archived_duplicate",
            approved: false,
            duplicateResolvedAt: new Date(),
            duplicateResolvedBy: admin.email || admin.userId || "admin",
            updatedAt: new Date(),
          },
        },
      );

      return res.status(200).json({
        ok: true,
        businessId,
        action,
        modified: r.modifiedCount,
      });
    }

    const fallbackName =
      String(doc.business_name || doc.businessName || doc.name || "business").trim() || "business";

    const alias = await ensureUniqueApprovedAlias(
      businesses,
      preferredAlias || String(doc.alias || "") || fallbackName,
      _id,
    );

    const r = await businesses.updateOne(
      { _id },
      {
        $set: {
          alias,
          status: "approved",
          approved: true,
          approvedAt: new Date(),
          approvedBy: admin.email || admin.userId || "admin",
          duplicateResolvedAt: new Date(),
          duplicateResolvedBy: admin.email || admin.userId || "admin",
          updatedAt: new Date(),
        },
        $unset: {
          duplicateOf: "",
        },
      },
    );

    return res.status(200).json({
      ok: true,
      businessId,
      action,
      alias,
      modified: r.modifiedCount,
    });
  } catch (error) {
    console.error("[/api/admin/directory-duplicates/resolve] error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
