#!/bin/bash
set -e

echo "Updating Wealth Builder upgrade page UI in $(pwd)..."

mkdir -p src/pages/wealth-builder

cat > src/pages/wealth-builder/upgrade.tsx <<'TS'
import Head from "next/head";
import { useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

type CheckoutPlan = "monthly" | "annual";

type CheckoutResponse = {
  ok: boolean;
  checkoutUrl?: string;
  message?: string;
};

export default function WealthBuilderUpgradePage() {
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(plan: CheckoutPlan) {
    setLoadingPlan(plan);
    setError("");

    try {
      const response = await fetch("/api/wealth-builder/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data: CheckoutResponse = await response.json();

      if (!response.ok || !data.ok || !data.checkoutUrl) {
        throw new Error(data.message || "Failed to start checkout.");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout.";
      setError(message);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <>
      <Head>
        <title>Upgrade | Wealth Builder</title>
        <meta
          name="description"
          content="Upgrade to Wealth Builder Premium."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Upgrade
            </p>
            <h1 className="mt-3 text-4xl font-bold">Unlock Wealth Builder Premium</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Upgrade to remove the free savings goal cap, unlock Premium insights,
              and access richer budget planning over time.
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6">
                <h2 className="text-2xl font-semibold text-yellow-300">Free</h2>
                <p className="mt-3 text-3xl font-bold">$0</p>
                <div className="mt-5 space-y-3 text-sm text-zinc-300">
                  <p>• Debt tracking</p>
                  <p>• Current-month budget</p>
                  <p>• Up to 2 savings goals</p>
                  <p>• Basic dashboard</p>
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-700/30 bg-zinc-950/90 p-6 shadow-xl">
                <h2 className="text-2xl font-semibold text-yellow-300">Premium</h2>
                <p className="mt-3 text-3xl font-bold">$8.99/month</p>
                <p className="mt-1 text-sm text-zinc-400">or $79/year</p>

                <div className="mt-5 space-y-3 text-sm text-zinc-300">
                  <p>• Unlimited savings goals</p>
                  <p>• Budget history</p>
                  <p>• Premium insights</p>
                  <p>• Future advanced tools</p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void startCheckout("monthly")}
                    disabled={loadingPlan !== null}
                    className="rounded-2xl border border-yellow-400 bg-yellow-500/15 px-5 py-4 text-left font-semibold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="text-sm uppercase tracking-wide text-yellow-200">
                      Monthly
                    </div>
                    <div className="mt-2 text-xl">$8.99</div>
                    <div className="mt-1 text-sm text-zinc-300">
                      {loadingPlan === "monthly" ? "Starting checkout..." : "Upgrade monthly"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void startCheckout("annual")}
                    disabled={loadingPlan !== null}
                    className="rounded-2xl border border-yellow-400 bg-yellow-500/15 px-5 py-4 text-left font-semibold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="text-sm uppercase tracking-wide text-yellow-200">
                      Annual
                    </div>
                    <div className="mt-2 text-xl">$79</div>
                    <div className="mt-1 text-sm text-zinc-300">
                      {loadingPlan === "annual" ? "Starting checkout..." : "Upgrade annually"}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
TS

echo "Done."
echo "Updated: src/pages/wealth-builder/upgrade.tsx"
