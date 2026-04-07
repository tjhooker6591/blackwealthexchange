import Head from "next/head";
import Link from "next/link";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";
import SummaryCard from "@/components/wealth-builder/SummaryCard";

export default function WealthBuilderDashboardPage() {
  return (
    <>
      <Head>
        <title>Wealth Builder Dashboard | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Wealth Builder dashboard shell for income, debt, savings, goals, and budget status."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold">Your financial snapshot</h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              This dashboard is a production-safe shell with placeholder values. It gives us a clean structure
              for wiring real financial profile, debt, budget, savings, and goal data next.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                title="Monthly Income"
                value="$0"
                description="Placeholder until profile and income logic is connected."
              />
              <SummaryCard
                title="Total Debt"
                value="$0"
                description="Will aggregate balances from financial_debts."
              />
              <SummaryCard
                title="Total Savings"
                value="$0"
                description="Will aggregate savings goals and later savings-linked data."
              />
              <SummaryCard
                title="Active Goals"
                value="0"
                description="Will show active savings goals."
              />
              <SummaryCard
                title="Budget Status"
                value="Not Set"
                description="Will show current month budget state once budget routes are added."
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/wealth-builder/debt"
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-500/25"
              >
                Add Debt
              </Link>
              <Link
                href="/wealth-builder/budget"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-yellow-400 hover:text-yellow-300"
              >
                Create Budget
              </Link>
              <Link
                href="/wealth-builder/savings"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-yellow-400 hover:text-yellow-300"
              >
                Add Savings Goal
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
