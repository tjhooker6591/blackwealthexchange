import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const STATE_NAME: Record<string, string> = {
  ca: "California",
  tx: "Texas",
  ga: "Georgia",
  fl: "Florida",
  ny: "New York",
  nc: "North Carolina",
  il: "Illinois",
  md: "Maryland",
};

export default function StateDirectoryLanding() {
  const router = useRouter();
  const stateRaw =
    typeof router.query.state === "string"
      ? router.query.state.toLowerCase()
      : "";
  const state = stateRaw.slice(0, 2);
  const stateName = STATE_NAME[state] || state.toUpperCase() || "this state";

  const canonical = canonicalUrl(`/black-owned-businesses/${state}`);
  const title = `Black-owned businesses in ${stateName} | Black Wealth Exchange`;
  const description = truncateMeta(
    `Discover Black-owned businesses in ${stateName}. Search by category and city using the Black Wealth Exchange directory.`,
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
            State landing
          </p>
          <h1 className="mt-3 text-4xl font-extrabold">
            Black-owned businesses in {stateName}
          </h1>
          <p className="mt-4 text-zinc-300">
            Use this state entry point to find Black-owned businesses by
            category, city, and trust signals.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/business-directory?state=${encodeURIComponent(state.toUpperCase())}`}
              className="rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black"
            >
              Open directory in {state.toUpperCase() || "state"}
            </Link>
            <Link
              href="/travel-map/explore"
              className="rounded-xl border border-white/15 px-4 py-2 font-semibold text-white"
            >
              Explore on Travel Map
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
