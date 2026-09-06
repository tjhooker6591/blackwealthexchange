// src/lib/observability/logHealthEvent.ts
//
// Phase 7 -- Scale / Observability. Writes to the existing
// `system_health_logs` collection -- already read by three dashboards
// (src/pages/api/admin/metrics/system-health.ts,
// src/lib/adminSnapshot.ts, src/pages/api/support/status.ts) but never
// written by anything in the active codebase. Rather than build a second
// observability collection, this closes that loop: real events in, real
// events out. No fabricated uptime/SLA numbers -- every row here is a
// real event from a real request.

import type { Db } from "mongodb";

export type HealthEventStatus = "ok" | "fail";

export type HealthEventInput = {
  component: string;
  service?: string;
  route?: string;
  status: HealthEventStatus;
  httpStatus?: number;
  message?: string;
  durationMs?: number;
  meta?: Record<string, unknown> | null;
};

export async function logHealthEvent(db: Db, input: HealthEventInput) {
  try {
    await db.collection("system_health_logs").insertOne({
      component: input.component,
      service: input.service || input.component,
      route: input.route || null,
      status: input.status,
      httpStatus: input.httpStatus ?? null,
      message: input.message || null,
      durationMs:
        typeof input.durationMs === "number" ? input.durationMs : null,
      meta: input.meta || null,
      createdAt: new Date(),
    });
  } catch (err) {
    // Observability must never break the request it's observing.
    console.error("[logHealthEvent] failed to write system_health_logs:", err);
  }
}

export async function ensureHealthEventIndexes(db: Db) {
  await db
    .collection("system_health_logs")
    .createIndex({ createdAt: -1 })
    .catch(() => null);
  await db
    .collection("system_health_logs")
    .createIndex({ component: 1, createdAt: -1 })
    .catch(() => null);
  await db
    .collection("system_health_logs")
    .createIndex({ status: 1, createdAt: -1 })
    .catch(() => null);
}
