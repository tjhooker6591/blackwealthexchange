// src/components/dashboards/PersonalizedHome.tsx
//
// P4-01 Personalized Home + P4-07 Recommendations UI.
// Shared strip rendered at the top of every role dashboard
// (User/Business/Employer/Seller). Fetches /api/personalization/home,
// which is grounded entirely in Person360 + real activity + real
// recommendation matches. Renders honest empty states when there isn't
// enough data yet -- never invented numbers or picks.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Store } from "lucide-react";

type NextAction = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

type RecommendedBusiness = {
  businessId: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  url: string;
  verified: boolean;
};

type RecommendedProduct = {
  productId: string;
  name: string;
  category: string | null;
  price: number | null;
  url: string;
};

type HomePayload = {
  ok: true;
  fullName: string | null;
  roles: string[];
  hasActivity: boolean;
  nextActions: NextAction[];
  recommendations: {
    state: "PERSONALIZED" | "TRENDING_FALLBACK" | "INSUFFICIENT_DATA";
    businesses: RecommendedBusiness[];
    products: RecommendedProduct[];
  };
};

export default function PersonalizedHome() {
  const [data, setData] = useState<HomePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/personalization/home", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.ok) setData(json);
      } catch {
        // Silently degrade -- the rest of the dashboard still renders.
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
        <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-16 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  if (!data) return null;

  const { nextActions, recommendations } = data;
  const hasRecs =
    recommendations.businesses.length > 0 ||
    recommendations.products.length > 0;

  return (
    <div className="mb-6 space-y-4">
      {nextActions.length ? (
        <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 shadow-xl sm:p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-gold">
              For you
            </h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {nextActions.map((action) => (
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
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-yellow-300" />
            <h2 className="text-lg font-bold text-gold">
              {recommendations.state === "TRENDING_FALLBACK"
                ? "Trending on BWE"
                : "Recommended for you"}
            </h2>
          </div>
          <Link
            href="/business-directory"
            className="text-sm text-gold hover:underline"
          >
            Browse all
          </Link>
        </div>

        {recommendations.state === "TRENDING_FALLBACK" ? (
          <p className="mb-3 text-xs text-gray-400">
            Based on real activity across BWE in the last 30 days -- browse a
            few businesses or products so we can personalize this for you.
          </p>
        ) : null}

        {hasRecs ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.businesses.map((biz) => (
              <Link
                key={biz.businessId}
                href={biz.url}
                className="rounded-xl border border-white/10 bg-black/30 p-3 transition hover:bg-black/40"
              >
                <div className="truncate text-sm font-semibold text-white">
                  {biz.name}
                </div>
                <div className="mt-1 truncate text-xs text-gray-400">
                  {[biz.category, biz.city].filter(Boolean).join(" · ") ||
                    "Black-owned business"}
                </div>
              </Link>
            ))}
            {recommendations.products.map((product) => (
              <Link
                key={product.productId}
                href={product.url}
                className="rounded-xl border border-white/10 bg-black/30 p-3 transition hover:bg-black/40"
              >
                <div className="truncate text-sm font-semibold text-white">
                  {product.name}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {typeof product.price === "number"
                    ? `$${product.price.toFixed(2)}`
                    : product.category || "Marketplace item"}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-300">
            No recommendations yet -- browse the directory or marketplace and
            we&apos;ll surface real matches here based on what you view.
          </div>
        )}
      </div>
    </div>
  );
}
