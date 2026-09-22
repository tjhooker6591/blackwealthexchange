// src/components/dashboards/CreatorPerformance.tsx
//
// P4-06 Creator Experience -- real per-product performance (views, verified
// revenue, units sold) for the signed-in seller/creator, sourced from
// /api/personalization/creator-experience.

"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

type Product = {
  productId: string;
  name: string;
  published: boolean;
  views: number;
  verifiedRevenueCents: number;
  unitsSold: number;
};

type Payload = {
  state: "LINKED" | "NOT_LINKED";
  totalProducts: number;
  publishedProducts: number;
  verifiedRevenueCents: number;
  transactionCount: number;
  topProducts: Product[];
};

function formatDollars(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function CreatorPerformance() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/personalization/creator-experience", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) setData(await res.json());
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

  if (!data || data.state === "NOT_LINKED") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-yellow-300" />
          <h3 className="text-base font-bold text-gold">Creator Performance</h3>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Once you publish products, real views and verified sales will appear
          here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-yellow-300" />
        <h3 className="text-base font-bold text-gold">Creator Performance</h3>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Products" value={data.totalProducts} />
        <MiniStat label="Published" value={data.publishedProducts} />
        <MiniStat
          label="Verified revenue"
          value={formatDollars(data.verifiedRevenueCents)}
        />
        <MiniStat label="Verified sales" value={data.transactionCount} />
      </div>

      {data.topProducts.length ? (
        <div className="mt-4 space-y-2">
          {data.topProducts.map((p) => (
            <div
              key={p.productId}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {p.name}
                </div>
                <div className="text-xs text-gray-400">
                  {p.views} views · {p.unitsSold} sold
                  {!p.published ? " · unpublished" : ""}
                </div>
              </div>
              <div className="shrink-0 text-sm font-semibold text-gold">
                {formatDollars(p.verifiedRevenueCents)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-400">No products published yet.</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-white">{value}</div>
    </div>
  );
}
