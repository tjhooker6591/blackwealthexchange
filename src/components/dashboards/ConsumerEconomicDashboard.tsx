// src/components/dashboards/ConsumerEconomicDashboard.tsx
//
// P4-02 Consumer Economic Dashboard (plus the consumer side of P4-09
// Attribution). Shows a member their own verified economic impact, sourced
// from /api/personalization/consumer-economics (bmev_records, the same
// verified-payment ledger used for business-side revenue reporting), and
// where that verified spend is going by source
// (/api/personalization/attribution). Honest empty state when no verified
// purchase exists.

"use client";

import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";

type Payload = {
  state: "LINKED" | "NOT_LINKED";
  verifiedRevenueCents: number;
  transactionCount: number;
  businessesSupported: number;
  businessLines: string[];
  monthlyTrend: { month: string; verifiedRevenueCents: number }[];
};

type AttributionPayload = {
  state: "LINKED" | "NOT_LINKED";
  spendBySource: {
    key: string;
    transactionCount: number;
    verifiedRevenueCents: number;
  }[];
};

function formatDollars(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function ConsumerEconomicDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [attribution, setAttribution] = useState<AttributionPayload | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [res, attrRes] = await Promise.allSettled([
          fetch("/api/personalization/consumer-economics", {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/personalization/attribution", {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);
        if (res.status === "fulfilled" && res.value.ok) {
          setData(await res.value.json());
        }
        if (attrRes.status === "fulfilled" && attrRes.value.ok) {
          setAttribution(await attrRes.value.json());
        }
      } catch {
        // degrade silently
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
        <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-20 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-yellow-300" />
        <h2 className="text-lg font-bold text-gold">Your Economic Impact</h2>
      </div>

      {data.state === "NOT_LINKED" ? (
        <p className="mt-2 text-sm text-gray-400">
          You haven&apos;t made a verified purchase through BWE yet. Once you
          do, your real spend with Black-owned businesses will show here.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat
              label="Verified spend"
              value={formatDollars(data.verifiedRevenueCents)}
            />
            <Stat label="Purchases" value={data.transactionCount} />
            <Stat
              label="Businesses supported"
              value={data.businessesSupported}
            />
          </div>

          {data.monthlyTrend.length > 1 ? (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Monthly trend
              </div>
              <div className="mt-2 flex items-end gap-1">
                {data.monthlyTrend.map((point) => {
                  const max = Math.max(
                    1,
                    ...data.monthlyTrend.map((p) => p.verifiedRevenueCents),
                  );
                  return (
                    <div
                      key={point.month}
                      className="flex-1 rounded-t bg-yellow-400/70"
                      style={{
                        height: `${Math.max(4, (point.verifiedRevenueCents / max) * 64)}px`,
                      }}
                      title={`${point.month}: ${formatDollars(point.verifiedRevenueCents)}`}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {attribution &&
          attribution.state === "LINKED" &&
          attribution.spendBySource.length ? (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Where your spend goes
              </div>
              <div className="mt-2 space-y-1">
                {attribution.spendBySource.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between text-sm text-gray-200"
                  >
                    <span className="capitalize">{row.key}</span>
                    <span className="text-xs text-gray-400">
                      {formatDollars(row.verifiedRevenueCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-white">{value}</div>
    </div>
  );
}
