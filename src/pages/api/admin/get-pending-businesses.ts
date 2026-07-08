// src/pages/api/admin/get-pending-businesses.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { getCanonicalBusinessName } from "@/lib/businessSubmission";
import {
  deriveAdminBusinessStatus,
  getAdminBusinessBucketFilter,
  getAdminBusinessCounts,
} from "@/lib/adminBusinessStatus";

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

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

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
    const db = client.db(getMongoDbName());
    const businessesCol = db.collection("businesses");

    const filter: any =
      status === "all"
        ? {}
        : status === "pending" || status === "approved" || status === "rejected"
          ? getAdminBusinessBucketFilter(status)
          : { status };

    // ---- Search (business name/email/category/owner/etc.) ----
    if (q && q.trim()) {
      const query = q.trim();

      const searchOr: any[] = [
        { business_name: { $regex: query, $options: "i" } },
        { businessName: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { companyName: { $regex: query, $options: "i" } },
        { legalName: { $regex: query, $options: "i" } },
        { dba: { $regex: query, $options: "i" } },
        { title: { $regex: query, $options: "i" } },
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
      const businessName = getCanonicalBusinessName(b) || "Unnamed Business";

      const derivedStatus = deriveAdminBusinessStatus(b);

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
    const {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: totalBusinesses,
    } = await getAdminBusinessCounts(db);

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
