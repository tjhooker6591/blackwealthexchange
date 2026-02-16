// src/pages/admin/health.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type CheckResult = {
  name: string;
  url: string;
  status: number | null;
  ok: boolean;
  bodyPreview: string;
  error?: string;
};

async function runCheck(name: string, url: string): Promise<CheckResult> {
  try {
    const res = await fetch(url, { credentials: "include" });
    const text = await res.text();

    const bodyPreview = text.length > 800 ? text.slice(0, 800) + "…" : text;

    return {
      name,
      url,
      status: res.status,
      ok: res.ok || res.status === 304,
      bodyPreview,
    };
  } catch (e: any) {
    return {
      name,
      url,
      status: null,
      ok: false,
      bodyPreview: "",
      error: e?.message || "Network error",
    };
  }
}

function Badge({ ok, status }: { ok: boolean; status: number | null }) {
  const label = status === null ? "ERR" : String(status);
  const cls = ok
    ? "border-green-500/30 text-green-200 bg-green-500/10"
    : "border-red-500/30 text-red-200 bg-red-500/10";
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const results = await Promise.all([
      runCheck("Auth: /api/auth/me", "/api/auth/me"),
      runCheck(
        "Admin: /api/admin/dashboard-stats",
        "/api/admin/dashboard-stats"
      ),
    ]);
    setChecks(results);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const allOk = checks.length > 0 && checks.every((c) => c.ok);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-yellow-200">
              Admin Health Check
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Quick baseline verification so you don’t waste nights debugging.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="text-sm text-yellow-200 hover:underline"
            >
              ← Back to Admin
            </Link>
            <button
              onClick={refresh}
              disabled={loading}
              className="rounded-xl border border-yellow-500/30 bg-black/40 px-4 py-2 text-sm text-yellow-200 hover:bg-black/60 disabled:opacity-50"
            >
              {loading ? "Checking…" : "Refresh"}
            </button>
          </div>
        </div>

        <div
          className={`mb-5 rounded-2xl border p-4 ${
            allOk
              ? "border-green-500/30 bg-green-500/10 text-green-200"
              : "border-yellow-500/20 bg-white/5 text-white/80"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">
              Baseline status:{" "}
              <span className={allOk ? "text-green-200" : "text-yellow-200"}>
                {allOk ? "STABLE" : "CHECK"}
              </span>
            </div>
            <div className="text-xs text-white/60">
              Goal: /api/auth/me + /api/admin/dashboard-stats both OK
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {checks.map((c) => (
            <div
              key={c.url}
              className="rounded-2xl border border-yellow-500/20 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-yellow-200">
                    {c.name}
                  </div>
                  <div className="text-xs text-white/60">{c.url}</div>
                </div>
                <Badge ok={c.ok} status={c.status} />
              </div>

              {c.error ? (
                <div className="mt-3 text-sm text-red-200">{c.error}</div>
              ) : (
                <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-yellow-500/10 bg-black/40 p-3 text-xs text-white/80">
                  {c.bodyPreview || "(empty)"}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
