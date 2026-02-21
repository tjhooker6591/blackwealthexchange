"use client";

import { useEffect, useState } from "react";

type Status = {
  connected: boolean;
  stripeAccountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: string[];
};

export default function StripePayoutStatusCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    !!status?.connected &&
    !!status?.detailsSubmitted &&
    !!status?.chargesEnabled &&
    !!status?.payoutsEnabled;

  const pill = loading
    ? { text: "Checking…", cls: "border-white/10 bg-white/5 text-gray-200" }
    : ready
      ? {
          text: "Payouts enabled",
          cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        }
      : status?.connected
        ? {
            text: "Setup required",
            cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
          }
        : {
            text: "Not connected",
            cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
          };

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/stripe/account-status");
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load Stripe status");
      setStatus(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load Stripe status");
    } finally {
      setLoading(false);
    }
  }

  async function openOnboarding() {
    setWorking(true);
    setError(null);
    try {
      const r = await fetch("/api/stripe/create-account-link", {
        method: "POST",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to start Stripe setup");
      if (!data?.url) throw new Error("Missing onboarding URL");
      window.location.assign(data.url);
    } catch (e: any) {
      setError(e?.message || "Stripe setup failed");
      setWorking(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gold">Payout Status</h3>
          <p className="mt-1 text-sm text-gray-300">
            Stripe payouts must be enabled before you can receive funds to your
            bank.
          </p>
          {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        </div>

        <div
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${pill.cls}`}
        >
          {pill.text}
        </div>
      </div>

      {!loading && status && !ready ? (
        <>
          {status.requirements?.length ? (
            <p className="mt-3 text-xs text-gray-400">
              Stripe still needs:{" "}
              <span className="text-gray-300">
                {status.requirements.join(", ")}
              </span>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={openOnboarding}
              disabled={working}
              className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {working
                ? "Opening…"
                : status.connected
                  ? "Finish Stripe Setup"
                  : "Connect Stripe"}
            </button>

            <button
              onClick={refresh}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-100 hover:bg-white/10"
            >
              Refresh Status
            </button>
          </div>
        </>
      ) : null}

      {!loading && ready ? (
        <p className="mt-3 text-sm text-gray-300">
          ✅ You’re ready. Buyers can check out your products.
        </p>
      ) : null}
    </div>
  );
}
