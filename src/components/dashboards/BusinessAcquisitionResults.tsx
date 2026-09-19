// src/components/dashboards/BusinessAcquisitionResults.tsx
//
// Owner results report (BWE Acquisition & Proof, brief section 5).
// Standalone component (own fetch/loading state), composed into
// BusinessGrowthCenter.tsx the same way CreatorPerformance.tsx and
// EmployerJobPerformance.tsx are composed into their dashboards -- kept
// separate so a failure here can never break the existing Growth Command
// Center fetch.

"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";

type OwnerReport = {
  profileViews: number;
  contactActions: {
    websiteClicks: number;
    phoneClicks: number;
    directionsClicks: number;
  };
  inquiries: number;
  storefrontViews: number;
  confirmedOrders: number;
  merchantGrossSalesCents: number;
  merchantNetSalesCents: number;
  offPlatformAttestedSales: { date: string; amountCents: number }[];
  baseline:
    | { available: true; activity: any }
    | { available: false; reason: string };
};

function formatDollars(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function BusinessAcquisitionResults({
  businessId,
}: {
  businessId?: string;
}) {
  const [report, setReport] = useState<OwnerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const qs = businessId
      ? `?businessId=${encodeURIComponent(businessId)}`
      : "";
    (async () => {
      try {
        const res = await fetch(`/api/business/acquisition-report${qs}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          setUnavailable(true);
          return;
        }
        const json = await res.json();
        if (json?.ok) setReport(json.report);
        else setUnavailable(true);
      } catch {
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [businessId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
        <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-16 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  if (unavailable || !report) return null;

  const offPlatformTotal = report.offPlatformAttestedSales.reduce(
    (sum, r) => sum + r.amountCents,
    0,
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-yellow-300" />
        <h3 className="text-base font-bold text-gold">
          Buyer Results (last 30 days)
        </h3>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Real, server-confirmed activity only -- a phone click is not a completed
        call; an inquiry is not a qualified lead.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Profile views" value={report.profileViews} />
        <Stat label="Storefront views" value={report.storefrontViews} />
        <Stat label="Inquiries" value={report.inquiries} />
        <Stat label="Confirmed orders" value={report.confirmedOrders} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat
          label="Website clicks"
          value={report.contactActions.websiteClicks}
        />
        <Stat label="Phone clicks" value={report.contactActions.phoneClicks} />
        <Stat
          label="Directions clicks"
          value={report.contactActions.directionsClicks}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-gray-400">
            Merchant net sales (BWE checkout)
          </div>
          <div className="mt-1 text-lg font-extrabold text-white">
            {formatDollars(report.merchantNetSalesCents)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-gray-400">
            Owner-confirmed off-platform sales
          </div>
          <div className="mt-1 text-lg font-extrabold text-white">
            {formatDollars(offPlatformTotal)}
          </div>
          <div className="text-[10px] text-gray-500">
            Separate ledger -- not included in BWE checkout totals.
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {report.baseline.available
          ? "Compared against an equal-duration prior window."
          : `Baseline unavailable: ${(report.baseline as any).reason}`}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-white">{value}</div>
    </div>
  );
}
