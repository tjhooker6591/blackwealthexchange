import Head from "next/head";
import TravelMapNav from "@/components/travel-map/TravelMapNav";

export default function TravelMapSavedPage() {
  return (
    <>
      <Head>
        <title>Saved Places | Travel Map</title>
      </Head>
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <TravelMapNav />
          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Saved Places
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              Saved Black-owned businesses
            </h1>
            <p className="mt-4 max-w-3xl text-zinc-300">
              Placeholder page for saved places. Auth-backed save/remove
              behavior will be connected later.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
