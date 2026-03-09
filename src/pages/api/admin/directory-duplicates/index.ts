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

function asId(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (typeof v.$oid === "string") return v.$oid;
    if (typeof v.toString === "function") return v.toString();
  }
  return String(v);
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
    const {
      page = "1",
      limit = "50",
      q = "",
    } = req.query as Record<string, string>;
    const pageNum = parseIntSafe(page, 1);
    const limitNum = Math.min(parseIntSafe(limit, 50), 250);
    const skip = (pageNum - 1) * limitNum;

    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businesses = db.collection("businesses");

    const baseFilter: any = {
      $or: [
        { status: "duplicate_pending_review" },
        { duplicateOf: { $exists: true, $ne: null } },
      ],
    };

    if (q && q.trim()) {
      const query = q.trim();
      baseFilter.$and = [
        {
          $or: [
            { business_name: { $regex: query, $options: "i" } },
            { businessName: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
            { alias: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { duplicateOf: { $regex: query, $options: "i" } },
          ],
        },
      ];
    }

    const total = await businesses.countDocuments(baseFilter);
    const rows = await businesses
      .find(baseFilter)
      .project({
        business_name: 1,
        businessName: 1,
        name: 1,
        alias: 1,
        email: 1,
        state: 1,
        status: 1,
        duplicateOf: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const keeperRefs = Array.from(
      new Set(
        rows
          .map((r: any) => s(r.duplicateOf))
          .filter((x): x is string => Boolean(x)),
      ),
    );

    const keeperDocs =
      keeperRefs.length > 0
        ? await businesses
            .find({
              $or: [
                {
                  _id: {
                    $in: keeperRefs
                      .filter((x) => ObjectId.isValid(x))
                      .map((x) => new ObjectId(x)),
                  },
                },
                { alias: { $in: keeperRefs } },
              ],
            })
            .project({ business_name: 1, businessName: 1, name: 1, alias: 1 })
            .toArray()
        : [];

    const keeperByIdOrAlias = new Map<string, any>();
    for (const k of keeperDocs) {
      const id = asId(k._id);
      const alias = s(k.alias);
      if (id) keeperByIdOrAlias.set(id, k);
      if (alias) keeperByIdOrAlias.set(alias, k);
    }

    const normalized = rows.map((r: any) => {
      const duplicateOf = s(r.duplicateOf);
      const keeper = duplicateOf ? keeperByIdOrAlias.get(duplicateOf) : null;
      return {
        id: asId(r._id),
        businessName:
          s(r.business_name) || s(r.businessName) || s(r.name) || "Unnamed",
        alias: s(r.alias),
        email: s(r.email),
        state: s(r.state),
        status: s(r.status) || "duplicate_pending_review",
        duplicateOf,
        keeper: keeper
          ? {
              id: asId(keeper._id),
              alias: s(keeper.alias),
              businessName:
                s(keeper.business_name) ||
                s(keeper.businessName) ||
                s(keeper.name) ||
                "Unnamed",
            }
          : null,
        createdAtIso: iso(r.createdAt),
        updatedAtIso: iso(r.updatedAt),
      };
    });

    return res.status(200).json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      duplicates: normalized,
      summary: {
        duplicatePendingReview: normalized.filter(
          (x) => x.status === "duplicate_pending_review",
        ).length,
        unresolved: normalized.length,
      },
    });
  } catch (error) {
    console.error("[/api/admin/directory-duplicates] error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
