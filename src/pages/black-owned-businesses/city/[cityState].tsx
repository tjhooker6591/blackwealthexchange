import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

function pretty(input: string) {
  return input
    .split("-")
    .filter(Boolean)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

export default function CityDirectoryLanding() {
  const router = useRouter();
  const cityState =
    typeof router.query.cityState === "string"
      ? router.query.cityState.toLowerCase()
      : "";

  const [cityRaw, stateRaw] = cityState.split("-").reduce(
    (acc, cur, idx, arr) => {
      if (idx < arr.length - 1) acc[0].push(cur);
      else acc[1] = cur;
      return acc;
    },
    [[], ""] as [string[], string],
  );

  const city = cityRaw.join("-");
  const state = stateRaw.slice(0, 2);
  const isValidCityState =
    /^[a-z0-9-]{2,80}$/.test(cityState) && /^[a-z]{2}$/.test(state);
  const cityLabel = pretty(city || "city");
  const stateLabel = state.toUpperCase() || "US";

  const canonical = canonicalUrl(`/black-owned-businesses/city/${cityState}`);
  const title = `Black-owned businesses in ${cityLabel}, ${stateLabel}`;
  const description = truncateMeta(
    `Explore Black-owned businesses in ${cityLabel}, ${stateLabel} by category and trust signals.`,
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        {!isValidCityState && <meta name="robots" content="noindex,follow" />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: title,
              description,
              url: canonical,
            }),
          }}
        />
      </Head>
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
            City landing
          </p>
          <h1 className="mt-3 text-4xl font-extrabold">
            Black-owned businesses in {cityLabel}, {stateLabel}
          </h1>
          <p className="mt-4 text-zinc-300">
            Jump into local directory and map exploration with this city-level
            entry point.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/business-directory?search=${encodeURIComponent(`${cityLabel} ${stateLabel}`)}`}
              className="rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black"
            >
              Open local directory search
            </Link>
            <Link
              href={`/travel-map/explore?city=${encodeURIComponent(cityLabel)}&state=${encodeURIComponent(stateLabel)}`}
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
