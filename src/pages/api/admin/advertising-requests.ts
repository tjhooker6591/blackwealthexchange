import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

type AdvertisingRequestRow = {
  _id: string;
  status: string;
  paymentStatus: string;
  depositPaid: boolean;
  name: string;
  business: string;
  email: string;
  selectedOptions: string[];
  budget: string | null;
  timeline: string | null;
  details: string;
  createdAt: string | null;
  updatedAt: string | null;
  paidAt: string | null;
  linkedPaymentSessionId: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | { ok: true; requests: AdvertisingRequestRow[] }
    | { ok: false; error: string }
  >,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);
    const ip = getClientIp(req);
    const limitHit = await hitApiRateLimit(
      db,
      `admin:advertising-requests:ip:${ip}`,
      60,
      5,
    );
    if (limitHit.blocked) {
      res.setHeader("Retry-After", String(limitHit.retryAfterSeconds));
      return res.status(429).json({ ok: false, error: "Too many requests" });
    }

    const limitRaw = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.floor(limitRaw)))
      : 200;

    const requests = await db
      .collection("advertising_requests")
      .find({ requestType: { $in: ["custom_ad", "standard_ad"] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const requestIds = requests.map((r: any) => String(r._id));
    const paidPurchases = requestIds.length
      ? await db
          .collection("ad_purchases")
          .find({
            campaignId: { $in: requestIds },
            status: "paid",
          })
          .project({
            campaignId: 1,
            paidAt: 1,
            stripeSessionId: 1,
            amountCents: 1,
          })
          .toArray()
      : [];

    const paidMap = new Map<string, any>();
    for (const p of paidPurchases) {
      const key = String((p as any).campaignId || "");
      if (!key) continue;
      if (!paidMap.has(key)) paidMap.set(key, p);
    }

    const rows: AdvertisingRequestRow[] = requests.map((r: any) => {
      const key = String(r._id);
      const paid = paidMap.get(key);
      const depositPaid = Boolean(r.depositPaid) || Boolean(paid);

      return {
        _id: key,
        status: r.status || "pending_review",
        paymentStatus: depositPaid ? "paid" : r.paymentStatus || "unpaid",
        depositPaid,
        name: r.name || "",
        business: r.business || "",
        email: r.email || "",
        selectedOptions: Array.isArray(r.selectedOptions)
          ? r.selectedOptions
          : [],
        budget: r.budget || null,
        timeline: r.timeline || null,
        details: r.details || "",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
        paidAt: paid?.paidAt ? new Date(paid.paidAt).toISOString() : null,
        linkedPaymentSessionId: paid?.stripeSessionId || null,
      };
    });

    return res.status(200).json({ ok: true, requests: rows });
  } catch (error) {
    console.error("[/api/admin/advertising-requests] error", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to fetch advertising requests" });
  }
}
