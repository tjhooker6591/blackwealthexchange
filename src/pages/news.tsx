"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Newspaper,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
} from "lucide-react";

type Region = "US" | "Africa" | "Global";

type SourceMeta = {
  id: string;
  name: string;
  region: Region;
  url: string;
};

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  region: Region;
  publishedAt?: string;
  snippet?: string;
  image?: string | null;
};

type ApiResponse = {
  updatedAt?: string;
  ttlSeconds?: number;
  total?: number;
  failures?: Record<string, string>;
  sources?: SourceMeta[];
  items?: NewsItem[];
};

type CategoryKey =
  | "All"
  | "Business"
  | "Politics"
  | "Culture"
  | "Tech"
  | "Health"
  | "Education"
  | "Sports"
  | "Africa"
  | "Diaspora"
  | "Entertainment";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function safeDate(ts?: string) {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function timeAgo(date?: Date | null) {
  if (!date) return "";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Lightweight categorizer (client-side, no extra API work)
function categorize(item: NewsItem): CategoryKey {
  const t = `${item.title} ${item.snippet || ""} ${item.source}`.toLowerCase();

  // Region “categories” are useful chips
  if (item.region === "Africa") return "Africa";

  // Diaspora (quick signals)
  if (
    t.includes("diaspora") ||
    t.includes("caribbean") ||
    t.includes("jamaica") ||
    t.includes("haiti") ||
    t.includes("trinidad") ||
    t.includes("uk") ||
    t.includes("london") ||
    t.includes("canada") ||
    t.includes("toronto")
  )
    return "Diaspora";

  const rules: Array<[CategoryKey, string[]]> = [
    ["Business", ["business", "market", "stocks", "funding", "invest", "startup", "entrepreneur", "economy", "bank", "finance", "company", "deal", "grant"]],
    ["Tech", ["tech", "ai", "software", "startup", "cyber", "security", "data", "app", "platform", "google", "apple", "microsoft"]],
    ["Politics", ["election", "policy", "government", "congress", "senate", "president", "minister", "court", "law", "rights", "protest", "police"]],
    ["Health", ["health", "hospital", "medicine", "mental", "wellness", "covid", "clinic", "research"]],
    ["Education", ["education", "school", "college", "university", "hbcu", "students", "scholarship", "grant", "campus"]],
    ["Sports", ["nba", "nfl", "mlb", "soccer", "football", "olympic", "boxing", "tennis", "championship"]],
    ["Entertainment", ["music", "film", "movie", "tv", "album", "artist", "award", "hollywood", "celebrity", "hip-hop"]],
    ["Culture", ["culture", "community", "heritage", "history", "art", "fashion", "food", "festival"]],
  ];

  for (const [cat, keys] of rules) {
    if (keys.some((k) => t.includes(k))) return cat;
  }

  // Fallback
  return "Culture";
}

export default function NewsPage() {
  const router = useRouter();
  const initialQ = typeof router.query.q === "string" ? router.query.q : "";

  const [q, setQ] = useState(initialQ);
  const [region, setRegion] = useState<string>("all");
  const [category, setCategory] = useState<CategoryKey>("All");
  const [source, setSource] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const [items, setItems] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<SourceMeta[]>([]);
  const [failures, setFailures] = useState<Record<string, string>>({});
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Carousel
  const [heroIndex, setHeroIndex] = useState(0);
  const hoverPauseRef = useRef(false);

  const regionOptions = useMemo(
    () => [
      { key: "all", label: "All Regions" },
      { key: "US", label: "US / Diaspora" },
      { key: "Africa", label: "Africa" },
      { key: "Global", label: "Global" },
    ],
    []
  );

  const load = async (opts?: { pushUrl?: boolean }) => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (region !== "all") params.set("region", region);
    params.set("limit", "120"); // pull more so categories feel rich

    try {
      const res = await fetch(`/api/news/black?${params.toString()}`);
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error((data as any)?.error || "Failed to load news");

      const gotItems = Array.isArray(data?.items) ? data.items : [];
      const gotSources = Array.isArray(data?.sources) ? data.sources : [];
      setItems(gotItems);
      setSources(gotSources);
      setFailures(data?.failures || {});
      setUpdatedAt(data?.updatedAt || "");

      if (opts?.pushUrl) {
        router.replace(
          { pathname: "/news", query: q.trim() ? { q: q.trim() } : {} },
          undefined,
          { shallow: true }
        );
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  // Initial load + auto refresh (10 min)
  useEffect(() => {
    load();
    const t = setInterval(() => load(), 10 * 60 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  // Derived + filtered items
  const enriched = useMemo(() => {
    const list = items.map((it) => {
      const dt = safeDate(it.publishedAt);
      const cat = categorize(it);
      return { ...it, _dt: dt, _cat: cat } as NewsItem & { _dt: Date | null; _cat: CategoryKey };
    });

    let out = list;

    if (category !== "All") {
      out = out.filter((x) => x._cat === category);
    }
    if (source !== "all") {
      out = out.filter((x) => x.source === source);
    }

    out = out.sort((a, b) => {
      const ta = a._dt ? a._dt.getTime() : 0;
      const tb = b._dt ? b._dt.getTime() : 0;
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return out;
  }, [items, category, source, sort]);

  // Category chips counts (based on loaded items)
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      All: items.length,
      Business: 0,
      Politics: 0,
      Culture: 0,
      Tech: 0,
      Health: 0,
      Education: 0,
      Sports: 0,
      Africa: 0,
      Diaspora: 0,
      Entertainment: 0,
    };

    for (const it of items) {
      const c = categorize(it);
      counts[c] += 1;
    }
    return counts;
  }, [items]);

  // Hero stories: best 6 from current filters (fallback to all)
  const heroItems = useMemo(() => {
    const base = enriched.length ? enriched : items;
    return base.slice(0, 6);
  }, [enriched, items]);

  // Carousel auto-advance
  useEffect(() => {
    if (!heroItems.length) return;

    const timer = setInterval(() => {
      if (hoverPauseRef.current) return;
      setHeroIndex((i) => (i + 1) % heroItems.length);
    }, 5200);

    return () => clearInterval(timer);
  }, [heroItems.length]);

  useEffect(() => {
    if (heroIndex >= heroItems.length) setHeroIndex(0);
  }, [heroIndex, heroItems.length]);

  const verifiedCount = sources.length;
  const failedCount = Object.keys(failures || {}).length;

  const sourceNames = useMemo(() => {
    const names = Array.from(new Set(sources.map((s) => s.name)));
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }, [sources]);

  const onSearch = () => {
    // reset filters that might hide results unintentionally
    setHeroIndex(0);
    load({ pushUrl: true });
  };

  const hero = heroItems[heroIndex];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-gold" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gold">
                Global Black News
              </h1>
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gray-800 bg-gray-900/50 px-2 py-0.5 text-xs text-gray-300">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Live
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl">
              Auto-updating headlines from Black news worldwide. Curated via multiple RSS feeds, refreshed every 10 minutes.
            </p>
          </div>

          <div className="hidden sm:flex gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-gray-800 bg-gray-900/40 hover:bg-gray-900/60 transition"
            >
              Back Home
            </Link>
            <button
              onClick={() => onSearch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-800 bg-black/30 hover:bg-black/40 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-gray-200">Refresh</span>
            </button>
          </div>
        </div>

        {/* Verified sources badge */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-black/30 px-3 py-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div className="text-sm">
                  <div className="font-semibold text-gray-100">Verified Sources</div>
                  <div className="text-xs text-gray-400">
                    {verifiedCount} feeds connected
                    {failedCount ? ` • ${failedCount} failing` : ""}
                  </div>
                </div>
              </div>

              {failedCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-300" />
                  <div className="text-xs text-yellow-200">
                    Some feeds failed this refresh (provider blocks or RSS format change). News still updates from remaining sources.
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {updatedAt ? (
                <>Last updated: {new Date(updatedAt).toLocaleString()}</>
              ) : (
                <>Loading update time…</>
              )}
            </div>
          </div>

          {/* Source health (collapsible style) */}
          {failedCount > 0 && (
            <div className="mt-3 rounded-xl border border-gray-800 bg-black/25 p-3">
              <div className="text-xs font-semibold text-gray-300 mb-2">Feed status</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(failures).map(([id, msg]) => (
                  <div
                    key={id}
                    className="rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2 text-xs text-gray-300"
                  >
                    <span className="text-yellow-300 font-semibold">{id}</span>:{" "}
                    <span className="text-gray-400">{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hero carousel */}
        {hero && (
          <section
            className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur shadow-lg overflow-hidden"
            onMouseEnter={() => (hoverPauseRef.current = true)}
            onMouseLeave={() => (hoverPauseRef.current = false)}
          >
            <div className="relative">
              {hero.image ? (
                <img
                  src={hero.image}
                  alt={hero.title}
                  className="w-full h-[260px] sm:h-[320px] object-cover opacity-90"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-[260px] sm:h-[320px] bg-gradient-to-r from-gray-900/80 via-black/60 to-gray-900/80" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-300">
                    <span className="text-gold font-semibold">{hero.source}</span>
                    <span className="text-gray-500"> • </span>
                    <span className="text-gray-400">{hero.region}</span>
                    {hero.publishedAt && (
                      <>
                        <span className="text-gray-500"> • </span>
                        <span className="text-gray-400">
                          {timeAgo(safeDate(hero.publishedAt))}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setHeroIndex((i) => (i - 1 + heroItems.length) % heroItems.length)
                      }
                      className="p-2 rounded-xl border border-gray-800 bg-black/40 hover:bg-black/55 transition"
                      aria-label="Previous"
                      type="button"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-200" />
                    </button>
                    <button
                      onClick={() => setHeroIndex((i) => (i + 1) % heroItems.length)}
                      className="p-2 rounded-xl border border-gray-800 bg-black/40 hover:bg-black/55 transition"
                      aria-label="Next"
                      type="button"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-200" />
                    </button>
                  </div>
                </div>

                <a
                  href={hero.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-xl sm:text-2xl font-extrabold leading-tight text-white hover:underline"
                >
                  {hero.title}
                </a>

                {hero.snippet && (
                  <div className="mt-2 text-sm text-gray-200/90 max-w-3xl line-clamp-3">
                    {hero.snippet}
                  </div>
                )}

                {/* Dots */}
                <div className="mt-4 flex items-center gap-2">
                  {heroItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeroIndex(idx)}
                      className={cx(
                        "h-2.5 rounded-full transition",
                        idx === heroIndex ? "w-7 bg-gold" : "w-2.5 bg-gray-600 hover:bg-gray-500"
                      )}
                      aria-label={`Go to story ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Search + Filters */}
        <section className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur p-4 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="flex-1 flex items-stretch overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
              <span className="px-3 inline-flex items-center text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search headlines (e.g., funding, jobs, tech, Africa, diaspora)…"
                className="flex-1 px-3 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearch();
                }}
              />
              <button
                onClick={() => onSearch()}
                className="px-5 bg-gold text-black font-bold hover:bg-yellow-500 transition"
              >
                Search
              </button>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-3 rounded-xl border border-gray-700 bg-gray-800">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="bg-transparent text-white text-sm focus:outline-none"
                >
                  {regionOptions.map((r) => (
                    <option key={r.key} value={r.key} className="bg-gray-900">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-3 rounded-xl border border-gray-700 bg-gray-800">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="bg-transparent text-white text-sm focus:outline-none"
                  title="Filter by source"
                >
                  <option value="all" className="bg-gray-900">
                    All Sources
                  </option>
                  {sourceNames.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-3 rounded-xl border border-gray-700 bg-gray-800">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="bg-transparent text-white text-sm focus:outline-none"
                  title="Sort"
                >
                  <option value="newest" className="bg-gray-900">
                    Newest
                  </option>
                  <option value="oldest" className="bg-gray-900">
                    Oldest
                  </option>
                </select>
              </div>

              <button
                onClick={() => onSearch()}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-800 bg-black/30 hover:bg-black/40 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gold" />
                <span className="text-sm text-gray-200 font-semibold">Refresh</span>
              </button>
            </div>
          </div>

          {/* Category chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                "All",
                "Business",
                "Africa",
                "Diaspora",
                "Tech",
                "Politics",
                "Culture",
                "Health",
                "Education",
                "Sports",
                "Entertainment",
              ] as CategoryKey[]
            ).map((c) => {
              const count = categoryCounts[c] ?? 0;
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setHeroIndex(0);
                  }}
                  className={cx(
                    "px-3 py-2 rounded-full border text-xs font-semibold transition",
                    active
                      ? "bg-gold text-black border-gold"
                      : "bg-black/25 text-gray-200 border-gray-800 hover:border-gray-700 hover:bg-black/35"
                  )}
                  title={`${c} (${count})`}
                >
                  {c} <span className={cx(active ? "text-black/70" : "text-gray-400")}>({count})</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Results */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-300">
              Showing <span className="text-gray-100 font-semibold">{enriched.length}</span> headlines
              {category !== "All" ? (
                <>
                  {" "}• Category: <span className="text-gold font-semibold">{category}</span>
                </>
              ) : null}
              {source !== "all" ? (
                <>
                  {" "}• Source: <span className="text-gold font-semibold">{source}</span>
                </>
              ) : null}
            </div>

            <div className="sm:hidden">
              <Link
                href="/"
                className="px-4 py-2 rounded-xl border border-gray-800 bg-gray-900/40 hover:bg-gray-900/60 transition"
              >
                Back Home
              </Link>
            </div>
          </div>

          {loading && <div className="text-gray-300">Loading headlines…</div>}
          {error && <div className="text-red-300">{error}</div>}

          {!loading && !error && enriched.length === 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 text-gray-300">
              No headlines found. Try widening filters or switching category back to <span className="text-gold font-semibold">All</span>.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enriched.slice(0, 60).map((it) => {
              const dt = safeDate(it.publishedAt);
              const cat = categorize(it);

              return (
                <a
                  key={it.id}
                  href={it.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-gray-800 bg-gray-900/40 hover:bg-gray-900/60 transition shadow-lg overflow-hidden"
                >
                  {it.image ? (
                    <div className="relative">
                      <img
                        src={it.image}
                        alt={it.title}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gray-800 bg-black/60 text-xs text-gray-100">
                        <span className="text-gold font-semibold">{cat}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-2 bg-gold/25" />
                  )}

                  <div className="p-4">
                    <div className="text-xs text-gray-400 flex items-center justify-between gap-3">
                      <span className="text-gold font-semibold">{it.source}</span>
                      <span>
                        {it.region ? `${it.region}` : ""}
                        {dt ? ` • ${timeAgo(dt)}` : ""}
                      </span>
                    </div>

                    <div className="mt-2 text-base font-semibold text-gray-100 leading-snug">
                      {it.title}
                    </div>

                    {it.snippet && (
                      <div className="mt-2 text-sm text-gray-300 line-clamp-3">
                        {it.snippet}
                      </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500">Open article →</div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Footer helper */}
          <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/30 p-4 text-xs text-gray-500">
            <div className="font-semibold text-gray-300 mb-1">Note</div>
            RSS sources sometimes block automated fetches or change RSS formats. If you want 99.9% reliability,
            the next step is adding a paid news API fallback — but this version stays fully free/open and auto-updating.
          </div>
        </section>
      </div>
    </div>
  );
}

