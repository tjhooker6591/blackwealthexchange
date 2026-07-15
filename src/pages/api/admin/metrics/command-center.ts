import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { buildLiveAdminMetrics } from "@/lib/adminSnapshot";
import { getAdminBusinessCounts } from "@/lib/adminBusinessStatus";
import { getAdminFinanceSummary } from "@/lib/adminFinanceSummary";
import { getPendingFoundingClaimVerifications } from "@/lib/founding-membership";
import {
  getDirectoryListingStateFromListing,
  getDirectoryListingStateFromPayment,
  isDirectoryItemId,
} from "@/lib/adminDirectoryStatus";

const DIRECTORY_ITEM_IDS = [
  "directory-standard",
  "directory-featured",
] as const;

function trendDirection(a: number, b: number) {
  if (b > a) return "up";
  if (b < a) return "down";
  return "stable";
}

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function pickDirectoryItemId(doc: any): string | null {
  return (
    s(doc?.itemId) ||
    s(doc?.metadata?.itemId) ||
    s(doc?.option) ||
    s(doc?.metadata?.option) ||
    null
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }
  const db = (await clientPromise).db(getMongoDbName());
  const now = new Date();
  const businessCountsPromise = getAdminBusinessCounts(db);
  const financeSummaryPromise = getAdminFinanceSummary(db);

  const [
    businessCounts,
    financeSummary,
    totalUsers,
    pendingOrganizations,
    pendingJobs,
    pendingProducts,
    pendingPayouts,
    directoryListingDocs,
    directoryPaymentRows,
    pendingClaimVerifications,
  ] = await Promise.all([
    businessCountsPromise,
    financeSummaryPromise,
    db.collection("users").countDocuments({}),
    db.collection("organizations").countDocuments({ status: "pending" }),
    db.collection("jobs").countDocuments({ status: "pending" }),
    db.collection("products").countDocuments({ status: "pending" }),
    db.collection("affiliatePayouts").countDocuments({ status: "pending" }),
    db.collection("directory_listings").find({}).toArray(),
    db
      .collection("payments")
      .find({
        $and: [
          {
            $or: [
              { type: "ad" },
              { type: "advertising" },
              { "metadata.type": "ad" },
              { "metadata.type": "advertising" },
            ],
          },
          {
            $or: [
              { itemId: { $in: [...DIRECTORY_ITEM_IDS] } },
              { "metadata.itemId": { $in: [...DIRECTORY_ITEM_IDS] } },
              { option: { $in: [...DIRECTORY_ITEM_IDS] } },
              { "metadata.option": { $in: [...DIRECTORY_ITEM_IDS] } },
            ],
          },
        ],
      })
      .project({
        stripeSessionId: 1,
        businessId: 1,
        status: 1,
        paymentStatus: 1,
        metadata: 1,
        itemId: 1,
        option: 1,
      })
      .toArray(),
    getPendingFoundingClaimVerifications(db),
  ]);

  const normalizedDirectoryStates = Array.isArray(directoryListingDocs)
    ? directoryListingDocs.map((doc: any) => ({
        stripeSessionId: s(doc?.stripeSessionId) || s(doc?.lastStripeSessionId),
        state: getDirectoryListingStateFromListing(doc, now),
      }))
    : [];

  const linkedDirectorySessionIds = new Set(
    normalizedDirectoryStates
      .map((doc) => doc.stripeSessionId)
      .filter((value): value is string => Boolean(value)),
  );

  const fallbackDirectoryStates = directoryPaymentRows
    .map((doc: any) => {
      const itemId = pickDirectoryItemId(doc);
      if (!isDirectoryItemId(itemId)) return null;

      const stripeSessionId = s(doc?.stripeSessionId);
      const linked = stripeSessionId
        ? linkedDirectorySessionIds.has(stripeSessionId)
        : false;

      if (linked) return null;

      return getDirectoryListingStateFromPayment(doc, linked);
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  const pendingDirectoryListings = [
    ...normalizedDirectoryStates.map((doc) => doc.state),
    ...fallbackDirectoryStates,
  ].filter((state) => state === "pending_approval").length;

  const pendingClaimVerificationCount = Array.isArray(pendingClaimVerifications)
    ? pendingClaimVerifications.length
    : 0;

  const pendingAdminApprovalsTotal =
    Number(businessCounts.pending || 0) +
    Number(pendingOrganizations || 0) +
    Number(pendingJobs || 0) +
    Number(pendingProducts || 0) +
    Number(pendingDirectoryListings || 0) +
    Number(pendingPayouts || 0) +
    pendingClaimVerificationCount;

  const latest = await db
    .collection("admin_metrics_snapshots")
    .find({})
    .sort({ snapshotDate: -1, createdAt: -1 })
    .limit(1)
    .toArray()
    .catch(() => []);
  let source: "snapshot" | "live" = "snapshot";
  let m: any;
  if (latest.length) {
    m = { ...latest[0], now: new Date() };
  } else {
    source = "live";
    m = await buildLiveAdminMetrics(db);
  }

  const snaps = await db
    .collection("admin_metrics_snapshots")
    .find({})
    .sort({ snapshotDate: -1 })
    .limit(30)
    .toArray()
    .catch(() => []);
  const pick = (k: string) =>
    snaps
      .map((s: any) =>
        Number(
          s?.[k]?.revenueThisMonth?.value || s?.[k]?.newTickets?.value || 0,
        ),
      )
      .reverse();
  const rev30 = pick("revenue").slice(-30);
  const sup30 = pick("support").slice(-30);
  const gro30 = pick("growth").slice(-30);

  const trend = (a: number[]) => ({
    trend7d: a.slice(-7),
    trend30d: a.slice(-30),
    direction: trendDirection(a[0] || 0, a[a.length - 1] || 0),
  });

  const revenueHealth = {
    ...(m.revenue || {}),
    revenueThisMonth: {
      value: Number(financeSummary.totalRevenue || 0),
      sourceStatus: "live",
      note: `Centralized admin finance summary (${financeSummary.sourceOfTruth})`,
    },
    revenueToday: m.revenue?.revenueToday || {
      value: 0,
      sourceStatus: "needs_mapping",
      note: "Daily centralized finance rollup not yet mapped",
    },
    grossRevenue: {
      value: Number(financeSummary.grossRevenue || 0),
      sourceStatus: "live",
      note: `Centralized admin finance summary (${financeSummary.sourceOfTruth})`,
    },
    pendingRevenue: {
      value: Number(financeSummary.pendingRevenue || 0),
      sourceStatus: "live",
      note: `Centralized admin finance summary (${financeSummary.sourceOfTruth})`,
    },
    failedOrRefunded: {
      value: Number(financeSummary.failedOrRefunded || 0),
      sourceStatus: "live",
      note: `Centralized admin finance summary (${financeSummary.sourceOfTruth})`,
    },
    sourceOfTruth: {
      value: financeSummary.sourceOfTruth,
      sourceStatus: "live",
    },
  };

  return res.status(200).json({
    ok: true,
    source,
    companyHealth: {
      totalUsers: {
        value: Number(totalUsers || 0),
        sourceStatus: "live",
        note: "Lifetime users from users collection",
      },
      pendingAdminApprovals: {
        value: Number(pendingAdminApprovalsTotal || 0),
        sourceStatus: "live",
        note: "Combined pending approvals across businesses, organizations, jobs, products, directory, payouts, and claim verification",
      },
      activeSponsors: { value: 0, sourceStatus: "needs_mapping" },
      criticalIssues: {
        value: m.support?.escalated?.value || 0,
        sourceStatus: "live",
      },
    },
    revenueHealth,
    supportHealth: m.support,
    growthHealth: m.growth,
    trustSafetyHealth: m.trustSafety,
    systemHealth: m.systemHealth,
    executiveSignals: m.executiveSignals,
    trends: {
      revenue: trend(rev30),
      support: trend(sup30),
      growth: trend(gro30),
    },
    generatedAt: new Date().toISOString(),
  });
}
