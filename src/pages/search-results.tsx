import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";

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
  amountPaid?: number;
  tier?: string;
  listingStatus?: string;
  type?: string;
};

type SponsorCard = {
  _id: string;
  name: string;
  tagline: string;
  img: string;
  url: string;
  cta?: string;
};

function safe(v: unknown) {
  return typeof v === "string" ? v : "";
}

function categoriesLabel(r: Result) {
  if (Array.isArray(r.categories))
    return r.categories.filter(Boolean).join(", ");
  return safe(r.categories) || safe(r.category);
}

function shortDescription(r: Result) {
  const raw = safe(r.description).trim();
  if (!raw) return "No description provided.";
  if (raw.length <= 140) return raw;
  return `${raw.slice(0, 137)}...`;
}

export default function SearchResults() {
  const router = useRouter();
  const search = safe(router.query.search || router.query.q).trim();

  const trackSearchEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/search-results",
      section: "search_results",
      source: "search_results_page",
      query: search,
      ...extras,
    });
  };

  const [results, setResults] = useState<Result[]>([]);
  const [sponsors, setSponsors] = useState<SponsorCard[]>([]);
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
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/sponsored-businesses", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!cancelled && Array.isArray(data?.sponsors)) {
          setSponsors(data.sponsors.slice(0, 3));
        }
      } catch {
        // leave sponsors empty on fetch failure
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
        const res = await fetch(`/api/search/businesses?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load results");

        if (!cancelled) {
          const items = Array.isArray(data?.items) ? data.items : [];
          const totalCount = Number(data?.total || items.length);
          setResults(items);
          setTotal(totalCount);
          trackSearchEvent("search_results_viewed", {
            result_count: totalCount,
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
    trackSearchEvent("search_no_results_viewed", {
      result_count: 0,
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
            <p className="text-gray-200">
              No strong matches yet for this query.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try a broader term or jump into the full directory.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/business-directory"
                onClick={() =>
                  trackSearchEvent("search_filter_applied", {
                    filter_key: "rescue_action",
                    filter_value: "browse_full_directory",
                  })
                }
                className="px-4 py-2 bg-gold text-black rounded font-semibold"
              >
                Browse Full Directory
              </Link>
              <Link
                href={`/business-directory?search=${encodeURIComponent(search)}`}
                onClick={() =>
                  trackSearchEvent("search_filter_applied", {
                    filter_key: "rescue_action",
                    filter_value: "try_in_directory_search",
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
                      trackSearchEvent("search_filter_applied", {
                        filter_key: "suggested_category",
                        filter_value: cat,
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

        {sponsors.length ? (
          <section className="mb-5 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#EFD27A]">
              Sponsored Partners
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sponsors.map((s) => (
                <a
                  key={s._id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/35 p-3 hover:bg-black/45"
                >
                  <img
                    src={s.img}
                    alt={s.name}
                    className="h-12 w-12 rounded-lg border border-white/20 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[#EFD27A]">
                      {s.name}
                    </div>
                    <div className="truncate text-xs text-gray-300">
                      {s.tagline}
                    </div>
                    <div className="mt-1 inline-flex rounded border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-semibold text-[#EFD27A]">
                      Sponsored
                    </div>
                  </div>
                  <span className="rounded bg-[#D4AF37] px-2 py-1 text-xs font-semibold text-black">
                    {s.cta || "Learn More"}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.map((r, idx) => {
            const slug = encodeURIComponent(safe(r.alias).trim() || r._id);
            const href = `/business-directory/${slug}?from=search-results&q=${encodeURIComponent(search)}`;
            const location =
              safe((r as any).locationDisplay) ||
              [safe(r.city), safe(r.state)].filter(Boolean).join(", ") ||
              safe(r.address);
            const verified =
              r.isVerified === true ||
              r.verified === true ||
              safe((r as any).trustStatus).toLowerCase() === "verified";
            const sponsored =
              (r as any).isSponsored === true ||
              Number(r.amountPaid || 0) > 0 ||
              ["featured", "gold", "sponsored", "premium"].includes(
                safe(r.tier).toLowerCase(),
              );
            const category =
              safe((r as any).primaryCategory) ||
              categoriesLabel(r) ||
              "Category not set";
            const entityType =
              safe((r as any).entityType) || safe(r.type) || "business";

            return (
              <article
                key={r._id}
                className="rounded border border-gray-700 bg-gray-900 p-4 transition hover:border-gray-600"
              >
                <div className="mb-2 flex items-center gap-2">
                  {verified ? (
                    <span className="rounded border border-emerald-500/40 bg-emerald-700/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                      Verified
                    </span>
                  ) : null}
                  {sponsored ? (
                    <span className="rounded border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-2 py-0.5 text-[11px] font-semibold text-[#EFD27A]">
                      Sponsored
                    </span>
                  ) : null}
                  <span className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-gray-300">
                    {entityType}
                  </span>
                </div>

                <Link
                  href={href}
                  onClick={() =>
                    trackSearchEvent("search_result_clicked", {
                      entity_id: r._id,
                      entity_type: "business",
                      result_rank: idx + 1,
                      source: "search_results_card_title",
                      businessAlias: safe(r.alias) || null,
                    })
                  }
                  className="text-lg font-semibold text-gold hover:underline"
                >
                  {safe(r.business_name) || "Untitled Business"}
                </Link>

                <p className="mt-1 text-sm text-gray-400">{category}</p>
                <p className="mt-2 text-sm text-gray-300">
                  {shortDescription(r)}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {location || "Location unavailable"}
                </p>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={href}
                    onClick={() =>
                      trackSearchEvent("search_result_clicked", {
                        entity_id: r._id,
                        entity_type: "business",
                        result_rank: idx + 1,
                        source: "search_results_card_primary_cta",
                        businessAlias: safe(r.alias) || null,
                      })
                    }
                    className="rounded bg-gold px-3 py-1.5 text-sm font-semibold text-black"
                  >
                    View Profile
                  </Link>
                  {location ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded border border-gray-600 px-3 py-1.5 text-sm text-gray-200"
                    >
                      Directions
                    </a>
                  ) : null}
                </div>
              </article>
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
