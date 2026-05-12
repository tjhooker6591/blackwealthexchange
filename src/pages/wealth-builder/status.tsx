import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";
import { requireWealthBuilderPageUser } from "@/lib/wealth-builder/page-auth";

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

  const nextBestAction = data
    ? data.summary.transactionCount === 0
      ? {
          label: "Add your first transaction",
          href: "/wealth-builder/transactions",
          reason:
            "No transactions logged yet, so insights cannot reflect real cash flow.",
        }
      : data.summary.budgetCount === 0
        ? {
            label: "Create your monthly budget",
            href: "/wealth-builder/budget",
            reason:
              "No budget plan found, so spending drift is harder to catch early.",
          }
        : data.summary.debtCount === 0 && data.summary.goalCount === 0
          ? {
              label: "Add debt and savings targets",
              href: "/wealth-builder/debt",
              reason:
                "Debt and savings records are missing, so payoff and growth guidance is incomplete.",
            }
          : {
              label: "Review premium insights",
              href: "/wealth-builder/insights",
              reason:
                "Core records are in place — next step is performance insights and optimization.",
            }
    : null;

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
        <link
          rel="canonical"
          href="https://blackwealthexchange.co/wealth-builder/status"
        />
        <meta property="og:title" content="Status | Wealth Builder" />
        <meta
          property="og:description"
          content="Verify Wealth Builder plan status, recent payments, and next best actions."
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

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
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

                {nextBestAction ? (
                  <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                      Next best action
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {nextBestAction.label}
                    </h2>
                    <p className="mt-2 text-sm text-emerald-100/90">
                      {nextBestAction.reason}
                    </p>
                    <Link
                      href={nextBestAction.href}
                      className="mt-4 inline-flex rounded-full border border-emerald-300/50 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/10"
                    >
                      Do this now
                    </Link>
                  </div>
                ) : null}

                <div className="mt-8 rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-6">
                  <h2 className="text-xl font-semibold text-cyan-100">
                    Recommended next actions
                  </h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Link
                      href="/wealth-builder/transactions"
                      className="rounded-xl border border-white/10 bg-black/30 p-4 hover:border-cyan-300/40"
                    >
                      <p className="text-sm font-semibold text-white">
                        1) Keep transactions current
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {data.summary.transactionCount > 0
                          ? `${data.summary.transactionCount} recorded transaction${data.summary.transactionCount === 1 ? "" : "s"}`
                          : "No transactions yet — start here."}
                      </p>
                    </Link>
                    <Link
                      href="/wealth-builder/budget"
                      className="rounded-xl border border-white/10 bg-black/30 p-4 hover:border-cyan-300/40"
                    >
                      <p className="text-sm font-semibold text-white">
                        2) Align budget to real spend
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {data.summary.budgetCount > 0
                          ? `${data.summary.budgetCount} budget plan${data.summary.budgetCount === 1 ? "" : "s"} found`
                          : "No budget plan found — add your monthly plan."}
                      </p>
                    </Link>
                    <Link
                      href="/wealth-builder/debt"
                      className="rounded-xl border border-white/10 bg-black/30 p-4 hover:border-cyan-300/40"
                    >
                      <p className="text-sm font-semibold text-white">
                        3) Improve debt + savings pace
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {data.summary.debtCount > 0 ||
                        data.summary.goalCount > 0
                          ? `Debt records: ${data.summary.debtCount}, savings goals: ${data.summary.goalCount}`
                          : "No debt/savings records yet — add both to unlock guidance."}
                      </p>
                    </Link>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireWealthBuilderPageUser(context, "/wealth-builder/status");
};
