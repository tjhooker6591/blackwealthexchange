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

function buildQuery(filters: TravelMapFilterValues, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.city) params.set("city", filters.city);
  if (filters.state) params.set("state", filters.state);
  if (filters.category) params.set("category", filters.category);
  if (filters.verified) params.set("verified", "true");
  if (filters.sponsored) params.set("sponsored", "true");
  params.set("page", String(page));
  params.set("pageSize", "12");
  return params.toString();
}

export default function TravelMapExplorePage() {
  const [filters, setFilters] = useState<TravelMapFilterValues>(initialFilters);
  const [results, setResults] = useState<TravelMapBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"split" | "list">("split");
  const [mode, setMode] = useState<"search" | "nearby">("search");
  const [dataSource, setDataSource] = useState<"db" | "fallback" | "nearby">(
    "db",
  );

  const queryString = useMemo(() => buildQuery(filters, page), [filters, page]);

  useEffect(() => {
    if (mode !== "search") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/travel-map/search?${queryString}`);
        const data = (await res.json()) as
          | TravelMapSearchResponse
          | { ok: false; error: string };

        if (!res.ok || !data.ok) {
          throw new Error(
            "error" in data ? data.error : "Failed to load map results",
          );
        }

        if (!cancelled) {
          setResults(data.results);
          setTotal(data.total);
          setPageSize(data.pageSize);
          setDataSource(data.meta?.source || "db");
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

    void load();

    return () => {
      cancelled = true;
    };
  }, [queryString, mode]);

  async function runNearbySearch() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device/browser.");
      return;
    }

    setLocating(true);
    setError("");
    setMode("nearby");
    setPage(1);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const res = await fetch(
            `/api/travel-map/nearby?lat=${lat}&lng=${lng}&radiusKm=40&limit=50`,
          );
          const data = await res.json();

          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || "Failed to load nearby results.");
          }

          let nearbyResults: TravelMapBusiness[] = Array.isArray(data.results)
            ? data.results
            : [];

          if (filters.category) {
            const term = filters.category.toLowerCase();
            nearbyResults = nearbyResults.filter((item) =>
              `${item.category || ""} ${item.subcategory || ""}`
                .toLowerCase()
                .includes(term),
            );
          }

          if (filters.verified) {
            nearbyResults = nearbyResults.filter((item) => item.verified);
          }

          if (filters.sponsored) {
            nearbyResults = nearbyResults.filter((item) => item.sponsored);
          }

          setResults(nearbyResults);
          setTotal(nearbyResults.length);
          setPageSize(nearbyResults.length || 12);
          setDataSource("nearby");
        } catch (err: any) {
          setError(err?.message || "Failed to load nearby businesses.");
          setResults([]);
          setTotal(0);
        } finally {
          setLocating(false);
          setLoading(false);
        }
      },
      (geoError) => {
        setLocating(false);
        setLoading(false);
        setMode("search");
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            "Location access was denied. Enable location permissions to use Near Me.",
          );
        } else {
          setError("Unable to get your location right now.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
              <p className="mt-2 text-sm text-gray-400">
                {mode === "nearby"
                  ? "Near Me mode active · based on your current location"
                  : "Search mode active · city/state/category filters"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Data source: {dataSource === "db" ? "Live business data" : dataSource === "nearby" ? "Nearby search" : "Fallback sample data"}
              </p>
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

          <TravelMapFilters
            initialValues={filters}
            onApply={(next) => {
              setFilters(next);
              setPage(1);
              setMode("search");
            }}
            onUseMyLocation={() => void runNearbySearch()}
            locating={locating}
          />

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
              view === "split" ? "xl:grid-cols-[1.05fr_0.95fr]" : "grid-cols-1"
            }`}
          >
            <div className="space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                  Loading map results...
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                  No businesses matched your filters. Try clearing filters or
                  running Near Me.
                </div>
              ) : (
                results.map((business) => (
                  <TravelMapCard key={business._id} business={business} />
                ))
              )}

              {mode === "search" && totalPages > 1 ? (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>

            {view === "split" ? <TravelMapCanvas results={results} /> : null}
          </div>
        </section>
      </div>
    </>
  );
}
