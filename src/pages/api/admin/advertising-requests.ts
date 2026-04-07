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

type ReviewStatus = "pending" | "approved" | "rejected" | "spam" | "deleted";

type AdvertisingRequestRow = {
  _id: string;
  status: string;
  reviewStatus: ReviewStatus;
  adminNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  deletedAt: string | null;
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
  trustSignals: {
    ip: string | null;
    userAgent: string | null;
    duplicateEmailCount: number;
    duplicateIpCount: number;
    flags: string[];
  };
};

function normalizeReviewStatus(input: unknown): ReviewStatus {
  const v = String(input || "")
    .trim()
    .toLowerCase();
  if (["approved", "rejected", "spam", "deleted"].includes(v)) {
    return v as ReviewStatus;
  }
  return "pending";
}

function isLikelyTestEmail(email: string) {
  const lower = String(email || "").toLowerCase();
  return (
    lower.endsWith("@bwe.local") ||
    lower.includes("+test") ||
    lower.includes("test@")
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | { ok: true; requests: AdvertisingRequestRow[] }
    | { ok: true; updated: true; id: string; reviewStatus: ReviewStatus }
    | { ok: true; deleted: true; id: string }
    | { ok: false; error: string }
  >,
) {
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
      8,
    );
    if (limitHit.blocked) {
      res.setHeader("Retry-After", String(limitHit.retryAfterSeconds));
      return res.status(429).json({ ok: false, error: "Too many requests" });
    }

    const collection = db.collection("advertising_requests");

    if (req.method === "PATCH") {
      const id = String(req.body?.id || "").trim();
      const reviewStatus = normalizeReviewStatus(req.body?.reviewStatus);
      const adminNote =
        typeof req.body?.adminNote === "string"
          ? req.body.adminNote.trim().slice(0, 1200)
          : "";

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ ok: false, error: "Invalid id" });
      }

      const actor = admin.email || admin.userId || "admin";
      const now = new Date();

      const result = await collection.updateOne({ _id: new ObjectId(id) }, {
        $set: {
          status:
            reviewStatus === "approved"
              ? "approved"
              : reviewStatus === "pending"
                ? "pending_review"
                : reviewStatus,
          reviewStatus,
          adminNote: adminNote || null,
          reviewedAt: now,
          reviewedBy: actor,
          updatedAt: now,
          ...(reviewStatus === "deleted"
            ? { deletedAt: now, isDeleted: true }
            : {}),
        },
        $push: {
          moderationLog: {
            at: now,
            by: actor,
            reviewStatus,
            adminNote: adminNote || null,
          },
        },
      } as any);

      if (!result.matchedCount) {
        return res.status(404).json({ ok: false, error: "Request not found" });
      }

      return res
        .status(200)
        .json({ ok: true, updated: true, id, reviewStatus });
    }

    if (req.method === "DELETE") {
      const id = String(req.query.id || req.body?.id || "").trim();
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ ok: false, error: "Invalid id" });
      }

      const actor = admin.email || admin.userId || "admin";
      const now = new Date();
      const result = await collection.updateOne({ _id: new ObjectId(id) }, {
        $set: {
          isDeleted: true,
          deletedAt: now,
          reviewStatus: "deleted",
          status: "deleted",
          reviewedAt: now,
          reviewedBy: actor,
          updatedAt: now,
        },
        $push: {
          moderationLog: {
            at: now,
            by: actor,
            reviewStatus: "deleted",
            adminNote: "Deleted by admin",
          },
        },
      } as any);

      if (!result.matchedCount) {
        return res.status(404).json({ ok: false, error: "Request not found" });
      }

      return res.status(200).json({ ok: true, deleted: true, id });
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const limitRaw = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(500, Math.floor(limitRaw)))
      : 200;

    const requests = await collection
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

    const emailCountsAgg = await collection
      .aggregate([
        { $match: { email: { $type: "string", $ne: "" } } },
        { $group: { _id: { $toLower: "$email" }, count: { $sum: 1 } } },
      ])
      .toArray();
    const ipCountsAgg = await collection
      .aggregate([
        {
          $project: {
            ip: {
              $ifNull: ["$ip", { $ifNull: ["$requestIp", "$submitterIp"] }],
            },
          },
        },
        { $match: { ip: { $type: "string", $ne: "" } } },
        { $group: { _id: "$ip", count: { $sum: 1 } } },
      ])
      .toArray();

    const emailCounts = new Map<string, number>();
    for (const row of emailCountsAgg as any[]) {
      emailCounts.set(String(row._id || ""), Number(row.count || 0));
    }

    const ipCounts = new Map<string, number>();
    for (const row of ipCountsAgg as any[]) {
      ipCounts.set(String(row._id || ""), Number(row.count || 0));
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

      const email = String(r.email || "")
        .trim()
        .toLowerCase();
      const ipAddr =
        String(r.ip || r.requestIp || r.submitterIp || "").trim() || null;
      const ua =
        String(r.userAgent || r.submitterUserAgent || "").trim() || null;
      const duplicateEmailCount = email
        ? Number(emailCounts.get(email) || 0)
        : 0;
      const duplicateIpCount = ipAddr ? Number(ipCounts.get(ipAddr) || 0) : 0;

      const flags: string[] = [];
      if (isLikelyTestEmail(email)) flags.push("test_email_marker");
      if (duplicateEmailCount >= 3) flags.push("duplicate_email");
      if (duplicateIpCount >= 3) flags.push("duplicate_ip");
      if (!r.details || String(r.details).trim().length < 20)
        flags.push("low_detail_submission");

      return {
        _id: key,
        status: r.status || "pending_review",
        reviewStatus: normalizeReviewStatus(
          r.reviewStatus || r.status || "pending",
        ),
        adminNote: typeof r.adminNote === "string" ? r.adminNote : null,
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : null,
        reviewedBy: r.reviewedBy || null,
        deletedAt: r.deletedAt ? new Date(r.deletedAt).toISOString() : null,
        paymentStatus: depositPaid ? "paid" : r.paymentStatus || "unpaid",
        depositPaid,
        name: r.name || "",
        business: r.business || "",
        email,
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
        trustSignals: {
          ip: ipAddr,
          userAgent: ua,
          duplicateEmailCount,
          duplicateIpCount,
          flags,
        },
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
