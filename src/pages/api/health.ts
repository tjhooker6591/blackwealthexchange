// src/pages/api/health.ts
//
// Phase 7 -- Scale / Observability. Minimal public health check (no auth
// required) for external monitors and the mobile app's connectivity
// check. Reports only what it directly verifies: a real MongoDB ping.
// No uptime percentage or SLA claim is made -- BWE doesn't have a real
// uptime-measurement system, so none is reported.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const startedAt = Date.now();

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    await db.command({ ping: 1 });

    return res.status(200).json({
      ok: true,
      service: "bwe-api",
      database: "ok",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[api/health] database ping failed:", error);
    return res.status(503).json({
      ok: false,
      service: "bwe-api",
      database: "unreachable",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    });
  }
}
