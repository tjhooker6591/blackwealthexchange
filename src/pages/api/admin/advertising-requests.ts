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
  option: string | null;
  durationDays: number | null;
  placement: string | null;
  scheduleWeeks: string[];
  scheduleQueueStatus: string | null;
  scheduleRolledOver: boolean;
  campaignLifecycle:
    | "pending"
    | "queued"
    | "scheduled"
    | "active"
    | "completed";
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

    const scheduleRows = requestIds.length
      ? await db
          .collection("featured_sponsor_schedule")
          .find({ campaignId: { $in: requestIds } })
          .project({ campaignId: 1, weekStart: 1, weekEnd: 1, queueStatus: 1 })
          .sort({ weekStart: 1 })
          .toArray()
      : [];

    const scheduleMap = new Map<string, any[]>();
    for (const s of scheduleRows) {
      const key = String((s as any).campaignId || "");
      if (!key) continue;
      const arr = scheduleMap.get(key) || [];
      arr.push(s);
      scheduleMap.set(key, arr);
    }

    const now = new Date();

    const rows: AdvertisingRequestRow[] = requests.map((r: any) => {
      const key = String(r._id);
      const paid = paidMap.get(key);
      const schedule = scheduleMap.get(key) || [];
      const depositPaid = Boolean(r.depositPaid) || Boolean(paid);

      const scheduleStarts = schedule
        .map((x: any) =>
          x?.weekStart
            ? new Date(x.weekStart).toISOString().slice(0, 10)
            : null,
        )
        .filter(Boolean) as string[];

      const inActiveWindow = schedule.some((x: any) => {
        const ws = x?.weekStart ? new Date(x.weekStart) : null;
        const we = x?.weekEnd ? new Date(x.weekEnd) : null;
        return ws && we && ws <= now && now <= we;
      });

      const hasFuture = schedule.some((x: any) => {
        const ws = x?.weekStart ? new Date(x.weekStart) : null;
        return ws && ws > now;
      });

      const hasAnySchedule = scheduleStarts.length > 0;

      const campaignLifecycle: AdvertisingRequestRow["campaignLifecycle"] =
        !depositPaid
          ? "pending"
          : inActiveWindow
            ? "active"
            : hasFuture
              ? "queued"
              : hasAnySchedule
                ? "completed"
                : "scheduled";

      return {
        _id: key,
        status: r.status || "pending_review",
        paymentStatus: depositPaid ? "paid" : r.paymentStatus || "unpaid",
        depositPaid,
        name: r.name || "",
        business: r.business || "",
        email: r.email || "",
        option: typeof r.option === "string" ? r.option : null,
        durationDays:
          Number.isFinite(Number(r.durationDays)) && Number(r.durationDays) > 0
            ? Number(r.durationDays)
            : null,
        placement: typeof r.placement === "string" ? r.placement : null,
        scheduleWeeks: scheduleStarts,
        scheduleQueueStatus:
          schedule.length && typeof schedule[0]?.queueStatus === "string"
            ? schedule[0].queueStatus
            : null,
        scheduleRolledOver: schedule.some(
          (x: any) => x?.queueStatus === "rolled_over",
        ),
        campaignLifecycle,
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
