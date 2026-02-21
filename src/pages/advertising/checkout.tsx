// src/pages/advertising/checkout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const DEFAULT_DAYS = 14;

/**
 * Keep these aligned with your pricing UI / sales copy.
 * Amounts are in dollars; the API converts to cents.
 */
const AD_PRICE: Record<string, (days: number) => number> = {
  "featured-sponsor": (days) => (days === 14 ? 149 : 149),
  "directory-standard": (days) => (days === 30 ? 49 : 49),
  "directory-featured": (days) => (days === 30 ? 99 : 99),
  "banner-ad": (days) => (days === 14 ? 199 : 199),
};

function safeNum(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function AdvertisingCheckoutPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Preparing checkout…");

  useEffect(() => {
    if (!router.isReady) return;

    const option = String(router.query.option || "").trim();
    const durationDays = safeNum(router.query.duration, DEFAULT_DAYS);

    // Optional fields (helpful for fulfillment / admin visibility)
    const businessId = String(router.query.businessId || "").trim();
    const campaignId = String(router.query.campaignId || "").trim();

    const priceFn = AD_PRICE[option];
    if (!option || !priceFn) {
      setMsg("Invalid advertising option. Redirecting…");
      router.replace("/advertising");
      return;
    }

    const amount = priceFn(durationDays);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMsg("This option requires a custom quote. Redirecting…");
      router.replace("/advertising");
      return;
    }

    const run = async () => {
      try {
        const origin = window.location.origin;

        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            itemId: option,
            type: "ad",
            amount,
            successUrl: `${origin}/advertising?success=1&option=${encodeURIComponent(option)}`,
            cancelUrl: `${origin}/advertising?canceled=1&option=${encodeURIComponent(option)}`,
            // IMPORTANT: pass extra metadata so webhook/admin can fulfill + display correctly
            metadata: {
              option,
              durationDays,
              businessId: businessId || "",
              campaignId: campaignId || "",
            },
          }),
        });

        const data = await res.json();

        // If user isn't logged in, your API returns 401 (by design)
        if (res.status === 401) {
          router.replace(
            `/login?redirect=${encodeURIComponent(router.asPath)}`,
          );
          return;
        }

        if (!res.ok) throw new Error(data?.error || "Checkout failed");
        if (!data?.url) throw new Error("Stripe URL missing from response");

        window.location.href = data.url;
      } catch (e: any) {
        setMsg(e?.message || "Checkout failed.");
      }
    };

    run();
  }, [router.isReady, router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 text-center">
        <h1 className="text-xl font-bold text-yellow-300">
          Advertising Checkout
        </h1>
        <p className="mt-3 text-sm text-zinc-300">{msg}</p>
      </div>
    </div>
  );
}
