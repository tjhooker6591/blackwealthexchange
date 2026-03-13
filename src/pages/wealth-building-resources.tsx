import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function WealthBuildingResources() {
  const title = "Wealth-Building Resources | Black Wealth Exchange";
  const description = truncateMeta(
    "Explore practical wealth-building resources, financial education pathways, and economic empowerment tools.",
  );
  const canonical = canonicalUrl("/wealth-building-resources");

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">
            Wealth-building resources
          </h1>
          <p className="mt-2 text-white/80">
            A focused path to help users move from learning to action across
            income, ownership, and investment decisions.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-4">
          <Link
            href="/financial-literacy"
            className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
          >
            <h2 className="font-bold">Financial literacy program</h2>
            <p className="text-sm text-white/70 mt-1">
              Budgeting, debt strategy, and investment foundations.
            </p>
          </Link>
          <Link
            href="/courses/generational-wealth"
            className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
          >
            <h2 className="font-bold">Generational wealth course</h2>
            <p className="text-sm text-white/70 mt-1">
              Build durable systems for long-term family wealth.
            </p>
          </Link>
          <Link
            href="/business-directory"
            className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
          >
            <h2 className="font-bold">Support Black-owned businesses</h2>
            <p className="text-sm text-white/70 mt-1">
              Circulate dollars in local Black-owned ecosystems.
            </p>
          </Link>
          <Link
            href="/marketplace"
            className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
          >
            <h2 className="font-bold">Shop Black-owned products</h2>
            <p className="text-sm text-white/70 mt-1">
              Purchase from brands aligned with economic empowerment.
            </p>
          </Link>
        </section>
      </div>
    </div>
  );
}
