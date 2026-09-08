// src/pages/admin/observability.tsx
//
// Phase 7 -- Scale / Observability dashboard. Reads the existing
// /api/admin/metrics/system-health.ts endpoint (extended, not replaced --
// see that file) which itself reads the `system_health_logs` collection.
// Every number here is a real logged event; there is no fabricated
// uptime/SLA figure.

import type { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type RecentEvent = {
  component: string;
  route: string | null;
  status: string;
  httpStatus: number | null;
  message: string | null;
  durationMs: number | null;
  createdAt: string | null;
};

type SystemHealth = {
  errorCount: number;
  failingRoutes: string[];
  lastFailureTime: string | null;
  uptimeIndicator: "healthy" | "degraded";
  totalEventsObserved: number;
  componentBreakdown: { component: string; ok: number; fail: number }[];
  recentEvents: RecentEvent[];
};

export default function AdminObservabilityPage() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/metrics/system-health", {
          credentials: "include",
        });
        if (!res.ok) {
          setError(`Failed to load (status ${res.status})`);
          return;
        }
        setData(await res.json());
      } catch {
        setError("Failed to load observability data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Link
          href="/admin/dashboard"
          className="text-sm text-white/60 hover:text-white/90"
        >
          ← Admin Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Scale &amp; Observability
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Real logged events from system_health_logs -- checkout/payment
          failures, auth failures, and background job runs. No estimated or
          fabricated uptime figures.
        </p>

        {loading ? (
          <div className="mt-8 text-white/60">Loading…</div>
        ) : error ? (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        ) : data ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div
                  className={`text-2xl font-extrabold ${
                    data.uptimeIndicator === "healthy"
                      ? "text-emerald-300"
                      : "text-amber-300"
                  }`}
                >
                  {data.uptimeIndicator === "healthy" ? "Healthy" : "Degraded"}
                </div>
                <div className="mt-1 text-xs text-white/55">
                  Based on the last {data.totalEventsObserved} logged events
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-2xl font-extrabold text-white">
                  {data.errorCount}
                </div>
                <div className="mt-1 text-xs text-white/55">
                  Failures observed
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-2xl font-extrabold text-white">
                  {data.failingRoutes.length}
                </div>
                <div className="mt-1 text-xs text-white/55">
                  Routes with a failure
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-2xl font-extrabold text-white">
                  {data.lastFailureTime
                    ? new Date(data.lastFailureTime).toLocaleString()
                    : "—"}
                </div>
                <div className="mt-1 text-xs text-white/55">Last failure</div>
              </div>
            </div>

            <section className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-white/50">
                By component
              </h2>
              {data.componentBreakdown.length === 0 ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                  No events logged yet.
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {data.componentBreakdown.map((row) => (
                    <div
                      key={row.component}
                      className="rounded-xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="text-sm font-semibold text-white/90">
                        {row.component}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        {row.ok} ok · {row.fail} fail
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-white/50">
                Recent events
              </h2>
              {data.recentEvents.length === 0 ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                  Nothing logged yet.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.recentEvents.map((event, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-3 text-sm ${
                        event.status === "fail"
                          ? "border-red-500/20 bg-red-500/5"
                          : "border-white/10 bg-black/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white/90">
                          {event.component}
                          {event.route ? ` · ${event.route}` : ""}
                        </span>
                        <span className="text-xs text-white/45">
                          {event.createdAt
                            ? new Date(event.createdAt).toLocaleString()
                            : ""}
                        </span>
                      </div>
                      {event.message ? (
                        <div className="mt-1 text-xs text-white/60">
                          {event.message}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/observability",
);
