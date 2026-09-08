// src/pages/admin/economic-impact.tsx
//
// Phase 6 -- Economic Impact Engine dashboard. Every figure on this page
// is labeled with how it was derived (measured / attributed / estimated /
// insufficient data) -- see src/lib/economicImpact/shared.ts.

import type { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type MetricStatus =
  | "measured"
  | "attributed"
  | "estimated"
  | "insufficient_data";

type EconomicMetric = {
  key: string;
  label: string;
  status: MetricStatus;
  value: number | null;
  unit: "usd_cents" | "count" | "ratio";
  sourceCollections: string[];
  formula?: string;
  note?: string;
};

type EconomicImpactCategory = {
  id: string;
  label: string;
  metrics: EconomicMetric[];
};

type EconomicImpactSnapshot = {
  generatedAt: string;
  categories: EconomicImpactCategory[];
  overall: EconomicMetric[];
};

const STATUS_LABEL: Record<MetricStatus, string> = {
  measured: "Measured",
  attributed: "Attributed",
  estimated: "Estimated",
  insufficient_data: "Insufficient data",
};

const STATUS_CLASS: Record<MetricStatus, string> = {
  measured: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  attributed: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  estimated: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  insufficient_data: "border-white/15 bg-white/5 text-white/50",
};

function formatValue(metric: EconomicMetric) {
  if (metric.value === null || metric.status === "insufficient_data") {
    return "—";
  }
  if (metric.unit === "usd_cents") {
    return `$${(metric.value / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  if (metric.unit === "ratio") {
    return `${Math.round(metric.value * 100)}%`;
  }
  return metric.value.toLocaleString();
}

function MetricCard({ metric }: { metric: EconomicMetric }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-white/90">
          {metric.label}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_CLASS[metric.status]}`}
        >
          {STATUS_LABEL[metric.status]}
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white">
        {formatValue(metric)}
      </div>
      {metric.formula ? (
        <div className="mt-2 text-xs text-white/50">
          Formula: <code>{metric.formula}</code>
        </div>
      ) : null}
      {metric.note ? (
        <div className="mt-1 text-xs text-white/50">{metric.note}</div>
      ) : null}
      {metric.sourceCollections.length ? (
        <div className="mt-2 text-[11px] text-white/35">
          Source: {metric.sourceCollections.join(", ")}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminEconomicImpactPage() {
  const [snapshot, setSnapshot] = useState<EconomicImpactSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/economic-impact", {
          credentials: "include",
        });
        if (!res.ok) {
          setError(`Failed to load (status ${res.status})`);
          return;
        }
        setSnapshot(await res.json());
      } catch {
        setError("Failed to load economic impact snapshot.");
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
          Economic Impact Engine
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Phase 6 -- Economic Intelligence. Every figure below is labeled with
          how it was derived. Insufficient-data metrics are an honest state, not
          a bug -- BWE does not fabricate numbers it cannot support.
        </p>

        {loading ? (
          <div className="mt-8 text-white/60">Loading…</div>
        ) : error ? (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        ) : snapshot ? (
          <>
            <div className="mt-2 text-xs text-white/40">
              Generated {new Date(snapshot.generatedAt).toLocaleString()}
            </div>

            <section className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-wide text-white/50">
                Overall
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {snapshot.overall.map((metric) => (
                  <MetricCard key={metric.key} metric={metric} />
                ))}
              </div>
            </section>

            {snapshot.categories.map((category) => (
              <section key={category.id} className="mt-8">
                <h2 className="text-xs font-bold uppercase tracking-wide text-white/50">
                  {category.label}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.metrics.map((metric) => (
                    <MetricCard key={metric.key} metric={metric} />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/economic-impact",
);
