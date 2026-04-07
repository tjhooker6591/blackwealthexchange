import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

type CheckoutPlan = "monthly" | "annual";

type CheckoutResponse = {
  sessionId?: string;
  url?: string;
  error?: string;
};

type EntitlementResponse = {
  ok: boolean;
  entitlement?: {
    productKey: "wealth_builder_premium";
    tier: "free" | "premium";
    status: "active" | "trialing" | "canceled" | "expired" | "inactive";
    isPremium: boolean;
    limits: {
      maxSavingsGoals: number | null;
      currentMonthBudgetOnly: boolean;
      insightsEnabled: boolean;
      budgetHistoryEnabled: boolean;
    };
  };
  message?: string;
};

export default function WealthBuilderUpgradePage() {
  const router = useRouter();

  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [loadingEntitlement, setLoadingEntitlement] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [entitlementStatus, setEntitlementStatus] = useState<string>("inactive");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const checkoutState = useMemo(() => {
    const value = router.query.checkout;
    return typeof value === "string" ? value : "";
  }, [router.query.checkout]);

  useEffect(() => {
    async function loadEntitlement() {
      setLoadingEntitlement(true);
      setError("");

      try {
        const res = await fetch("/api/wealth-builder/entitlement");
        const data: EntitlementResponse = await res.json();

        if (res.status === 401 || data?.message === "Authentication required.") {
          setIsAuthenticated(false);
          setIsPremium(false);
          setEntitlementStatus("inactive");
          return;
        }

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Failed to load entitlement.");
        }

        setIsAuthenticated(true);
        setIsPremium(Boolean(data.entitlement?.isPremium));
        setEntitlementStatus(data.entitlement?.status || "inactive");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load entitlement.";
        setError(message);
      } finally {
        setLoadingEntitlement(false);
      }
    }

    void loadEntitlement();
  }, []);

  useEffect(() => {
    if (checkoutState === "success") {
      setInfoMessage(
        "Payment completed. We are verifying and activating your Wealth Builder Premium access now.",
      );
    } else if (checkoutState === "cancel") {
      setInfoMessage("Checkout was canceled. No payment was completed.");
    } else {
      setInfoMessage("");
    }
  }, [checkoutState]);

  async function startCheckout(plan: CheckoutPlan) {
    setLoadingPlan(plan);
    setError("");
    setInfoMessage("");

    try {
      const itemId =
        plan === "annual"
          ? "wealth-builder-premium-annual"
          : "wealth-builder-premium-monthly";

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "plan",
          itemId,
        }),
      });

      const data: CheckoutResponse = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to start checkout.");
      }

      window.location.href = data.url;
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
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
                  Upgrade
                </p>
                <h1 className="mt-3 text-4xl font-bold">
                  Unlock Wealth Builder Premium
                </h1>
                <p className="mt-4 max-w-3xl text-zinc-300">
                  Upgrade to expand savings goals, unlock insights, and use richer
                  planning tools over time.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm">
                Current Plan:{" "}
                <span className="font-semibold text-yellow-300">
                  {loadingEntitlement
                    ? "Checking..."
                    : isPremium
                      ? "Premium"
                      : "Free"}
                </span>
              </div>
            </div>

            {infoMessage ? (
              <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
                {infoMessage}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {!loadingEntitlement && !isAuthenticated ? (
              <div className="mt-6 rounded-2xl border border-yellow-700/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                You need to log in with a personal user account before upgrading
                Wealth Builder.
              </div>
            ) : null}

            {!loadingEntitlement && isPremium ? (
              <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100">
                Wealth Builder Premium is already active on this account
                {entitlementStatus ? ` (${entitlementStatus})` : ""}.
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
                <h2 className="text-2xl font-semibold text-yellow-300">
                  Premium
                </h2>
                <p className="mt-3 text-3xl font-bold">$8.99/month</p>
                <p className="mt-1 text-sm text-zinc-400">$79/year</p>

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
                    disabled={
                      loadingPlan !== null ||
                      loadingEntitlement ||
                      !isAuthenticated ||
                      isPremium
                    }
                    className="rounded-2xl border border-yellow-400 bg-yellow-500/15 px-5 py-4 text-left font-semibold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="text-sm uppercase tracking-wide text-yellow-200">
                      Monthly
                    </div>
                    <div className="mt-2 text-xl">$8.99</div>
                    <div className="mt-1 text-sm text-zinc-300">
                      {loadingPlan === "monthly"
                        ? "Starting checkout..."
                        : "Upgrade monthly"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void startCheckout("annual")}
                    disabled={
                      loadingPlan !== null ||
                      loadingEntitlement ||
                      !isAuthenticated ||
                      isPremium
                    }
                    className="rounded-2xl border border-yellow-400 bg-yellow-500/15 px-5 py-4 text-left font-semibold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="text-sm uppercase tracking-wide text-yellow-200">
                      Annual
                    </div>
                    <div className="mt-2 text-xl">$79</div>
                    <div className="mt-1 text-sm text-zinc-300">
                      {loadingPlan === "annual"
                        ? "Starting checkout..."
                        : "Upgrade annually"}
                    </div>
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
                  Premium purchases use your existing Black Wealth Exchange checkout
                  flow and stay tied to the logged-in user account.
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/wealth-builder/dashboard"
                className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Back to Dashboard
              </Link>

              <Link
                href="/wealth-builder/insights"
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25"
              >
                View Insights
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}