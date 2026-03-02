// src/pages/api/admin/get-pending-businesses.ts
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
  if (Array.isArray(decoded?.roles) && decoded.roles.includes("admin")) {
    return true;
  }

  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && decoded?.email) {
    return allow.includes(decoded.email.toLowerCase());
  }

  return false;
}

function parseIntSafe(v: unknown, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function iso(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ---- Admin auth (matches your JWT cookie approach) ----
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  let decoded: Decoded;
  try {
    const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!SECRET) throw new Error("JWT_SECRET missing");
    decoded = jwt.verify(token, SECRET) as Decoded;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Keep dev convenient; enforce in production
  if (process.env.NODE_ENV === "production" && !isAdmin(decoded)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const {
      page = "1",
      limit = "25",
      q,
      status = "pending", // pending | approved | rejected | all
      source = "mixed", // mixed | status | approved
    } = req.query as Record<string, string>;

    const pageNum = parseIntSafe(page, 1);
    const limitNum = Math.min(parseIntSafe(limit, 25), 200);
    const skip = (pageNum - 1) * limitNum;

    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businessesCol = db.collection("businesses");

    const filter: any = {};

    // ---- Status logic (supports old + new schema) ----
    // old schema: approved: false
    // new schema: status: "pending"
    if (status !== "all") {
      if (status === "pending") {
        filter.$and = [
          {
            $or: [
              { approved: false },
              { approved: { $exists: false } }, // older docs may not have approved flag
              { status: "pending" },
              { status: "pending_approval" },
            ],
          },
          {
            $or: [
              { status: { $ne: "approved" } },
              { status: { $exists: false } },
            ],
          },
        ];
      } else if (status === "approved") {
        filter.$or = [{ approved: true }, { status: "approved" }];
      } else if (status === "rejected") {
        filter.status = "rejected";
      } else {
        // fallback custom status (if you pass one)
        filter.status = status;
      }
    }

    // ---- Search (business name/email/category/owner/etc.) ----
    if (q && q.trim()) {
      const query = q.trim();

      const searchOr: any[] = [
        { businessName: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { ownerName: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { businessCategory: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];

      if (ObjectId.isValid(query)) {
        searchOr.push({ _id: new ObjectId(query) });
      }

      if (filter.$and) {
        filter.$and.push({ $or: searchOr });
      } else if (filter.$or) {
        // combine existing OR with search safely
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    // ---- Query ----
    const total = await businessesCol.countDocuments(filter);

    const businesses = await businessesCol
      .find(filter)
      .sort({ createdAt: -1, submittedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // ---- Normalize for UI use ----
    const rows = businesses.map((b: any) => {
      const businessName =
        s(b.businessName) ||
        s(b.name) ||
        s(b.companyName) ||
        "Unnamed Business";

      const derivedStatus =
        s(b.status) ||
        (b.approved === true
          ? "approved"
          : b.approved === false
            ? "pending"
            : "pending");

      return {
        ...b,
        id: String(b._id),
        businessName,
        displayEmail: s(b.email),
        displayPhone: s(b.phone) || s(b.businessPhone),
        displayCategory: s(b.category) || s(b.businessCategory),
        derivedStatus,
        createdAtIso: iso(b.createdAt),
        submittedAtIso: iso(b.submittedAt),
        updatedAtIso: iso(b.updatedAt),
      };
    });

    // Optional extra summaries for dashboard tiles
    const [pendingCount, approvedCount, rejectedCount, totalBusinesses] =
      await Promise.all([
        businessesCol.countDocuments({
          $or: [
            { approved: false },
            { status: "pending" },
            { status: "pending_approval" },
          ],
        }),
        businessesCol.countDocuments({
          $or: [{ approved: true }, { status: "approved" }],
        }),
        businessesCol.countDocuments({ status: "rejected" }),
        businessesCol.countDocuments({}),
      ]);

    return res.status(200).json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      businesses: rows,
      summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalBusinesses,
      },
      filters: {
        status,
        q: q || "",
        source,
      },
    });
  } catch (error) {
    console.error("[/api/admin/get-pending-businesses] error:", error);
    return res.status(500).json({ error: "Error fetching pending businesses" });
  }
}
