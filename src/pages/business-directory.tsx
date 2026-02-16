/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function safeStr(v: any): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

function categoriesToString(v: any): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return safeStr(v);
}

function normalizeScope(v: any): "businesses" | "organizations" {
  const t = safeStr(v).toLowerCase().trim();
  if (
    t === "org" ||
    t === "orgs" ||
    t === "organisation" ||
    t === "organization"
  )
    return "organizations";
  if (t === "organizations") return "organizations";
  return "businesses";
}

function toInt(v: any, def: number) {
  const n = parseInt(safeStr(v), 10);
  return Number.isFinite(n) ? n : def;
}

const SIDEBAR_ADS = [
  {
    img: "/pamfa1.jpg",
    name: "Pamfa United Citizens",
    tagline: "Bold. Fearless. Iconic.",
    url: "https://pamfaunited.com",
    cta: "Shop Now",
  },
  {
    img: "/titans.jpg",
    name: "Titan Era Productions",
    tagline: "Level Up Your Look.",
    url: "https://www.instagram.com/titaneraoffical/",
    cta: "Explore",
  },
];

type DirectoryScope = "businesses" | "organizations";

type Business = {
  _id: string;
  alias?: any;
  image?: string;
  business_name?: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  category?: string;
  categories?: string | string[];
  display_categories?: string;

  // Optional “Google-like” fields (only show if present)
  rating?: number | string;
  reviewCount?: number | string;
  priceRange?: string; // e.g. "$10–20"
};

type Organization = {
  _id: string;
  alias?: any;
  name?: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  orgType?: string; // "church"
  denomination?: string;
  website?: string;
  entityType?: string;

  rating?: number | string;
  reviewCount?: number | string;
  priceRange?: string;
};

type Row =
  | (Business & { __kind: "business" })
  | (Organization & { __kind: "org" });

function injectSponsoredEveryN(rows: Row[], interval = 5) {
  if (!SIDEBAR_ADS.length) return rows;
  const out: Array<Row | { isSponsor: true; sponsorIdx: number; key: string }> =
    [];
  let sponsorIdx = 0;
  for (let i = 0; i < rows.length; i++) {
    out.push(rows[i]);
    if ((i + 1) % interval === 0) {
      out.push({
        isSponsor: true,
        sponsorIdx: sponsorIdx % SIDEBAR_ADS.length,
        key: `s-${sponsorIdx}-${i}`,
      });
      sponsorIdx++;
    }
  }
  return out;
}

function SponsorCard({ img, name, tagline, url, cta }: any) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex flex-col items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
      style={{ minHeight: 160 }}
    >
      <div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-56 -translate-x-1/2 rounded-full bg-[#D4AF37]/12 blur-2xl" />
      <img
        src={img}
        alt={name}
        className="h-12 w-12 object-cover rounded-xl shadow border border-white/15 mb-2"
        style={{ background: "#111" }}
      />
      <div className="text-[#D4AF37] font-extrabold text-xs text-center truncate w-full">
        {name}
      </div>
      <div className="text-white/65 text-[11px] text-center truncate w-full mt-1">
        {tagline}
      </div>
      <span className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-3 py-1.5 text-[11px] font-extrabold text-black transition hover:bg-yellow-500">
        {cta}
      </span>
      <span className="absolute top-2 right-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#D4AF37]">
        Sponsored
      </span>
    </a>
  );
}

function SidebarAdCard({ img, name, tagline, url, cta }: any) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
    >
      <div className="pointer-events-none absolute -top-14 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <span className="absolute top-3 right-3 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-extrabold text-white/70">
        Ad
      </span>
      <div className="flex items-start gap-3">
        <img
          src={img}
          className="h-12 w-12 object-cover rounded-xl border border-white/15 shadow"
          alt={name}
        />
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-white truncate">{name}</div>
          <div className="mt-0.5 text-[12px] text-white/65 truncate">
            {tagline}
          </div>
          <div className="mt-3 inline-flex rounded-xl bg-[#D4AF37] px-3 py-1.5 text-[11px] font-extrabold text-black transition hover:bg-yellow-500">
            {cta}
          </div>
        </div>
      </div>
    </a>
  );
}

