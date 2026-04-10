import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const STATES = ["CA", "TX", "GA", "FL", "NY", "NC", "IL", "MD"];

export default function BlackOwnedBusinessesHub() {
  const canonical = canonicalUrl("/black-owned-businesses");
  const title = "Black-owned Businesses by State | Black Wealth Exchange";
  const description = truncateMeta(
    "Browse Black-owned businesses by state and jump into city/category discovery through the Black Wealth Exchange directory.",
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-extrabold">Black-owned businesses by state</h1>
          <p className="mt-3 text-zinc-300">
            Start with a state landing and jump directly into verified directory discovery.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATES.map((state) => (
              <Link
                key={state}
                href={`/black-owned-businesses/${state.toLowerCase()}`}
                className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm font-semibold hover:border-yellow-400/40"
              >
                Black-owned businesses in {state}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
