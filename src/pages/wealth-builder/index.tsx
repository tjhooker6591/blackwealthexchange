import Head from "next/head";
import Link from "next/link";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function WealthBuilderIndexPage() {
  return (
    <>
      <Head>
        <title>Wealth Builder Dashboard | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "A premium money command center to track spending, debt, savings, budgets, recurring bills, and net worth.",
          )}
        />
        <meta
          property="og:title"
          content="Wealth Builder Dashboard | Black Wealth Exchange"
        />
        <meta
          property="og:description"
          content={truncateMeta(
            "Track transactions, budgets, debt, savings, and net worth in one premium Wealth Builder command center.",
          )}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl("/wealth-builder")} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Wealth Builder Dashboard | Black Wealth Exchange"
        />
        <meta
          name="twitter:description"
          content={truncateMeta(
            "Track transactions, budgets, debt, savings, and net worth in one premium Wealth Builder command center.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/wealth-builder")} />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Wealth Builder
            </p>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
              Your premium financial command center for cash flow, debt payoff,
              and wealth growth.
            </h1>
            <p className="mt-5 max-w-3xl text-base text-zinc-300 md:text-lg">
              Wealth Builder connects transactions, budgets, debt, savings
              goals, recurring bills, and net worth into one clean dashboard so
              users always know what to do next.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login?redirect=/wealth-builder/dashboard"
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25"
              >
                Log in to access Wealth Builder
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Create account
              </Link>
            </div>
          </section>

          <section className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              {
                title: "Spending Intelligence",
                text: "Categorize transactions, track monthly outflow, and detect recurring bill patterns.",
              },
              {
                title: "Budget Control",
                text: "Monitor budget vs actual in one place and instantly see safe-to-spend room.",
              },
              {
                title: "Debt Payoff",
                text: "Track balances, APR, minimums, and prioritize the most expensive debt first.",
              },
              {
                title: "Savings + Net Worth",
                text: "Grow emergency savings and keep a live pulse on total net worth progress.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6"
              >
                <h2 className="text-xl font-semibold text-yellow-300">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  {item.text}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-950/70 p-6">
            <h2 className="text-xl font-semibold text-white">
              Free vs Premium
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-zinc-300">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="font-semibold text-white">Free</p>
                <p className="mt-2">
                  Dashboard, transaction tracking, debt + savings records, and
                  current-month budget visibility.
                </p>
              </div>
              <div className="rounded-xl border border-yellow-700/40 bg-yellow-500/5 p-4">
                <p className="font-semibold text-yellow-200">Premium</p>
                <p className="mt-2">
                  Advanced insights, stronger recommendation engine, and deeper
                  planning controls across months.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