/** Pagination UI */
function buildPageList(page: number, totalPages: number) {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  [page - 2, page - 1, page, page + 1, page + 2].forEach((p) => pages.add(p));

  const filtered = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const out: Array<number | "…"> = [];
  for (let i = 0; i < filtered.length; i++) {
    const cur = filtered[i];
    const prev = filtered[i - 1];
    if (i > 0 && prev && cur - prev > 1) out.push("…");
    out.push(cur);
  }
  return out;
}

function Pager({
  page,
  totalPages,
  onPage,
  disabled,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) return null;

  const list = buildPageList(page, totalPages);

  const btnBase =
    "inline-flex items-center justify-center rounded-xl border px-2.5 py-2 text-[12px] font-extrabold transition";
  const btnIdle =
    "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]";
  const btnActive = "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]";

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={disabled || page <= 1}
        className={cx(
          btnBase,
          btnIdle,
          (disabled || page <= 1) && "opacity-40",
        )}
        title="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {list.map((p, idx) =>
        p === "…" ? (
          <span key={`e-${idx}`} className="px-1 text-white/35 text-sm">
            …
          </span>
        ) : (
          <button
            key={`p-${p}`}
            type="button"
            disabled={disabled}
            onClick={() => onPage(p)}
            className={cx(
              btnBase,
              p === page ? btnActive : btnIdle,
              disabled && "opacity-60",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={disabled || page >= totalPages}
        className={cx(
          btnBase,
          btnIdle,
          (disabled || page >= totalPages) && "opacity-40",
        )}
        title="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BusinessDirectory() {
  const router = useRouter();

  // Scope is driven by query (index pushes type/scope/tab)
  const scope: DirectoryScope = useMemo(() => {
    if (!router.isReady) return "businesses";
    return normalizeScope(
      router.query.type ?? router.query.scope ?? router.query.tab,
    );
  }, [router.isReady, router.query.type, router.query.scope, router.query.tab]);

  // Categories only apply to businesses
  const TOP_CATEGORIES = ["Food", "Shopping", "Beauty", "Health", "Clothing"];
  const _CATEGORIES = ["All", ...TOP_CATEGORIES];

  const [input, setInput] = useState("");
  const [category, setCategory] = useState("All");

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [serverPaged, setServerPaged] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const didInitFromUrl = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);

  // Init from URL
  useEffect(() => {
    if (!router.isReady) return;
    if (didInitFromUrl.current) return;

    const q =
      (typeof router.query.search === "string" && router.query.search) ||
      (typeof router.query.q === "string" && router.query.q) ||
      "";

    const cat =
      typeof router.query.category === "string" ? router.query.category : "All";
    const p = toInt(router.query.page, 1);

    if (q) setInput(q);
    if (scope === "businesses") setCategory(cat || "All");
    setPage(Math.max(1, p));

    didInitFromUrl.current = true;
  }, [
    router.isReady,
    router.query.search,
    router.query.q,
    router.query.category,
    router.query.page,
    scope,
  ]);

  // Sync URL shallowly
  useEffect(() => {
    if (!router.isReady) return;
    if (!didInitFromUrl.current) return;

    const nextQuery: Record<string, any> = {
      ...router.query,
      type: scope,
      search: input.trim() || "",
      q: input.trim() || "",
      page: String(page),
    };

    if (scope === "businesses") nextQuery.category = category || "All";
    else delete nextQuery.category;

    if (!nextQuery.search) delete nextQuery.search;
    if (!nextQuery.q) delete nextQuery.q;
    if (!nextQuery.page || nextQuery.page === "1") delete nextQuery.page;
    if (nextQuery.category === "All") delete nextQuery.category;

    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, category, page, scope]);

  // Reset page when query changes
  useEffect(() => {
    setPage(1);
  }, [input, category, scope]);

  // Fetch
  useEffect(() => {
    const q = input.trim();

    const hasAnyFilter =
      Boolean(q) || (scope === "businesses" && category !== "All");
    if (!hasAnyFilter) {
      setRows([]);
      setTotal(0);
      setHasSearched(false);
      setServerPaged(false);
      return;
    }

    setIsLoading(true);

    const timeout = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams();
      if (q) {
        params.set("search", q);
        params.set("q", q);
      }
      params.set("type", scope);

      if (scope === "businesses" && category && category !== "All")
        params.set("category", category);

      params.set("limit", String(pageSize));
      params.set("page", String(page));
      params.set("__nocache", "1");

      fetch(`/api/searchBusinesses?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data) => {
          if (controller.signal.aborted) return;

          // Shape A: array
          if (Array.isArray(data)) {
            const tagged: Row[] =
              scope === "organizations"
                ? data.map((d: any) => ({ ...d, __kind: "org" }))
                : data.map((d: any) => ({ ...d, __kind: "business" }));
            setRows(tagged);
            setTotal(tagged.length);
            setServerPaged(false);
            setHasSearched(true);
            return;
          }

          // Shape B: { items, total, page, limit }
          if (data && Array.isArray(data.items)) {
            const tagged: Row[] =
              scope === "organizations"
                ? data.items.map((d: any) => ({ ...d, __kind: "org" }))
                : data.items.map((d: any) => ({ ...d, __kind: "business" }));
            setRows(tagged);
            setTotal(toInt(data.total, tagged.length));
            setServerPaged(true);
            setHasSearched(true);
            return;
          }

          setRows([]);
          setTotal(0);
          setServerPaged(false);
          setHasSearched(true);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            setRows([]);
            setTotal(0);
            setServerPaged(false);
            setHasSearched(true);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timeout);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [input, category, page, scope]);

  // Client filtering (business categories) if needed
  const filteredRows = useMemo(() => {
    if (scope !== "businesses") return rows;
    if (!category || category === "All") return rows;

    const want = category.toLowerCase();
    return rows.filter((r: any) => {
      const catStr = categoriesToString(
        r.categories || r.category || r.display_categories || "",
      ).toLowerCase();
      return catStr.includes(want);
    });
  }, [rows, scope, category]);

  // Pagination fallback
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const pageRows = useMemo(() => {
    if (serverPaged) return filteredRows;
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, serverPaged, page]);

  const visibleWithSponsors = useMemo(
    () => injectSponsoredEveryN(pageRows, 5),
    [pageRows],
  );

  const goPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    setTimeout(() => {
      resultsTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = "/default-image.jpg";
  };

  // Build consistent UI fields (Google-like)
  const getTitle = (r: Row) =>
    r.__kind === "org"
      ? safeStr((r as any).name)
      : safeStr((r as any).business_name);
  const getDesc = (r: Row) => safeStr((r as any).description);

  const getLocation = (r: Row) => {
    const city = safeStr((r as any).city);
    const state = safeStr((r as any).state);
    const addr = safeStr((r as any).address);

    const loc = [city, state].filter(Boolean).join(", ");
    return loc || addr || "";
  };

  const getCategoryLabel = (r: Row) => {
    if (r.__kind === "org") {
      const orgType = safeStr((r as any).orgType);
      const denom = safeStr((r as any).denomination);
      return [orgType, denom].filter(Boolean).join(" · ");
    }

    // businesses
    const display = safeStr((r as any).display_categories);
    const cats = categoriesToString(
      (r as any).categories || (r as any).category,
    );
    return display || cats || "";
  };

  const getRatingLine = (r: Row) => {
    const rating = safeStr((r as any).rating);
    const reviewCount = safeStr((r as any).reviewCount);
    const priceRange = safeStr((r as any).priceRange);

    // e.g. "4.5(31) · $10–20 · Restaurant"
    const parts: string[] = [];
    if (rating)
      parts.push(reviewCount ? `${rating}(${reviewCount})` : `${rating}`);
    if (priceRange) parts.push(priceRange);

    const cat = getCategoryLabel(r);
    if (cat) parts.push(cat);

    return parts.join(" · ");
  };

  // ✅ FIX: alias can be non-string; always coerce safely
  const getSlug = (r: Row) => {
    const aliasRaw = (r as any).alias;
    const alias = safeStr(aliasRaw).trim(); // safeStr ensures .trim exists
    return alias || safeStr((r as any)._id);
  };

  const getHref = (r: Row) => {
    const slug = encodeURIComponent(getSlug(r));
    return r.__kind === "org"
      ? `/organizations/${slug}`
      : `/business-directory/${slug}`;
  };

  const sponsorsToShow = [
    ...SIDEBAR_ADS,
    ...Array(Math.max(0, 10 - SIDEBAR_ADS.length)).fill({
      img: "/placeholder.png",
      name: "Your Business Here",
      tagline: "Sponsor This Spot!",
      url: "/advertise",
      cta: "Advertise",
    }),
  ].slice(0, 10);

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo =
    total === 0 ? 0 : Math.min((page - 1) * pageSize + pageRows.length, total);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* subtle glows like index */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[520px] w-[520px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {scope === "organizations"
                ? "Organizations Directory"
                : "Business Directory"}{" "}
              <span className="text-[#D4AF37]">•</span>{" "}
              <span className="text-white/65 text-base sm:text-lg font-bold">
                Trusted Search
              </span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Results are paged so users don’t scroll forever — faster, cleaner,
              more “Google-like”.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          {/* Main */}
          <div className="min-w-0">
            {/* Categories (business only) */}
            {scope === "businesses" && (
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  "All",
                  "Food",
                  "Shopping",
                  "Beauty",
                  "Health",
                  "Clothing",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cx(
                      "rounded-xl border px-3 py-2 text-[12px] font-extrabold tracking-wide transition",
                      category === cat
                        ? "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]"
                        : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Search bar */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
              <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-[30rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

              <div className="flex items-stretch gap-2">
                <input
                  type="text"
                  placeholder={
                    scope === "organizations"
                      ? "Search churches, nonprofits, orgs…"
                      : "Find Black-owned businesses…"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none transition focus:border-[#D4AF37]/40 focus:ring-2 focus:ring-[#D4AF37]/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setHasSearched(true);
                  }}
                  className="rounded-xl bg-[#D4AF37] px-4 sm:px-6 text-[13px] font-extrabold text-black transition hover:bg-yellow-500"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Sponsors carousel */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-extrabold">
                  Featured Sponsors
                </h2>
                <a
                  href="/all-sponsors"
                  className="text-[12px] text-white/70 hover:text-[#D4AF37] font-bold"
                >
                  See All
                </a>
              </div>

              <Swiper
                modules={[Navigation]}
                spaceBetween={10}
                slidesPerView="auto"
                navigation
                style={{ paddingBottom: 8 }}
              >
                {sponsorsToShow.map((ad, idx) => (
                  <SwiperSlide
                    key={`${ad.url}-${idx}`}
                    className="!w-[170px] sm:!w-[190px]"
                  >
                    <SponsorCard {...ad} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Results */}
            <div
              ref={resultsTopRef}
              className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur"
            >
              {/* Top counters like your old version */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[12px] text-white/70 font-bold">
                  {hasSearched ? (
                    <>
                      <span className="text-white/50">Results:</span>{" "}
                      <span className="text-white">
                        {total.toLocaleString()}
                      </span>{" "}
                      <span className="text-white/40">
                        {total > 0
                          ? `• Showing ${showingFrom}-${showingTo}`
                          : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-white/50">
                      Start a search to see results.
                    </span>
                  )}
                </div>

                <div className="text-[12px] text-white/60 font-bold">
                  {hasSearched && total > 0 ? (
                    <>
                      Page <span className="text-[#D4AF37]">{page}</span> of{" "}
                      <span className="text-white">{totalPages}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="relative mt-3 min-h-[160px]">
                {isLoading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                    <div className="text-[#D4AF37] font-extrabold animate-pulse">
                      Loading…
                    </div>
                  </div>
                )}

                {!hasSearched ? (
                  <div className="py-10 text-center text-white/50">
                    Discover and support Black-owned businesses & organizations.
                    Start your search above.
                  </div>
                ) : total === 0 && !isLoading ? (
                  <div className="py-10 text-center text-white/50">
                    No results found for{" "}
                    <span className="text-white/70">“{input.trim()}”</span>.
                  </div>
                ) : (
                  <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    {visibleWithSponsors.map((item, idx) =>
                      (item as any).isSponsor ? (
                        <div
                          key={(item as any).key ?? `s-${idx}`}
                          className="relative flex items-center gap-3 px-3 py-3"
                        >
                          <img
                            src={SIDEBAR_ADS[(item as any).sponsorIdx].img}
                            alt={SIDEBAR_ADS[(item as any).sponsorIdx].name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-xl object-cover border border-white/15"
                          />
                          <div className="min-w-0 flex-1">
                            <a
                              href={SIDEBAR_ADS[(item as any).sponsorIdx].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate text-[#D4AF37] font-extrabold hover:underline"
                            >
                              {SIDEBAR_ADS[(item as any).sponsorIdx].name}
                            </a>
                            <div className="truncate text-[12px] text-white/55">
                              {SIDEBAR_ADS[(item as any).sponsorIdx].tagline}
                            </div>
                          </div>
                          <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#D4AF37]">
                            Sponsored
                          </span>
                        </div>
                      ) : (
                        <div
                          key={(item as any)._id ?? `r-${idx}`}
                          className="flex items-start gap-3 px-3 py-4"
                        >
                          {/* Thumbnail (business only if available) */}
                          <img
                            src={
                              (item as any).__kind === "business"
                                ? (item as any).image || "/default-image.jpg"
                                : "/default-image.jpg"
                            }
                            alt={getTitle(item as Row) || "Listing"}
                            width={48}
                            height={48}
                            className="mt-0.5 h-12 w-12 rounded-xl object-cover border border-white/15 bg-black/40"
                            onError={handleImageError}
                          />

                          {/* Google-like text block */}
                          <div className="min-w-0 flex-1">
                            {/* Title must always be clickable */}
                            <Link
                              href={getHref(item as Row)}
                              className="block truncate text-[#D4AF37] font-extrabold hover:underline"
                            >
                              {getTitle(item as Row) || "Untitled Listing"}
                            </Link>

                            {/* Details line: rating · price · category */}
                            <div className="mt-0.5 text-[12px] text-white/70">
                              {getRatingLine(item as Row) ||
                                getCategoryLabel(item as Row) ||
                                ""}
                            </div>

                            {/* Location line ALWAYS shown (city/state preferred) */}
                            <div className="mt-0.5 text-[12px] text-white/55">
                              {getLocation(item as Row) ||
                                "Location not available"}
                            </div>

                            {/* Snippet line (quote-style like your example) */}
                            <div
                              className="mt-1 text-[12px] text-white/65"
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical" as any,
                                WebkitLineClamp: 2 as any,
                                overflow: "hidden",
                              }}
                            >
                              {getDesc(item as Row)
                                ? `“${getDesc(item as Row)}”`
                                : "“Description not available.”"}
                            </div>
                          </div>

                          {/* Right mini meta (phone) */}
                          <div className="hidden sm:block min-w-[120px] text-right text-[11px] text-white/55">
                            {(item as any).phone ? (
                              <div className="truncate">
                                {safeStr((item as any).phone)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Bottom pager */}
                {hasSearched && total > 0 ? (
                  <Pager
                    page={page}
                    totalPages={totalPages}
                    onPage={goPage}
                    disabled={isLoading}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
                <div className="text-[11px] uppercase tracking-widest text-white/50 font-extrabold mb-3">
                  Sponsored
                </div>
                <div className="space-y-3">
                  {SIDEBAR_ADS.map((ad) => (
                    <SidebarAdCard key={ad.url} {...ad} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
                <div className="text-[12px] font-extrabold text-[#D4AF37]">
                  Want your business featured?
                </div>
                <div className="mt-1 text-[12px] text-white/60">
                  Get premium placement in search results.
                </div>
                <Link
                  href="/advertise-with-us"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#D4AF37] px-4 py-2.5 text-[12px] font-extrabold text-black transition hover:bg-yellow-500"
                >
                  Advertise
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
