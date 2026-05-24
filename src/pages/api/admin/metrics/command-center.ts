import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { buildLiveAdminMetrics } from "@/lib/adminSnapshot";

function trendDirection(a: number, b: number) {
  if (b > a) return "up";
  if (b < a) return "down";
  return "stable";
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

  return res.status(200).json({
    ok: true,
    source,
    companyHealth: {
      totalUsers: { value: 0, sourceStatus: "needs_mapping" },
      pendingAdminApprovals: m.trustSafety?.pendingBusinessApprovals || {
        value: 0,
        sourceStatus: "needs_mapping",
      },
      activeSponsors: { value: 0, sourceStatus: "needs_mapping" },
      criticalIssues: {
        value: m.support?.escalated?.value || 0,
        sourceStatus: "live",
      },
    },
    revenueHealth: m.revenue,
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
