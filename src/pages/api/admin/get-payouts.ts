// src/pages/api/admin/get-payouts.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { ObjectId } from "mongodb";

function parseIntSafe(v: unknown, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function maybeObjectId(v: unknown): ObjectId | null {
  if (!v) return null;
  if (v instanceof ObjectId) return v;

  if (typeof v === "string" && ObjectId.isValid(v)) {
    try {
      return new ObjectId(v);
    } catch {
      return null;
    }
  }

  // Handles cases like { $oid: "..." }
  if (typeof v === "object" && v !== null) {
    const candidate =
      (v as any).$oid ||
      (v as any).oid ||
      (typeof (v as any).toHexString === "function"
        ? (v as any).toHexString()
        : null);

    if (typeof candidate === "string" && ObjectId.isValid(candidate)) {
      try {
        return new ObjectId(candidate);
      } catch {
        return null;
      }
    }
  }

  return null;
}

function toDateIso(v: unknown): string | null {
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
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const {
      status, // optional: pending | approved | paid | completed etc (depends on your schema)
      q, // optional search (email / affiliateId / payout id)
      page = "1",
      limit = "25",
    } = req.query as Record<string, string>;

    const pageNum = parseIntSafe(page, 1);
    const limitNum = Math.min(parseIntSafe(limit, 25), 200);
    const skip = (pageNum - 1) * limitNum;

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      db,
      `admin:get-payouts:ip:${ip}`,
      60,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ message: "Too many requests" });
    }

    const payoutsCol = db.collection("affiliatePayouts");
    const affiliatesCol = db.collection("affiliates");

    // ---- Build payout filter ----
    const filter: any = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (q && q.trim()) {
      const query = q.trim();
      const qOr: any[] = [
        { email: { $regex: query, $options: "i" } }, // if payout has email
        { affiliateEmail: { $regex: query, $options: "i" } }, // if schema evolved
        { affiliateCode: { $regex: query, $options: "i" } },
      ];

      // Search by payout _id if user pasted a Mongo ObjectId
      if (ObjectId.isValid(query)) {
        qOr.push({ _id: new ObjectId(query) });
        qOr.push({ affiliateId: new ObjectId(query) });
      }

      // Also search affiliateId string-form
      qOr.push({ affiliateId: query });

      filter.$or = qOr;
    }

    const total = await payoutsCol.countDocuments(filter);

    const payouts = await payoutsCol
      .find(filter)
      .sort({ requestedAt: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // ---- Batch fetch affiliates (avoid N+1 queries) ----
    const affiliateObjectIds: ObjectId[] = [];
    const affiliateIdStrings = new Set<string>();

    for (const payout of payouts) {
      const rawAffiliateId = (payout as any)?.affiliateId;

      const oid = maybeObjectId(rawAffiliateId);
      if (oid) affiliateObjectIds.push(oid);

      const rawStr = s(
        typeof rawAffiliateId === "string"
          ? rawAffiliateId
          : rawAffiliateId instanceof ObjectId
            ? rawAffiliateId.toHexString()
            : null,
      );
      if (rawStr) affiliateIdStrings.add(rawStr);
    }

    const affiliateQueryOr: any[] = [];
    if (affiliateObjectIds.length) {
      affiliateQueryOr.push({ _id: { $in: affiliateObjectIds } });
    }
    // In case affiliates._id is stored as string in some environments
    if (affiliateIdStrings.size) {
      affiliateQueryOr.push({ _id: { $in: Array.from(affiliateIdStrings) } });
    }

    const affiliateDocs =
      affiliateQueryOr.length > 0
        ? await affiliatesCol
            .find(
              { $or: affiliateQueryOr },
              { projection: { name: 1, email: 1, _id: 1 } },
            )
            .toArray()
        : [];

    const affiliateMap = new Map<string, any>();
    for (const a of affiliateDocs) {
      affiliateMap.set(String(a._id), a);
    }

    // ---- Enrich payouts ----
    const enrichedPayouts = payouts.map((payout: any) => {
      const rawAffiliateId = payout?.affiliateId;
      const affiliateKey =
        rawAffiliateId instanceof ObjectId
          ? rawAffiliateId.toHexString()
          : s(rawAffiliateId) ||
            (maybeObjectId(rawAffiliateId)?.toHexString() ?? null);

      const affiliate = affiliateKey ? affiliateMap.get(affiliateKey) : null;

      return {
        ...payout,

        // normalized convenience fields for UI
        payoutId: String(payout._id),
        affiliateId:
          rawAffiliateId instanceof ObjectId
            ? rawAffiliateId.toHexString()
            : s(rawAffiliateId),

        affiliateName: affiliate?.name || "Unknown",
        affiliateEmail: affiliate?.email || "N/A",

        requestedAtIso: toDateIso(payout?.requestedAt),
        processedAtIso: toDateIso(payout?.processedAt),
        createdAtIso: toDateIso(payout?.createdAt),
        updatedAtIso: toDateIso(payout?.updatedAt),
      };
    });

    return res.status(200).json({
      ok: true,
      page: pageNum,
      limit: limitNum,
      total,
      payouts: enrichedPayouts,
      summary: {
        pending: enrichedPayouts.filter((p: any) => p.status === "pending")
          .length,
        approved: enrichedPayouts.filter((p: any) => p.status === "approved")
          .length,
        paid: enrichedPayouts.filter((p: any) => p.status === "paid").length,
        rejected: enrichedPayouts.filter((p: any) => p.status === "rejected")
          .length,
      },
    });
  } catch (err) {
    console.error("[/api/admin/get-payouts] error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
