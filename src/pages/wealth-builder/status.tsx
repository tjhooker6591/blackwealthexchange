import Head from "next/head";
import { useEffect, useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

type StatusResponse = {
  ok: boolean;
  status?: {
    userId: string;
    email?: string | null;
    entitlement: {
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
    summary: {
      debtCount: number;
      goalCount: number;
      activeGoalCount: number;
      budgetCount: number;
      transactionCount: number;
      wealthBuilderPaymentCount: number;
      lastWealthBuilderPaymentStatus: string | null;
      lastWealthBuilderPaymentAt: string | null;
    };
    recentWealthBuilderPayments: Array<{
      stripeSessionId: string | null;
      itemId: string | null;
      productKey: string | null;
      billingInterval: string | null;
      status: string | null;
      amountCents: number | null;
      createdAt: string | null;
      paidAt: string | null;
    }>;
  };
  message?: string;
};

function formatCurrency(cents: number | null) {
  const dollars = typeof cents === "number" ? cents / 100 : 0;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US");
}

export default function WealthBuilderStatusPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<StatusResponse["status"] | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/wealth-builder/status");
      const payload: StatusResponse = await response.json();

      if (!response.ok || !payload.ok || !payload.status) {
        throw new Error(
          payload.message || "Failed to load Wealth Builder status.",
        );
      }

      setData(payload.status);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load Wealth Builder status.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  return (
    <>
      <Head>
        <title>Status | Wealth Builder</title>
        <meta
          name="description"
          content="Verification view for Wealth Builder entitlement and finance status."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
                  Verification
                </p>
                <h1 className="mt-3 text-4xl font-bold">
                  Wealth Builder status
                </h1>
                <p className="mt-4 max-w-3xl text-zinc-300">
                  Use this page to verify the logged-in user entitlement, recent
                  Wealth Builder payments, and core finance-module counts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadStatus()}
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25"
              >
                Refresh Status
              </button>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-8 rounded-2xl border border-dashed border-yellow-700/40 bg-black/30 p-6 text-sm text-zinc-300">
                Loading Wealth Builder status...
              </div>
            ) : data ? (
              <>
                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-sm uppercase tracking-wide text-zinc-400">
                      Plan
                    </p>
                    <p className="mt-3 text-2xl font-bold text-yellow-300">
                      {data.entitlement.isPremium ? "Premium" : "Free"}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Status: {data.entitlement.status}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-sm uppercase tracking-wide text-zinc-400">
                      Savings Goals
                    </p>
                    <p className="mt-3 text-2xl font-bold text-yellow-300">
                      {data.summary.goalCount}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Active: {data.summary.activeGoalCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-sm uppercase tracking-wide text-zinc-400">
                      Debt Records
                    </p>
                    <p className="mt-3 text-2xl font-bold text-yellow-300">
                      {data.summary.debtCount}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Budgets: {data.summary.budgetCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-sm uppercase tracking-wide text-zinc-400">
                      Transactions
                    </p>
                    <p className="mt-3 text-2xl font-bold text-yellow-300">
                      {data.summary.transactionCount}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      WB payments: {data.summary.wealthBuilderPaymentCount}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2)">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                    <h2 className="text-xl font-semibold text-white">
                      Entitlement details
                    </h2>
                    <div className="mt-4 space-y-3 text-sm text-zinc-300">
                      <p>
                        <span className="font-semibold text-white">
                          User ID:
                        </span>{" "}
                        {data.userId}
                      </p>
                      <p>
                        <span className="font-semibold text-white">Email:</span>{" "}
                        {data.email || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Product Key:
                        </span>{" "}
                        {data.entitlement.productKey}
                      </p>
                      <p>
                        <span className="font-semibold text-white">Tier:</span>{" "}
                        {data.entitlement.tier}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Status:
                        </span>{" "}
                        {data.entitlement.status}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Savings Goal Limit:
                        </span>{" "}
                        {data.entitlement.limits.maxSavingsGoals === null
                          ? "Unlimited"
                          : data.entitlement.limits.maxSavingsGoals}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Current Month Budget Only:
                        </span>{" "}
                        {data.entitlement.limits.currentMonthBudgetOnly
                          ? "Yes"
                          : "No"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Insights Enabled:
                        </span>{" "}
                        {data.entitlement.limits.insightsEnabled ? "Yes" : "No"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Budget History Enabled:
                        </span>{" "}
                        {data.entitlement.limits.budgetHistoryEnabled
                          ? "Yes"
                          : "No"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                    <h2 className="text-xl font-semibold text-white">
                      Latest payment signal
                    </h2>
                    <div className="mt-4 space-y-3 text-sm text-zinc-300">
                      <p>
                        <span className="font-semibold text-white">
                          Last payment status:
                        </span>{" "}
                        {data.summary.lastWealthBuilderPaymentStatus || "—"}
                      </p>
                      <p>
                        <span className="font-semibold text-white">
                          Last payment time:
                        </span>{" "}
                        {formatDate(data.summary.lastWealthBuilderPaymentAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
                  <h2 className="text-xl font-semibold text-white">
                    Recent Wealth Builder payments
                  </h2>

                  {data.recentWealthBuilderPayments.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-yellow-700/40 bg-black/20 p-5 text-sm text-zinc-300">
                      No Wealth Builder payment records found for this user yet.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {data.recentWealthBuilderPayments.map(
                        (payment, index) => (
                          <div
                            key={`${payment.stripeSessionId || "payment"}-${index}`}
                            className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5"
                          >
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm text-zinc-300">
                              <p>
                                <span className="font-semibold text-white">
                                  Item:
                                </span>{" "}
                                {payment.itemId || "—"}
                              </p>
                              <p>
                                <span className="font-semibold text-white">
                                  Product:
                                </span>{" "}
                                {payment.productKey || "—"}
                              </p>
                              <p>
                                <span className="font-semibold text-white">
                                  Interval:
                                </span>{" "}
                                {payment.billingInterval || "—"}
                              </p>
                              <p>
                                <span className="font-semibold text-white">
                                  Status:
                                </span>{" "}
                                {payment.status || "—"}
                              </p>
                              <p>
                                <span className="font-semibold text-white">
                                  Amount:
                                </span>{" "}
                                {formatCurrency(payment.amountCents)}
                              </p>
                              <p>
                                <span className="font-semibold text-white">
                                  Created:
                                </span>{" "}
                                {formatDate(payment.createdAt)}
                              </p>
                              <p>
                                <span className="font-semibold text-white">
                                  Paid:
                                </span>{" "}
                                {formatDate(payment.paidAt)}
                              </p>
                              <p className="break-all">
                                <span className="font-semibold text-white">
                                  Session:
                                </span>{" "}
                                {payment.stripeSessionId || "—"}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
