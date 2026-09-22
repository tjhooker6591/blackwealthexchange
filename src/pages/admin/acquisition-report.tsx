// src/pages/admin/acquisition-report.tsx
//
// Admin financial view (brief section 5). Deliberately distinct from the
// existing /admin/economic-impact.tsx (Phase 6 platform-wide engine) --
// this is scoped to the acquisition program's own pipeline and the
// businesses it activated, not platform-wide revenue.

import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

function cents(n: number | null | undefined) {
  if (n === null || n === undefined) return "unavailable";
  return `$${(n / 100).toFixed(2)}`;
}

export default function AcquisitionReportPage() {
  const [report, setReport] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/acquisition/report", {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json.ok)
          throw new Error(json.message || "Failed to load report");
        setReport(json.report);
        setPipeline(json.estimatedPipeline);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">
            Acquisition Financial View
          </h1>
          <Link
            href="/admin/growth"
            className="text-sm border border-zinc-700 px-3 py-2 rounded"
          >
            Back to Growth Operations
          </Link>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {!report ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="font-semibold text-yellow-300 mb-2">Pipeline</h2>
              <p className="text-sm text-zinc-300">
                Total prospects: {report.pipeline.totalProspects}
              </p>
              <p className="text-sm text-zinc-300">
                Activated: {report.pipeline.activated}
              </p>
              <p className="text-sm text-zinc-300">
                Estimated open pipeline: {pipeline?.openProspectCount ?? "—"} (
                {pipeline?.label})
              </p>
              <ul className="mt-2 text-xs text-zinc-500 space-y-0.5">
                {Object.entries(report.pipeline.stageCounts).map(
                  ([stage, count]) => (
                    <li key={stage}>
                      {stage.replace("_", " ")}: {String(count)}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
              <h2 className="font-semibold text-yellow-300 mb-2">
                Financial (this window)
              </h2>
              <p className="text-sm text-zinc-300">
                Unique paying businesses: {report.uniquePayingBusinesses}
              </p>
              <p className="text-sm text-zinc-300">
                Acquisition spend: {cents(report.acquisitionSpendCents)}
              </p>
              <p className="text-sm text-zinc-300">
                BWE collected revenue: {cents(report.bweCollectedRevenueCents)}
              </p>
              <p className="text-sm text-zinc-300">
                Merchant gross sales: {cents(report.merchantGrossSalesCents)}
              </p>
              <p className="text-sm text-zinc-300">
                Refunded: {cents(report.refundedCents)}
              </p>
              <p className="text-sm text-zinc-300">
                CAC:{" "}
                {report.cacCents !== null
                  ? cents(report.cacCents)
                  : "unavailable"}
                {report.cacNote ? (
                  <span className="block text-xs text-zinc-500">
                    {report.cacNote}
                  </span>
                ) : null}
              </p>
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-4 sm:col-span-2">
              <h2 className="font-semibold text-yellow-300 mb-2">
                Known limitations
              </h2>
              <p className="text-xs text-zinc-500">
                Recurring revenue: {report.recurringRevenue.note}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Repeat purchases / retention:{" "}
                {report.repeatPurchasesAndRetention.note}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/acquisition-report",
);
