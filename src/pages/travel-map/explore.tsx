import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import TravelMapCard from "@/components/travel-map/TravelMapCard";
import TravelMapCanvas from "@/components/travel-map/TravelMapCanvas";
import TravelMapFilters, {
  type TravelMapFilterValues,
} from "@/components/travel-map/TravelMapFilters";
import type {
  TravelMapBusiness,
  TravelMapSearchResponse,
} from "@/types/travel-map";

const initialFilters: TravelMapFilterValues = {
  q: "",
  city: "",
  state: "",
  category: "",
  verified: false,
  sponsored: false,
};

function buildQuery(filters: TravelMapFilterValues) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.city) params.set("city", filters.city);
  if (filters.state) params.set("state", filters.state);
  if (filters.category) params.set("category", filters.category);
  if (filters.verified) params.set("verified", "true");
  if (filters.sponsored) params.set("sponsored", "true");
  params.set("page", "1");
  params.set("pageSize", "12");
  return params.toString();
}

export default function TravelMapExplorePage() {
  const [filters, setFilters] =
    useState<TravelMapFilterValues>(initialFilters);
  const [results, setResults] = useState<TravelMapBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"split" | "list">("split");

  const queryString = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/travel-map/search?${queryString}`);
        const data =
          (await res.json()) as
            | TravelMapSearchResponse
            | { ok: false; error: string };

        if (!res.ok || !data.ok) {
          throw new Error("error" in data ? data.error : "Failed to load map results");
        }

        if (!cancelled) {
          setResults(data.results);
          setTotal(data.total);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load results");
          setResults([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  return (
    <>
      <Head>
        <title>Explore Travel Map | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Search and explore Black-owned businesses while traveling with the BWE Travel Map."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
                Travel Map
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Explore Black-owned businesses on the move.
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setView("split")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  view === "split"
                    ? "bg-yellow-500 text-black"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  view === "list"
                    ? "bg-yellow-500 text-black"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                List Only
              </button>
            </div>
          </div>

          <TravelMapFilters initialValues={filters} onApply={setFilters} />

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-300">
            {loading ? "Loading results..." : `${total} businesses found`}
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div
            className={`mt-6 grid gap-6 ${
              view === "split"
                ? "xl:grid-cols-[1.05fr_0.95fr]"
                : "grid-cols-1"
            }`}
          >
            <div className="space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                  Loading map results...
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                  No businesses matched your filters yet.
                </div>
              ) : (
                results.map((business) => (
                  <TravelMapCard key={business._id} business={business} />
                ))
              )}
            </div>

            {view === "split" ? <TravelMapCanvas results={results} /> : null}
          </div>
        </section>
      </div>
    </>
  );
}
