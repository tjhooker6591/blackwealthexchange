import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { toPublicErrorMessage } from "@/lib/publicError";
import SaveSearchButton from "@/components/network/SaveSearchButton";
import type {
  UniversalSearchDomain,
  UniversalSearchResponse,
  UniversalSearchResult,
} from "@/lib/search/universalSearch";

function safe(v: unknown) {
  return typeof v === "string" ? v : "";
}

const DOMAIN_ROUTE_LABEL: Record<UniversalSearchDomain, string> = {
  business: "Directory",
  product: "Marketplace",
  job: "Jobs",
  opportunity: "Student Hub",
};

function humanize(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPrice(price: number) {
  return price.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDeadline(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function metaLine(result: UniversalSearchResult): string[] {
  const parts: string[] = [];
  if (result.domain === "business" && result.category) {
    parts.push(result.category);
  }
  if (result.domain === "product") {
    if (result.sellerName) parts.push(`Sold by ${result.sellerName}`);
    if (typeof result.price === "number") parts.push(formatPrice(result.price));
  }
  if (result.domain === "job") {
    const company = safe((result.data as any)?.company);
    if (company) parts.push(company);
    if (result.jobType) parts.push(result.jobType);
  }
  if (result.domain === "opportunity") {
    const organization = safe((result.data as any)?.organization);
    if (organization) parts.push(organization);
    if (result.opportunityType) parts.push(humanize(result.opportunityType));
    if (result.eligibility) {
      const short =
        result.eligibility.length > 60
          ? `${result.eligibility.slice(0, 57).trimEnd()}…`
          : result.eligibility;
      parts.push(short);
    }
    if (result.deadline) {
      const formatted = formatDeadline(result.deadline);
      if (formatted) parts.push(`Deadline ${formatted}`);
    }
  }
  return parts;
}

export default function UniversalSearch() {
  const router = useRouter();
  const query = safe(router.query.q || router.query.search).trim();

  const [response, setResponse] = useState<UniversalSearchResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trackSearchEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/search",
      section: "universal_search",
      source: "universal_search_page",
      query,
      ...extras,
    });
  };

  useEffect(() => {
    if (!router.isReady || !query) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: query });
        const res = await fetch(`/api/search/universal?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            "We couldn't load search results right now. Please try again.",
          );
        }
        if (!cancelled) {
          setResponse(data as UniversalSearchResponse);
          trackSearchEvent("universal_search_viewed", {
            result_count: data?.total ?? 0,
            resultsByDomain: data?.countsByDomain ?? null,
          });
          fetch("/api/search/quality-events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query,
              resultCount: data?.total ?? 0,
              source: "universal_search",
              resultsByDomain: data?.countsByDomain ?? null,
            }),
          }).catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) {
          setResponse(null);
          setError(
            toPublicErrorMessage(e?.message, {
              fallback:
                "We couldn't load search results right now. Please try again.",
            }),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, query]);

  useEffect(() => {
    if (!query || loading || error) return;
    if (!response || response.total !== 0) return;
    trackSearchEvent("universal_search_no_results_viewed", {
      result_count: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, loading, error, response]);

  const results = response?.results || [];

  const grouped = useMemo(() => {
    const map = new Map<UniversalSearchDomain, UniversalSearchResult[]>();
    for (const result of results) {
      const bucket = map.get(result.domain) || [];
      bucket.push(result);
      map.set(result.domain, bucket);
    }
    return map;
  }, [results]);

  const title = query
    ? `Search: ${query} | Black Wealth Exchange`
    : "Search | Black Wealth Exchange";
  const description = truncateMeta(
    "Search across BWE businesses, marketplace products, jobs, and student opportunities in one place.",
  );
  const canonical = canonicalUrl("/search");

  const handleResultClick = (result: UniversalSearchResult) => {
    trackSearchEvent("universal_search_result_clicked", {
      selectedResultDomain: result.domain,
      selectedResultId: result.id,
    });
    fetch("/api/search/quality-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        resultCount: response?.total ?? 0,
        source: "universal_search",
        selectedResultDomain: result.domain,
        selectedResultId: result.id,
      }),
    }).catch(() => {});
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-10 text-white sm:px-6">
        <div className="bwe-eyebrow">Search all of BWE</div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {query ? `Results for "${query}"` : "Search BWE"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          One search across businesses, marketplace products, jobs, and student
          opportunities.
        </p>

        {query ? (
          <div className="mt-4">
            <SaveSearchButton domain="universal" query={query} label={query} />
          </div>
        ) : null}

        {!query ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
            Enter a search term to get started.
          </div>
        ) : loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
            Searching BWE…
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">
            {error}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
            <p>No results found for &quot;{query}&quot;.</p>
            <p className="mt-2 text-white/50">
              Try a different search term, or browse{" "}
              <Link
                href="/business-directory"
                className="text-[var(--accent)] underline"
              >
                Directory
              </Link>
              ,{" "}
              <Link
                href="/marketplace"
                className="text-[var(--accent)] underline"
              >
                Marketplace
              </Link>
              ,{" "}
              <Link
                href="/job-listings"
                className="text-[var(--accent)] underline"
              >
                Jobs
              </Link>
              , or{" "}
              <Link
                href="/black-student-opportunities"
                className="text-[var(--accent)] underline"
              >
                Student Opportunities
              </Link>{" "}
              directly.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            <p className="text-xs text-white/50">
              {response?.total} result{response?.total === 1 ? "" : "s"} across{" "}
              {grouped.size} area{grouped.size === 1 ? "" : "s"} of BWE
            </p>
            {results.map((result) => (
              <Link
                key={`${result.domain}:${result.id}`}
                href={result.url}
                onClick={() => handleResultClick(result)}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[var(--accent)]/50 hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  {result.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.image}
                      alt=""
                      className="h-14 w-14 flex-none rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-white/5 text-[10px] font-semibold uppercase text-white/40">
                      {DOMAIN_ROUTE_LABEL[result.domain]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                        {DOMAIN_ROUTE_LABEL[result.domain]}
                      </span>
                      {result.trust?.verified ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          Verified
                        </span>
                      ) : null}
                      {result.trust?.claimed ? (
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                          Ownership Verified
                        </span>
                      ) : null}
                      {result.trust?.sponsored ? (
                        <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">
                      {result.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-white/60">
                      {result.description}
                    </p>
                    {(() => {
                      const meta = [
                        result.location,
                        ...metaLine(result),
                      ].filter(Boolean);
                      return meta.length ? (
                        <p className="mt-1 truncate text-[11px] text-white/45">
                          {meta.join(" · ")}
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
