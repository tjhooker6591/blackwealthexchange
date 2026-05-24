import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import { requireWealthBuilderPageUser } from "@/lib/wealth-builder/page-auth";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";
import SummaryCard from "@/components/wealth-builder/SummaryCard";

type DashboardResponse = {
  ok: boolean;
  dashboard?: {
    summary?: {
      monthlyIncome?: number;
      totalDebt?: number;
      totalSavings?: number;
      activeGoals?: number;
      budgetStatus?: string;
      monthIncome?: number;
      monthExpenses?: number;
      totalCash?: number;
      netWorth?: number;
      safeToSpend?: number;
      healthScore?: number;
      recurringBillsCount?: number;
      monthlySurplus?: number;
      cashflowHealth?: "surplus" | "breakeven" | "deficit";
      estimatedDebtFreeMonths?: number | null;
      emergencyFundTarget?: number;
      emergencyFundCoverageMonths?: number;
      emergencyFundProgress?: number;
    };
    categorySpending?: Array<{ category: string; amount: number }>;
    recurringBills?: Array<{
      merchant: string;
      avgAmount: number;
      nextEstimatedDate: string | null;
    }>;
    alerts?: string[];
    recommendations?: string[];
    nextActions?: Array<{
      id: string;
      title: string;
      detail: string;
      href: string;
      priority: "high" | "medium" | "low";
    }>;
    nextActionCount?: number;
    connectedFlow?: Array<{
      id: string;
      label: string;
      href: string;
      status: "active" | "needs_setup";
      metric: string;
      guidance: string;
    }>;
  };
  message?: string;
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonths(value?: number | null) {
  if (!value || value <= 0) return "Not enough data";
  if (value < 12) return `~${value} months`;
  const years = Math.floor(value / 12);
  const months = value % 12;
  return months > 0 ? `~${years}y ${months}m` : `~${years} years`;
}

export default function WealthBuilderDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardResponse["dashboard"] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/wealth-builder/dashboard");
        const raw = await res.text();
        let payload: DashboardResponse | null = null;

        try {
          payload = JSON.parse(raw) as DashboardResponse;
        } catch {
          payload = null;
        }

        if (!res.ok || !payload?.ok || !payload.dashboard?.summary) {
          throw new Error(
            payload?.message ||
              (res.status === 401
                ? "Please sign in with a user account to use Wealth Builder."
                : "Failed to load dashboard."),
          );
        }

        if (!cancelled) {
          setData(payload.dashboard);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard.",
          );
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary;

  const topSpending = useMemo(
    () => (data?.categorySpending || []).slice(0, 5),
    [data?.categorySpending],
  );

  const onboardingItems = [
    {
      label: "Add transactions",
      done: (summary?.monthIncome || 0) + (summary?.monthExpenses || 0) > 0,
      href: "/wealth-builder/transactions",
    },
    {
      label: "Set a monthly budget",
      done:
        (summary?.safeToSpend || 0) > 0 ||
        summary?.budgetStatus === "Configured",
      href: "/wealth-builder/budget",
    },
    {
      label: "Track debt accounts",
      done: (summary?.totalDebt || 0) > 0,
      href: "/wealth-builder/debt",
    },
    {
      label: "Create savings goals",
      done: (summary?.totalSavings || 0) > 0,
      href: "/wealth-builder/savings",
    },
  ];

  return (
    <>
      <Head>
        <title>Wealth Builder Dashboard | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Premium Wealth Builder dashboard for cash flow, net worth, debt, savings, subscriptions, and financial health."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Money Command Center
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              Your complete financial picture
            </h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              One connected view of spending, debts, savings, budgets, recurring
              bills, and progress.
            </p>
            {summary ? (
              <p className="mt-3 text-sm text-zinc-400">
                Cashflow:{" "}
                <span className="font-semibold text-zinc-200">
                  {summary.cashflowHealth || "breakeven"}
                </span>
                {" · "}Next actions:{" "}
                <span className="font-semibold text-zinc-200">
                  {data?.nextActionCount ?? data?.nextActions?.length ?? 0}
                </span>
              </p>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Net Worth"
                value={loading ? "..." : formatCurrency(summary?.netWorth || 0)}
                description="Cash + savings - debt"
              />
              <SummaryCard
                title="Safe to Spend"
                value={
                  loading ? "..." : formatCurrency(summary?.safeToSpend || 0)
                }
                description="Remaining room in your budget"
              />
              <SummaryCard
                title="Total Debt"
                value={
                  loading ? "..." : formatCurrency(summary?.totalDebt || 0)
                }
                description="Active balances"
              />
              <SummaryCard
                title="Total Savings"
                value={
                  loading ? "..." : formatCurrency(summary?.totalSavings || 0)
                }
                description="Across all goals"
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <SummaryCard
                title="Monthly Income"
                value={
                  loading ? "..." : formatCurrency(summary?.monthIncome || 0)
                }
                description="Tracked this month"
              />
              <SummaryCard
                title="Monthly Spending"
                value={
                  loading ? "..." : formatCurrency(summary?.monthExpenses || 0)
                }
                description="Tracked this month"
              />
              <SummaryCard
                title="Financial Health"
                value={loading ? "..." : `${summary?.healthScore || 0}/100`}
                description="Budget, debt, savings weighted score"
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <SummaryCard
                title="Monthly Surplus"
                value={
                  loading ? "..." : formatCurrency(summary?.monthlySurplus || 0)
                }
                description="Income minus spending"
              />
              <SummaryCard
                title="Debt-Free Forecast"
                value={
                  loading
                    ? "..."
                    : formatMonths(summary?.estimatedDebtFreeMonths)
                }
                description="Based on minimums + surplus contribution"
              />
              <SummaryCard
                title="Emergency Coverage"
                value={
                  loading
                    ? "..."
                    : `${(summary?.emergencyFundCoverageMonths || 0).toFixed(1)} months`
                }
                description="Cash runway from current savings"
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <h2 className="text-lg font-semibold text-white">
                  Top spending categories
                </h2>
                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  {loading ? (
                    <p>Loading categories...</p>
                  ) : topSpending.length === 0 ? (
                    <p>No expense categories yet.</p>
                  ) : (
                    topSpending.map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <span>{item.category}</span>
                        <span className="font-semibold text-yellow-300">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <h2 className="text-lg font-semibold text-white">
                  Recurring bills detected
                </h2>
                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  {loading ? (
                    <p>Scanning transactions...</p>
                  ) : (data?.recurringBills || []).length === 0 ? (
                    <p>No recurring bill patterns detected yet.</p>
                  ) : (
                    (data?.recurringBills || []).slice(0, 5).map((item) => (
                      <div
                        key={`${item.merchant}-${item.avgAmount}`}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">
                            {item.merchant}
                          </span>
                          <span className="text-yellow-300">
                            {formatCurrency(item.avgAmount)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          Estimated next charge:{" "}
                          {formatDate(item.nextEstimatedDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-500/25 bg-cyan-500/5 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-200">
                Connected money flow
              </h3>
              <p className="mt-2 text-sm text-zinc-300">
                Keep this chain active: transactions feed budget accuracy,
                budget funds debt strategy, debt payoff unlocks savings
                acceleration.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(data?.connectedFlow || []).map((step) => (
                  <Link
                    key={step.id}
                    href={step.href}
                    className="rounded-xl border border-white/10 bg-black/30 p-4 hover:border-cyan-300/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{step.label}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                          step.status === "active"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-yellow-500/20 text-yellow-200"
                        }`}
                      >
                        {step.status === "active" ? "Active" : "Set up"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-cyan-100">{step.metric}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {step.guidance}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-yellow-600/25 bg-yellow-500/5 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-yellow-300">
                  Alerts
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200">
                  {(data?.alerts || []).length === 0 ? (
                    <li>No urgent alerts.</li>
                  ) : (
                    (data?.alerts || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-600/25 bg-emerald-500/5 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                  Recommendations
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200">
                  {(data?.recommendations || []).length === 0 ? (
                    <li>More activity is needed for recommendations.</li>
                  ) : (
                    (data?.recommendations || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
                Priority action plan
              </h3>
              <div className="mt-3 space-y-3">
                {(data?.nextActions || []).map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="block rounded-xl border border-white/10 bg-black/40 p-3 hover:border-indigo-300/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{action.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                          action.priority === "high"
                            ? "bg-red-500/20 text-red-200"
                            : action.priority === "medium"
                              ? "bg-yellow-500/20 text-yellow-200"
                              : "bg-emerald-500/20 text-emerald-200"
                        }`}
                      >
                        {action.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-300">
                      {action.detail}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                Next steps checklist
              </h3>
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-200">
                  <span>Emergency fund progress</span>
                  <span>
                    {Math.round(summary?.emergencyFundProgress || 0)}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{
                      width: `${Math.round(summary?.emergencyFundProgress || 0)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Target: {formatCurrency(summary?.emergencyFundTarget || 0)}{" "}
                  (about 3 months of expenses)
                </p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {onboardingItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <span>{item.label}</span>
                    <span
                      className={
                        item.done ? "text-emerald-300" : "text-yellow-300"
                      }
                    >
                      {item.done ? "Done" : "Start"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/wealth-builder/transactions"
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/25"
              >
                Track Transactions
              </Link>
              <Link
                href="/wealth-builder/budget"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-yellow-400 hover:text-yellow-300"
              >
                Budget vs Actual
              </Link>
              <Link
                href="/wealth-builder/debt"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-yellow-400 hover:text-yellow-300"
              >
                Debt Payoff Plan
              </Link>
              <Link
                href="/wealth-builder/savings"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-yellow-400 hover:text-yellow-300"
              >
                Savings Goals
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireWealthBuilderPageUser(context, "/wealth-builder/dashboard");
};
