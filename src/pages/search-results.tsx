import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

type Result = {
  _id: string;
  alias?: string;
  business_name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  category?: string;
  categories?: string | string[];
  status?: string;
  isVerified?: boolean;
  verified?: boolean;
};

function safe(v: unknown) {
  return typeof v === "string" ? v : "";
}

function categoriesLabel(r: Result) {
  if (Array.isArray(r.categories))
    return r.categories.filter(Boolean).join(", ");
  return safe(r.categories) || safe(r.category);
}

function trackFlowEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);
  const url = "/api/flow-events";
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export default function SearchResults() {
  const router = useRouter();
  const search = safe(router.query.search || router.query.q).trim();

  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const suggestedCategories = useMemo(() => {
    const q = search.toLowerCase();
    const map: Array<{ key: string; terms: string[] }> = [
      { key: "Restaurants", terms: ["food", "eat", "restaurant", "cafe"] },
      { key: "Wellness", terms: ["health", "wellness", "fitness", "therapy"] },
      { key: "Legal Services", terms: ["law", "legal", "attorney"] },
      { key: "Real Estate", terms: ["home", "real estate", "property"] },
      {
        key: "Financial Services",
        terms: ["bank", "finance", "tax", "credit"],
      },
    ];

    const hit = map.find((x) => x.terms.some((t) => q.includes(t)));
    if (hit) return [hit.key, "Professional Services", "Retail", "Education"];
    return ["Professional Services", "Restaurants", "Retail", "Wellness"];
  }, [search]);

  useEffect(() => {
    if (!router.isReady || !search) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          search,
          page: String(page),
          limit: String(limit),
          sort: "relevance",
        });
        const res = await fetch(`/api/searchBusinesses?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load results");

        if (!cancelled) {
          const items = Array.isArray(data?.items) ? data.items : [];
          const totalCount = Number(data?.total || items.length);
          setResults(items);
          setTotal(totalCount);
          trackFlowEvent({
            eventType: "search_performed",
            query: search,
            source: "search_results",
            path: window.location.pathname,
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setResults([]);
          setTotal(0);
          setError(e?.message || "Could not load results");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, search, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit],
  );

  useEffect(() => {
    if (!search || loading || error) return;
    if (results.length !== 0) return;
    trackFlowEvent({
      eventType: "no_results_shown",
      source: "search_results",
      query: search,
    });
  }, [search, loading, error, results.length]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold">Search Results</h1>
          <Link
            href="/business-directory"
            className="text-sm underline text-gray-300"
          >
            Open Full Directory
          </Link>
        </div>

        <div className="mb-4 text-gray-300">
          {search ? (
            <>
              Showing results for{" "}
              <span className="text-gold font-semibold">“{search}”</span>
              <span className="ml-2 text-sm text-gray-500">
                ({total.toLocaleString()} found)
              </span>
            </>
          ) : (
            "Enter a search term to find businesses."
          )}
        </div>

        {loading ? <div className="text-gray-400">Loading results…</div> : null}
        {error ? (
          <div className="mb-4 rounded border border-red-500/40 bg-red-900/20 p-3 text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && search && results.length === 0 ? (
          <div className="rounded border border-gray-700 bg-gray-900 p-4">
            <p className="text-gray-200">No matching businesses found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Try a broader term or continue in the full directory with filters.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/business-directory"
                onClick={() =>
                  trackFlowEvent({
                    eventType: "rescue_action_clicked",
                    source: "search_results_no_result",
                    query: search,
                  })
                }
                className="px-4 py-2 bg-gold text-black rounded font-semibold"
              >
                Browse Full Directory
              </Link>
              <Link
                href={`/business-directory?search=${encodeURIComponent(search)}`}
                onClick={() =>
                  trackFlowEvent({
                    eventType: "filter_relaxed",
                    source: "search_results_no_result",
                    query: search,
                  })
                }
                className="px-4 py-2 rounded border border-gray-600 text-gray-200"
              >
                Try in Directory Search
              </Link>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Suggested categories
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedCategories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/business-directory?category=${encodeURIComponent(cat)}`}
                    onClick={() =>
                      trackFlowEvent({
                        eventType: "suggested_category_clicked",
                        source: "search_results_no_result",
                        query: search,
                        category: cat,
                      })
                    }
                    className="rounded-full border border-gray-600 bg-black/30 px-3 py-1 text-xs text-gray-200"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((r) => {
            const slug = encodeURIComponent(safe(r.alias).trim() || r._id);
            const href = `/business-directory/${slug}?from=search-results&q=${encodeURIComponent(search)}`;
            const location =
              [safe(r.city), safe(r.state)].filter(Boolean).join(", ") ||
              safe(r.address);
            const verified =
              r.verified === true ||
              r.isVerified === true ||
              safe(r.status).toLowerCase() === "verified";

            return (
              <div
                key={r._id}
                className="rounded border border-gray-700 bg-gray-900 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={href}
                    onClick={() =>
                      trackFlowEvent({
                        eventType: "result_click",
                        businessId: r._id,
                        businessAlias: safe(r.alias) || null,
                        source: "search_results",
                        query: search,
                      })
                    }
                    className="text-lg font-semibold text-gold hover:underline"
                  >
                    {safe(r.business_name) || "Untitled Business"}
                  </Link>
                  {verified ? (
                    <span className="text-xs rounded bg-emerald-700/40 border border-emerald-500/40 px-2 py-1 text-emerald-200">
                      Verified
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {categoriesLabel(r) || "Category not set"}
                </p>
                <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                  {safe(r.description) || "No description provided."}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {location || "Location unavailable"}
                </p>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={href}
                    onClick={() =>
                      trackFlowEvent({
                        eventType: "result_click",
                        businessId: r._id,
                        businessAlias: safe(r.alias) || null,
                        source: "search_results_card_cta",
                        query: search,
                      })
                    }
                    className="px-3 py-1.5 rounded bg-gold text-black text-sm font-semibold"
                  >
                    View Business
                  </Link>
                  {location ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded border border-gray-600 text-sm"
                    >
                      Directions
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-gray-600 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded border border-gray-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
