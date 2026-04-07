import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

type EntitlementResponse = {
  ok: boolean;
  entitlement?: {
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

type InsightsResponse = {
  ok: boolean;
  insights?: Array<{ type: string; title: string; message: string }>;
  code?: string;
  message?: string;
};

export default function WealthBuilderInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entitlement, setEntitlement] = useState<EntitlementResponse["entitlement"]>();
  const [insights, setInsights] = useState<Array<{ type: string; title: string; message: string }>>([]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const entitlementRes = await fetch("/api/wealth-builder/entitlement");
      const entitlementData: EntitlementResponse = await entitlementRes.json();

      if (!entitlementRes.ok || !entitlementData.ok) {
        throw new Error(entitlementData.message || "Failed to load entitlement.");
      }

      setEntitlement(entitlementData.entitlement);

      if (!entitlementData.entitlement?.isPremium) {
        setInsights([]);
        return;
      }

      const insightsRes = await fetch("/api/wealth-builder/insights");
      const insightsData: InsightsResponse = await insightsRes.json();

      if (!insightsRes.ok || !insightsData.ok) {
        throw new Error(insightsData.message || "Failed to load insights.");
      }

      setInsights(Array.isArray(insightsData.insights) ? insightsData.insights : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load insights.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <>
      <Head>
        <title>Insights | Wealth Builder</title>
        <meta
          name="description"
          content="Premium insights for Wealth Builder."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
                  Insights
                </p>
                <h1 className="mt-3 text-4xl font-bold">Wealth Builder insights</h1>
                <p className="mt-4 max-w-3xl text-zinc-300">
                  Insights help turn tracked personal finance data into next-step guidance.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm">
                Plan:{" "}
                <span className="font-semibold text-yellow-300">
                  {entitlement?.isPremium ? "Premium" : "Free"}
                </span>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-8 rounded-2xl border border-dashed border-yellow-700/40 bg-black/30 p-6 text-sm text-zinc-300">
                Loading insights...
              </div>
            ) : entitlement?.isPremium ? (
              insights.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-yellow-700/40 bg-black/30 p-6 text-sm text-zinc-300">
                  No insights available yet. Add more financial data to generate richer results.
                </div>
              ) : (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {insights.map((item, index) => (
                    <div
                      key={`${item.type}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/30 p-5"
                    >
                      <p className="text-sm font-semibold uppercase tracking-wide text-yellow-400">
                        {item.type}
                      </p>
                      <h2 className="mt-3 text-xl font-semibold text-white">
                        {item.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="mt-8 rounded-2xl border border-yellow-700/40 bg-yellow-500/10 p-6">
                <h2 className="text-2xl font-semibold text-yellow-300">
                  Premium feature
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-200">
                  Wealth Builder Insights are available on Premium and are designed to surface spending,
                  debt, savings, and cash-flow guidance from your tracked data.
                </p>
                <div className="mt-6">
                  <Link
                    href="/wealth-builder/upgrade"
                    className="inline-flex rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25"
                  >
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
