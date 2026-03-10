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

    const [clicks, conversions] = await Promise.all([
      db.collection("affiliateClicks").find({}).sort({ clickedAt: -1 }).limit(100).toArray(),
      db
        .collection("affiliateConversions")
        .find({})
        .sort({ convertedAt: -1 })
        .limit(100)
        .toArray(),
    ]);

    const ids = new Set<string>();
    for (const c of clicks) {
      if (typeof c.affiliateId === "string") ids.add(c.affiliateId);
    }
    for (const c of conversions) {
      if (typeof c.affiliateId === "string") ids.add(c.affiliateId);
    }

    const oidList = Array.from(ids)
      .filter((x) => ObjectId.isValid(x))
      .map((x) => new ObjectId(x));

    const affiliates = oidList.length
      ? await db
          .collection("affiliates")
          .find({ _id: { $in: oidList } })
          .project({ name: 1, email: 1, status: 1, totalEarned: 1, totalPaid: 1 })
          .toArray()
      : [];

    const amap = new Map(affiliates.map((a: any) => [String(a._id), a]));

    return res.status(200).json({
      ok: true,
      clicks: clicks.map((x: any) => {
        const aid = typeof x.affiliateId === "string" ? x.affiliateId : "";
        const a = amap.get(aid);
        return {
          _id: String(x._id),
          affiliateId: aid,
          affiliateName: a?.name || null,
          affiliateEmail: a?.email || null,
          clickedAt: x.clickedAt || null,
        };
      }),
      conversions: conversions.map((x: any) => {
        const aid = typeof x.affiliateId === "string" ? x.affiliateId : "";
        const a = amap.get(aid);
        return {
          _id: String(x._id),
          affiliateId: aid,
          affiliateName: a?.name || null,
          affiliateEmail: a?.email || null,
          amount: Number(x.amount || 0),
          commission: Number(x.commission || 0),
          convertedAt: x.convertedAt || null,
        };
      }),
    });
  } catch (e) {
    console.error("affiliate attribution admin error", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
