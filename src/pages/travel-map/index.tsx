import Head from "next/head";
import Link from "next/link";

export default function TravelMapLandingPage() {
  return (
    <>
      <Head>
        <title>Travel Map | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Discover Black-owned businesses while traveling with the Black Wealth Exchange Travel Map."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-black to-black p-8 shadow-2xl shadow-black/30 sm:p-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300">
                BWE Travel Map
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Find Black-owned businesses wherever you go.
              </h1>
              <p className="mt-5 text-lg leading-8 text-gray-300">
                Search by city, state, category, and keywords to discover
                Black-owned restaurants, shops, services, and brands while
                traveling.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/travel-map/explore"
                  className="rounded-2xl bg-yellow-500 px-6 py-4 font-semibold text-black transition hover:bg-yellow-400"
                >
                  Explore the Map
                </Link>

                <Link
                  href="/business-directory"
                  className="rounded-2xl border border-yellow-500/30 bg-transparent px-6 py-4 font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
                >
                  Open Directory
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              [
                "Search by city",
                "Look up Atlanta, Houston, Chicago, Detroit, Los Angeles, and more.",
              ],
              [
                "Filter by category",
                "Food, beauty, retail, professional services, culture, and community.",
              ],
              [
                "Get directions only when needed",
                "BWE handles discovery first. Native maps are only for turn-by-turn travel.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-lg font-semibold text-yellow-200">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
