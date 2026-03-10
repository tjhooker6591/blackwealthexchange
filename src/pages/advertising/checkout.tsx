"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getAdQuote } from "@/lib/advertising/pricing";

const DEFAULT_DAYS = 14;

const CHECKOUT_LOCK_PREFIX = "bwe:ad-checkout-lock:";
const CHECKOUT_LOCK_TTL_MS = 20_000;

function qStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function safeNum(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

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

function normalizeFromLegacyQuery(query: Record<string, any>) {
  const type = qStr(query.type).toLowerCase();
  const plan = qStr(query.plan).toLowerCase();

  if (type === "directory") {
    if (plan === "featured") return "directory-featured";
    if (plan === "standard") return "directory-standard";
  }

  return "";
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
      if (Number.isFinite(ts) && now - ts < CHECKOUT_LOCK_TTL_MS) return false;
    }

    window.sessionStorage.setItem(storageKey, String(now));
    return true;
  } catch {
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

export default function AdvertisingCheckoutPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const startedAttemptRef = useRef<string | null>(null);

  const parsed = useMemo(() => {
    if (!router.isReady) return null;

    const rawOption =
      qStr(router.query.option) || normalizeFromLegacyQuery(router.query);
    const option = normalizeAdOption(rawOption);
    const durationDays = safeNum(router.query.duration, DEFAULT_DAYS);

    const businessId = qStr(router.query.businessId);
    const campaignId = qStr(router.query.campaignId);
    const placement = qStr(router.query.placement);

    const quote = getAdQuote({ option, durationDays });
    if (!quote) {
      return {
        invalid: true,
        error: "Invalid advertising option or duration.",
      };
    }

    return {
      invalid: false,
      option: quote.option,
      label: quote.label,
      durationDays: quote.durationDays,
      amountDollars: quote.amountDollars,
      businessId,
      campaignId,
      placement,
    };
  }, [router.isReady, router.query]);

  const handleStartCheckout = async () => {
    if (!parsed || parsed.invalid) return;

    const attemptKey = buildAttemptKey({
      option: parsed.option,
      durationDays: parsed.durationDays,
      businessId: parsed.businessId,
      campaignId: parsed.campaignId,
      placement: parsed.placement,
    });

    if (startedAttemptRef.current === attemptKey) return;
    if (!acquireCheckoutLock(attemptKey)) {
      setMessage("Checkout is already being prepared. Please wait a moment.");
      return;
    }

    startedAttemptRef.current = attemptKey;
    setLoading(true);
    setMessage("Preparing secure checkout…");

    try {
      const origin = window.location.origin;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemId: parsed.option,
          type: "ad",
          amount: parsed.amountDollars,
          durationDays: parsed.durationDays,
          businessId: parsed.businessId || undefined,
          campaignId: parsed.campaignId || undefined,
          placement: parsed.placement || undefined,
          metadata: {
            option: parsed.option,
            durationDays: String(parsed.durationDays),
            businessId: parsed.businessId || "",
            campaignId: parsed.campaignId || "",
            placement: parsed.placement || "",
          },
          successUrl: `${origin}/advertising?success=1&option=${encodeURIComponent(parsed.option)}`,
          cancelUrl: `${origin}/advertising?canceled=1&option=${encodeURIComponent(parsed.option)}`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        releaseCheckoutLock(attemptKey);
        startedAttemptRef.current = null;
        router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        return;
      }

      if (res.status === 409) {
        setMessage(
          data?.error ||
            "A checkout session is already in progress. Please wait and retry.",
        );
        return;
      }

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err: any) {
      releaseCheckoutLock(attemptKey);
      startedAttemptRef.current = null;
      setMessage(err?.message || "Unable to start checkout.");
      setLoading(false);
    }
  };

  if (!router.isReady || !parsed) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6 text-center">
          <h1 className="text-xl font-bold text-yellow-300">Advertising Checkout</h1>
          <p className="mt-3 text-sm text-zinc-300">Loading checkout details…</p>
        </div>
      </div>
    );
  }

  if (parsed.invalid) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-zinc-950 p-6 text-center">
          <h1 className="text-xl font-bold text-yellow-300">Advertising Checkout</h1>
          <p className="mt-3 text-sm text-red-200">{parsed.error}</p>
          <button
            onClick={() => router.replace("/advertising")}
            className="mt-4 rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
          >
            Back to Advertising Options
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-yellow-500/20 bg-zinc-950 p-6">
        <h1 className="text-xl font-bold text-yellow-300 text-center">
          Review Advertising Checkout
        </h1>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm space-y-2">
          <div>
            <span className="text-zinc-400">Option:</span>{" "}
            <span className="text-white font-semibold">{parsed.label}</span>
          </div>
          <div>
            <span className="text-zinc-400">Duration:</span>{" "}
            <span className="text-white">{parsed.durationDays} days</span>
          </div>
          <div>
            <span className="text-zinc-400">Price:</span>{" "}
            <span className="text-yellow-300 font-semibold">${parsed.amountDollars}</span>
          </div>
          {parsed.placement ? (
            <div>
              <span className="text-zinc-400">Placement:</span>{" "}
              <span className="text-white">{parsed.placement}</span>
            </div>
          ) : null}
          {parsed.campaignId ? (
            <div>
              <span className="text-zinc-400">Campaign Request:</span>{" "}
              <span className="text-white break-all">{parsed.campaignId}</span>
            </div>
          ) : null}
        </div>

        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            disabled={loading}
          >
            Back
          </button>
          <button
            onClick={handleStartCheckout}
            className="flex-1 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Starting…" : "Continue to Secure Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}
