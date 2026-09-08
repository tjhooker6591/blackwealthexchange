import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

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
  const logs = await db
    .collection("system_health_logs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray()
    .catch(() => []);
  const failingRoutes = [
    ...new Set(
      logs
        .filter((x: any) => x.status === "fail" || x.httpStatus >= 500)
        .map((x: any) => x.route)
        .filter(Boolean),
    ),
  ];
  const failures = logs.filter(
    (x: any) => x.status === "fail" || x.httpStatus >= 500,
  );

  // Phase 7 -- Scale/Observability: additive fields only (existing
  // consumers -- src/lib/adminSnapshot.ts, src/pages/api/support/status.ts
  // -- keep reading errorCount/failingRoutes/lastFailureTime/
  // uptimeIndicator unchanged).
  const byComponent = new Map<string, { ok: number; fail: number }>();
  for (const log of logs as any[]) {
    const key = String(log.component || log.service || "unknown");
    const entry = byComponent.get(key) || { ok: 0, fail: 0 };
    if (log.status === "fail" || (log.httpStatus || 0) >= 500) entry.fail += 1;
    else entry.ok += 1;
    byComponent.set(key, entry);
  }

  return res.status(200).json({
    ok: true,
    errorCount: failures.length,
    failingRoutes,
    lastFailureTime: failures[0]?.createdAt || null,
    uptimeIndicator: failures.length === 0 ? "healthy" : "degraded",
    totalEventsObserved: logs.length,
    componentBreakdown: Array.from(byComponent.entries()).map(
      ([component, counts]) => ({ component, ...counts }),
    ),
    recentEvents: logs.slice(0, 50).map((log: any) => ({
      component: log.component || log.service || "unknown",
      route: log.route || null,
      status: log.status || (log.httpStatus >= 500 ? "fail" : "ok"),
      httpStatus: log.httpStatus ?? null,
      message: log.message || null,
      durationMs: log.durationMs ?? null,
      createdAt: log.createdAt || null,
    })),
  });
}
