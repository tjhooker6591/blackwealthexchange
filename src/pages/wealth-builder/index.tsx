import Head from "next/head";
import Link from "next/link";
import WealthBuilderNav from "@/components/wealth-builder/WealthBuilderNav";

export default function WealthBuilderIndexPage() {
  return (
    <>
      <Head>
        <title>Wealth Builder | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Track debt, build budgets, grow savings, and create a stronger financial future."
        />
      </Head>

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <WealthBuilderNav />

          <section className="rounded-3xl border border-yellow-700/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Wealth Builder
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Build financial clarity with a focused tool for debt, budgeting, and savings.
            </h1>
            <p className="mt-5 max-w-3xl text-base text-zinc-300 md:text-lg">
              This is the starting foundation for the Wealth Builder experience inside Black Wealth Exchange.
              It is designed to help users organize debt, track money, and move toward stronger savings habits.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/wealth-builder/dashboard"
                className="rounded-full border border-yellow-400 bg-yellow-500/15 px-5 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/25"
              >
                Open Dashboard
              </Link>
              <Link
                href="/wealth-builder/debt"
                className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-300"
              >
                Start with Debt
              </Link>
            </div>
          </section>

          <section className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Debt Clarity",
                text: "Track balances, interest rates, lenders, and minimum payments in one place.",
              },
              {
                title: "Budget Planning",
                text: "Create monthly budget targets and structure spending categories for real visibility.",
              },
              {
                title: "Savings Goals",
                text: "Set target amounts, track progress, and keep the focus on long-term growth.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6"
              >
                <h2 className="text-xl font-semibold text-yellow-300">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{item.text}</p>
              </div>
            ))}
          </section>

          <section className="mt-10 rounded-2xl border border-dashed border-yellow-700/40 bg-zinc-950/60 p-6">
            <h2 className="text-xl font-semibold text-white">Current Build Status</h2>
            <p className="mt-3 text-sm text-zinc-300">
              Placeholder shell is in place so the app can build cleanly while the real data flow,
              dashboard calculations, and CRUD behavior are implemented next.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
