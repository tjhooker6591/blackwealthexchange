// src/components/dashboards/BusinessGrowthCenter.tsx
//
// P4-03 Business Growth Command Center, P4-08 Business Discovery Analytics,
// and the business side of P4-09 Attribution -- rendered together as one
// panel on the business dashboard since they share the same business and
// answer one operator question: "how is my business doing on BWE, and
// why." All numbers come from /api/personalization/business-growth,
// /business-discovery-analytics, and /attribution?scope=business, which are
// grounded in Business360 + the verified bmev_records revenue ledger +
// flow_events/search_quality_events. Honest empty states throughout.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp, Search, Radio } from "lucide-react";

type GrowthPayload = {
  ok: true;
  name: string;
  claimed: boolean;
  profileViews: number;
  searchAppearances: number;
  verifiedRevenueCents: number;
  transactionCount: number;
  publishedProductCount: number;
  nextActions: {
    id: string;
    title: string;
    body: string;
    href: string;
    cta: string;
  }[];
};

type DiscoveryPayload = {
  state: "LINKED" | "NOT_LINKED";
  totalEvents: number;
  weeklyTrend: { weekStart: string; events: number }[];
  topEventTypes: { key: string; count: number }[];
  topSearchQueries: { key: string; count: number }[];
};

type AttributionPayload = {
  state: "LINKED" | "NOT_LINKED";
  revenueBySource: {
    key: string;
    transactionCount: number;
    verifiedRevenueCents: number;
  }[];
  trafficChannelMix: { key: string; events: number }[];
};

function formatDollars(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function BusinessGrowthCenter({
  businessId,
}: {
  businessId?: string;
}) {
  const [growth, setGrowth] = useState<GrowthPayload | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryPayload | null>(null);
  const [attribution, setAttribution] = useState<AttributionPayload | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const qs = businessId
      ? `?businessId=${encodeURIComponent(businessId)}`
      : "";

    (async () => {
      try {
        const [growthRes, discoveryRes, attrRes] = await Promise.allSettled([
          fetch(`/api/personalization/business-growth${qs}`, {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(`/api/personalization/business-discovery-analytics${qs}`, {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(
            `/api/personalization/attribution?scope=business${
              businessId ? `&businessId=${encodeURIComponent(businessId)}` : ""
            }`,
            {
              credentials: "include",
              cache: "no-store",
              signal: controller.signal,
            },
          ),
        ]);

        if (growthRes.status === "fulfilled" && growthRes.value.ok) {
          const json = await growthRes.value.json();
          if (json?.ok) setGrowth(json);
          else setUnavailable(true);
        } else {
          setUnavailable(true);
        }

        if (discoveryRes.status === "fulfilled" && discoveryRes.value.ok) {
          setDiscovery(await discoveryRes.value.json());
        }

        if (attrRes.status === "fulfilled" && attrRes.value.ok) {
          setAttribution(await attrRes.value.json());
        }
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
        <div className="mt-4 h-24 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  if (unavailable || !growth) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300 shadow-xl sm:p-6">
        Growth Command Center will appear once your business is linked to a BWE
        account. If you believe this is a mistake, visit your{" "}
        <Link href="/profile" className="text-gold hover:underline">
          profile
        </Link>{" "}
        to confirm your business is claimed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 shadow-xl sm:p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-yellow-300" />
          <h2 className="text-lg font-bold text-gold">Growth Command Center</h2>
        </div>
        <p className="mt-1 text-xs text-gray-300">
          Real, verified performance for {growth.name}.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Profile views" value={growth.profileViews} />
          <Stat label="Search appearances" value={growth.searchAppearances} />
          <Stat
            label="Verified revenue"
            value={formatDollars(growth.verifiedRevenueCents)}
          />
          <Stat label="Verified sales" value={growth.transactionCount} />
        </div>

        {growth.nextActions.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {growth.nextActions.map((action) => (
              <div
                key={action.id}
                className="rounded-xl border border-white/10 bg-black/30 p-3"
              >
                <div className="text-sm font-semibold text-white">
                  {action.title}
                </div>
                <p className="mt-1 text-xs text-gray-400">{action.body}</p>
                <Link
                  href={action.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
                >
                  {action.cta} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-yellow-300" />
          <h3 className="text-base font-bold text-gold">Discovery Analytics</h3>
        </div>

        {discovery && discovery.state === "LINKED" ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Weekly activity ({discovery.totalEvents} events)
              </div>
              <div className="mt-2 flex items-end gap-1">
                {discovery.weeklyTrend.map((point) => {
                  const max = Math.max(
                    1,
                    ...discovery.weeklyTrend.map((p) => p.events),
                  );
                  return (
                    <div
                      key={point.weekStart}
                      className="flex-1 rounded-t bg-yellow-400/70"
                      style={{
                        height: `${Math.max(4, (point.events / max) * 64)}px`,
                      }}
                      title={`${point.weekStart}: ${point.events} events`}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Top search queries leading here
              </div>
              <div className="mt-2 space-y-1">
                {discovery.topSearchQueries.length ? (
                  discovery.topSearchQueries.map((q) => (
                    <div
                      key={q.key}
                      className="flex items-center justify-between text-sm text-gray-200"
                    >
                      <span className="truncate">{q.key}</span>
                      <span className="text-xs text-gray-400">{q.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">
                    No search-driven visits recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">
            No discovery activity recorded in the last 8 weeks yet.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-yellow-300" />
          <h3 className="text-base font-bold text-gold">
            Revenue &amp; Traffic Attribution
          </h3>
        </div>

        {attribution && attribution.state === "LINKED" ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Verified revenue by source
              </div>
              <div className="mt-2 space-y-1">
                {attribution.revenueBySource.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between text-sm text-gray-200"
                  >
                    <span className="capitalize">{row.key}</span>
                    <span className="text-xs text-gray-400">
                      {formatDollars(row.verifiedRevenueCents)} ·{" "}
                      {row.transactionCount} sales
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Traffic channel mix (engagement, not revenue-linked)
              </div>
              <div className="mt-2 space-y-1">
                {attribution.trafficChannelMix.slice(0, 6).map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between text-sm text-gray-200"
                  >
                    <span className="capitalize">{row.key}</span>
                    <span className="text-xs text-gray-400">
                      {row.events} events
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">
            No verified revenue or traffic recorded yet. This will populate
            automatically once you have activity.
          </p>
        )}
      </div>
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
