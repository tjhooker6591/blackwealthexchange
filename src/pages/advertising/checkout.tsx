// src/pages/advertising/checkout.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getAdQuote } from "@/lib/advertising/pricing";

const DEFAULT_DAYS = 14;

// Prevent accidental duplicate checkout session creation from effect re-runs,
// StrictMode dev remounts, rapid route churn, or double navigation.
const CHECKOUT_LOCK_PREFIX = "bwe:ad-checkout-lock:";
const CHECKOUT_LOCK_TTL_MS = 20_000;

function qStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function safeNum(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function buildAttemptKey(input: {
  option: string;
  durationDays: number;
  businessId: string;
  campaignId: string;
  placement: string;
}) {
  return [
    input.option,
    String(input.durationDays),
    input.businessId || "",
    input.campaignId || "",
    input.placement || "",
  ].join("|");
}

function getLockStorageKey(attemptKey: string) {
  return `${CHECKOUT_LOCK_PREFIX}${attemptKey}`;
}

function acquireCheckoutLock(attemptKey: string) {
  if (typeof window === "undefined") return true;

  const storageKey = getLockStorageKey(attemptKey);
  const now = Date.now();

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (raw) {
      const ts = Number(raw);
      if (Number.isFinite(ts) && now - ts < CHECKOUT_LOCK_TTL_MS) {
        return false;
      }
    }

    window.sessionStorage.setItem(storageKey, String(now));
    return true;
  } catch {
    // If storage is unavailable, fail open (server-side dedupe will still protect us)
    return true;
  }
}

function releaseCheckoutLock(attemptKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(getLockStorageKey(attemptKey));
  } catch {
    // ignore
  }
}

/**
 * Backward-compat aliases so old links/buttons don’t break checkout.
 * (Prevents “invalid option” when legacy IDs are still used somewhere.)
 */
function normalizeAdOption(raw: string) {
  const option = raw.trim();

  const aliases: Record<string, string> = {
    "featured-sponsor-ad": "featured-sponsor",
    "sponsor-featured": "featured-sponsor",

    "banner-homepage-top": "banner-ad",
    "banner-sidebar": "banner-ad",
    "banner-footer": "banner-ad",
    "banner-dashboard": "banner-ad",
  };

  return aliases[option] || option;
}

/**
 * Optional support for old query patterns like:
 * /checkout?type=directory&plan=standard
 */
function normalizeFromLegacyQuery(query: Record<string, any>) {
  const type = qStr(query.type).toLowerCase();
  const plan = qStr(query.plan).toLowerCase();

  if (type === "directory") {
    if (plan === "featured") return "directory-featured";
    if (plan === "standard") return "directory-standard";
  }

  return "";
}

export default function AdvertisingCheckoutPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Preparing checkout…");

  // In-mount guard (handles normal rerenders)
  const startedAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    // Support both current and legacy query styles
    const rawOption =
      qStr(router.query.option) || normalizeFromLegacyQuery(router.query);
    const option = normalizeAdOption(rawOption);

    const durationDays = safeNum(router.query.duration, DEFAULT_DAYS);

    // Helpful for fulfillment/admin visibility
    const businessId = qStr(router.query.businessId);
    const campaignId = qStr(router.query.campaignId);
    const placement = qStr(router.query.placement);

    if (!option) {
      setMsg("Invalid advertising option. Redirecting…");
      router.replace("/advertising");
      return;
    }

    // ✅ Uses your actual shared pricing export
    const quote = getAdQuote({ option, durationDays });

    if (!quote) {
      setMsg("Invalid advertising option or duration");
      return;
    }

    const attemptKey = buildAttemptKey({
      option: quote.option,
      durationDays: quote.durationDays,
      businessId,
      campaignId,
      placement,
    });

    // Guard 1: same mount/rerender duplicate
    if (startedAttemptRef.current === attemptKey) {
      return;
    }

    // Guard 2: cross-remount / StrictMode / quick duplicate navigation duplicate
    if (!acquireCheckoutLock(attemptKey)) {
      startedAttemptRef.current = attemptKey;
      setMsg("Checkout is already being prepared…");
      return;
    }

    startedAttemptRef.current = attemptKey;
    let cancelled = false;

    const run = async () => {
      try {
        const origin = window.location.origin;

        setMsg(
          `Preparing checkout for ${quote.label} (${quote.durationDays} days)…`,
        );

        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            itemId: quote.option,
            type: "ad",

            // Server should recompute/validate; this is for compatibility only
            amount: quote.amountDollars,

            // Preferred top-level fields
            durationDays: quote.durationDays,
            businessId: businessId || undefined,
            campaignId: campaignId || undefined,
            placement: placement || undefined,

            // Backward compatibility / visibility metadata
            metadata: {
              option: quote.option,
              durationDays: String(quote.durationDays),
              businessId: businessId || "",
              campaignId: campaignId || "",
              placement: placement || "",
            },

            // Legacy (safe if ignored by hardened server)
            successUrl: `${origin}/advertising?success=1&option=${encodeURIComponent(
              quote.option,
            )}`,
            cancelUrl: `${origin}/advertising?canceled=1&option=${encodeURIComponent(
              quote.option,
            )}`,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.status === 401) {
          // Release lock so retry after login works
          releaseCheckoutLock(attemptKey);
          startedAttemptRef.current = null;
          router.replace(
            `/login?redirect=${encodeURIComponent(router.asPath)}`,
          );
          return;
        }

        // If server duplicate guard returns conflict, don't re-fire immediately.
        if (res.status === 409) {
          setMsg(
            data?.error ||
              "A checkout session is already being prepared. Please wait a moment or refresh.",
          );
          return;
        }

        if (!res.ok) {
          throw new Error(data?.error || "Checkout failed");
        }

        if (!data?.url) {
          throw new Error("Stripe URL missing from response");
        }

        // Keep lock in place during redirect to prevent duplicate session creation
        window.location.href = data.url;
      } catch (err: any) {
        console.error("Advertising checkout error:", err);
        releaseCheckoutLock(attemptKey);
        startedAttemptRef.current = null;
        if (!cancelled) {
          setMsg(err?.message || "Checkout failed.");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      // Intentionally do NOT release lock on cleanup here, because cleanup can run during
      // StrictMode dev remount; releasing would allow duplicate checkout creation.
      // The lock auto-expires via TTL, and we release on known failures above.
    };
  }, [router.isReady, router.asPath]);

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
