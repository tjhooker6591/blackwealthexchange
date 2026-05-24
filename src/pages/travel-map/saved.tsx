import Head from "next/head";
import { useEffect, useState } from "react";
import TravelMapNav from "@/components/travel-map/TravelMapNav";
import TravelMapCard from "@/components/travel-map/TravelMapCard";
import type { TravelMapBusiness } from "@/types/travel-map";

type SavedItem = {
  id: string;
  businessId: string;
  createdAt: string | null;
  business: TravelMapBusiness;
};

export default function TravelMapSavedPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadSaved() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/travel-map/saved");
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to load saved places.");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load saved places.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeSaved(itemId: string) {
    setRemovingId(itemId);
    setError("");

    try {
      const res = await fetch(`/api/travel-map/saved/${itemId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || "Failed to remove saved place.");
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove saved place.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  useEffect(() => {
    void loadSaved();
  }, []);

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
              Your saved Travel Map businesses tied to your personal profile.
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-8 space-y-5">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                  Loading saved places...
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                  No saved places yet.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <TravelMapCard
                      business={item.business}
                      enableSave={false}
                    />
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-300">
                      <span>
                        Saved{" "}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString("en-US")
                          : "recently"}
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeSaved(item.id)}
                        disabled={removingId === item.id}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingId === item.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
