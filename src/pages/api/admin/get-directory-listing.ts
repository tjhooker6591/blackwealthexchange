// src/pages/api/admin/get-directory-listing.ts
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
  roles?: string[]; // optional
};

function isAdmin(decoded: Decoded) {
  if (decoded?.isAdmin) return true;
  if (decoded?.accountType === "admin") return true;
  if (decoded?.role === "admin") return true;
  if (Array.isArray(decoded?.roles) && decoded.roles.includes("admin"))
    return true;

  // Optional allowlist (recommended)
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && decoded?.email) {
    return allow.includes(decoded.email.toLowerCase());
  }

  return false;
}

function parseIntSafe(v: any, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ---- Admin auth (matches your cookie/JWT approach) ----
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  let decoded: Decoded;
  try {
    const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!SECRET) throw new Error("JWT_SECRET missing");
    decoded = jwt.verify(token, SECRET) as any;
  } catch (_e) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (process.env.NODE_ENV === "production" && !isAdmin(decoded)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ---- Query params ----
  const {
    status,
    tier,
    q,
    page = "1",
    limit = "25",
    source = "auto", // "directory" | "payments" | "auto"
  } = req.query as Record<string, string>;

  const pageNum = parseIntSafe(page, 1);
  const limitNum = Math.min(parseIntSafe(limit, 25), 200);
  const skip = (pageNum - 1) * limitNum;

  const client = await clientPromise;
  const db = client.db("bwes-cluster");

  // Preferred collection for directory listings (webhook should write here)
  const directoryCol = db.collection("directory_listings");

  // Build base filter
  const filter: any = {};
  if (status) filter.status = status; // e.g. "active" | "pending_approval" | "expired"
  if (tier) filter.tier = tier; // e.g. "standard" | "featured"
  if (q) {
    // flexible search: businessId, email, stripeSessionId
    filter.$or = [
      { businessId: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { stripeSessionId: { $regex: q, $options: "i" } },
      { userId: { $regex: q, $options: "i" } },
    ];
  }

  // 1) Try directory_listings first (best source)
  const useDirectory = source === "directory" || source === "auto";

  if (useDirectory) {
    const total = await directoryCol.countDocuments(filter);
    const listings = await directoryCol
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // If we have results OR user explicitly requested directory, return now
    if (source === "directory" || total > 0) {
      return res.status(200).json({
        ok: true,
        source: "directory_listings",
        page: pageNum,
        limit: limitNum,
        total,
        listings,
      });
    }
  }

  // 2) Fallback: derive from payments (works if webhook upserts payments)
  // This ensures you can still *see* paid directory purchases in Admin
  const paymentsCol = db.collection("payments");

  const paymentsFilter: any = {
    status: "paid",
    "metadata.type": "ad",
    "metadata.itemId": { $in: ["directory-standard", "directory-featured"] },
  };

  if (q) {
    paymentsFilter.$or = [
      { stripeSessionId: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { "metadata.businessId": { $regex: q, $options: "i" } },
      { "metadata.userId": { $regex: q, $options: "i" } },
    ];
  }

  const total = await paymentsCol.countDocuments(paymentsFilter);

  const payments = await paymentsCol
    .find(paymentsFilter)
    .sort({ paidAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .toArray();

  const derived = payments.map((p: any) => {
    const itemId = p?.metadata?.itemId;
    const tier = itemId === "directory-featured" ? "featured" : "standard";
    return {
      stripeSessionId: p.stripeSessionId,
      paymentIntentId: p.paymentIntentId || null,
      status: "paid_unlinked", // tells Admin "paid happened; needs linking/activation"
      tier,
      email: p.email || null,
      userId: p?.metadata?.userId || p.userId || null,
      businessId: p?.metadata?.businessId || null,
      durationDays: p?.metadata?.durationDays || null,
      paidAt: p.paidAt || null,
      createdAt: p.createdAt || null,
      needsAttention: !p?.metadata?.businessId,
      _rawPayment: process.env.NODE_ENV === "production" ? undefined : p,
    };
  });

  return res.status(200).json({
    ok: true,
    source: "payments_fallback",
    page: pageNum,
    limit: limitNum,
    total,
    listings: derived,
  });
}
