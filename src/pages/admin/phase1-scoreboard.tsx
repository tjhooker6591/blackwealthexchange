import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type WindowCounts = { today: number; last7d: number; last30d: number };
type MetricRow = { eventType: string; label: string; counts: WindowCounts };
type GroupRow = {
  key: string;
  title: string;
  totals: WindowCounts;
  metrics: MetricRow[];
};

type ConversionRow = {
  today: number | null;
  last7d: number | null;
  last30d: number | null;
};

type ScoreboardResponse = {
  generatedAt: string;
  kpis: Record<string, WindowCounts>;
  conversions: Record<string, ConversionRow>;
  groups: GroupRow[];
};

function n(v: number | undefined) {
  return Number(v || 0).toLocaleString();
}

function pct(v: number | null | undefined) {
  return v == null ? "—" : `${v}%`;
}

const KPI_META: Array<{ key: string; label: string }> = [
  { key: "discoverySearchSubmitted", label: "Search Submitted" },
  { key: "missionStudentActions", label: "Student Actions Started" },
  { key: "musicSubmitted", label: "Music Onboarding Submitted" },
  { key: "advertisingCompleted", label: "Advertising Completed" },
  { key: "sellerSubmitted", label: "Seller Onboarding Submitted" },
  { key: "jobApplicationsSubmitted", label: "Job Applications Submitted" },
  { key: "consultingCompleted", label: "Consulting Completed" },
  {
    key: "marketplacePurchasesCompleted",
    label: "Marketplace Purchases Completed",
  },
];

const CONVERSION_META: Array<{ key: string; label: string }> = [
  {
    key: "searchSubmittedToResultClicked",
    label: "Search Submitted → Result Clicked",
  },
  {
    key: "advertisingOptionToCompleted",
    label: "Advertising Option Selected → Submission Completed",
  },
  {
    key: "sellerStartedToSubmitted",
    label: "Seller Onboarding Started → Submitted",
  },
  {
    key: "checkoutCreatedToPurchaseCompleted",
    label: "Checkout Created → Purchase Completed",
  },
];

export default function Phase1ScoreboardPage() {
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/phase1-scoreboard", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load scoreboard.");
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load scoreboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const lowSignalEvents = useMemo(() => {
    if (!data) return [] as string[];
    return data.groups
      .flatMap((g) => g.metrics)
      .filter((m) => (m.counts.last30d || 0) === 0)
      .map((m) => m.eventType);
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gold">
              Phase 1 Operating Scoreboard
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Flow-event scoreboard for growth, trust, conversion, and revenue
              pathways.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="rounded border border-gold/40 bg-black px-3 py-2 text-sm text-gold hover:bg-zinc-900"
            >
              Refresh
            </button>
            <Link
              href="/admin/dashboard"
              className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm hover:bg-gray-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {loading ? <p className="text-gray-300">Loading scoreboard…</p> : null}
        {error ? <p className="text-red-300">{error}</p> : null}

        {data ? (
          <>
            <div className="mb-2 text-xs text-gray-500">
              Generated: {new Date(data.generatedAt).toLocaleString()}
            </div>

            <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {KPI_META.map((k) => {
                const c = data.kpis[k.key] || {
                  today: 0,
                  last7d: 0,
                  last30d: 0,
                };
                return (
                  <div
                    key={k.key}
                    className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                  >
                    <div className="text-xs uppercase tracking-wide text-gray-400">
                      {k.label}
                    </div>
                    <div className="mt-2 text-xl font-bold text-gold">
                      {n(c.last30d)}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Today {n(c.today)} • 7d {n(c.last7d)} • 30d {n(c.last30d)}
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-4">
              <h2 className="mb-3 text-lg font-semibold text-gold">
                Conversion Ratios
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {CONVERSION_META.map((m) => {
                  const c = data.conversions[m.key] || {
                    today: null,
                    last7d: null,
                    last30d: null,
                  };
                  return (
                    <div
                      key={m.key}
                      className="rounded-lg border border-gray-800 bg-black/40 p-3"
                    >
                      <div className="text-sm text-gray-200">{m.label}</div>
                      <div className="mt-1 text-xs text-gray-400">
                        Today {pct(c.today)} • 7d {pct(c.last7d)} • 30d{" "}
                        {pct(c.last30d)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-6">
              {data.groups.map((group) => (
                <div
                  key={group.key}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gold">
                      {group.title}
                    </h3>
                    <div className="text-xs text-gray-400">
                      Total — Today {n(group.totals.today)} • 7d{" "}
                      {n(group.totals.last7d)} • 30d {n(group.totals.last30d)}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400">
                          <th className="px-2 py-2">Event</th>
                          <th className="px-2 py-2">Today</th>
                          <th className="px-2 py-2">Last 7d</th>
                          <th className="px-2 py-2">Last 30d</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.metrics.map((m) => (
                          <tr
                            key={m.eventType}
                            className="border-b border-gray-800/70"
                          >
                            <td className="px-2 py-2">
                              <div className="font-medium text-gray-100">
                                {m.label}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {m.eventType}
                              </div>
                            </td>
                            <td className="px-2 py-2">{n(m.counts.today)}</td>
                            <td className="px-2 py-2">{n(m.counts.last7d)}</td>
                            <td className="px-2 py-2">{n(m.counts.last30d)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-4">
              <h3 className="text-base font-semibold text-gold">
                Low-signal event types
              </h3>
              {lowSignalEvents.length ? (
                <p className="mt-2 text-sm text-gray-300">
                  No 30-day volume yet: {lowSignalEvents.join(", ")}
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-300">
                  All configured events have 30-day volume.
                </p>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/admin/phase1-scoreboard",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      isAdmin?: boolean;
    };

    if (!(payload.isAdmin === true || payload.accountType === "admin")) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/phase1-scoreboard",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
