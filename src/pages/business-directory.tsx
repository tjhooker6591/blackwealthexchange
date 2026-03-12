/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { useRouter } from "next/router";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  buildDirectoryUrlQuery,
  normalizeScope,
  normalizeSort,
} from "@/lib/directory/queryState";

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

function trackFlowEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);
  const url = "/api/flow-events";
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

type RecentBiz = {
  alias: string;
  name: string;
  ts: number;
};

function getRecentBiz(): RecentBiz[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("bwe:recent-businesses");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean).slice(0, 6) : [];
  } catch {
    return [];
  }
}

function toInt(v: any, def: number) {
  const n = parseInt(safeStr(v), 10);
  return Number.isFinite(n) ? n : def;
}

const DEFAULT_SPONSOR_ADS = [
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

function injectSponsoredEveryN(
  rows: Row[],
  sponsorAds: Array<{
    img: string;
    name: string;
    tagline: string;
    url: string;
    cta: string;
  }>,
  interval = 5,
) {
  if (!sponsorAds.length) return rows;
  const out: Array<Row | { isSponsor: true; sponsorIdx: number; key: string }> =
    [];
  let sponsorIdx = 0;
  for (let i = 0; i < rows.length; i++) {
    out.push(rows[i]);
    if ((i + 1) % interval === 0) {
      out.push({
        isSponsor: true,
        sponsorIdx: sponsorIdx % sponsorAds.length,
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
  const [sort, setSort] = useState("relevance");
  const [stateFilter, setStateFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sponsoredFirst, setSponsoredFirst] = useState(false);
  const [includeIncomplete, setIncludeIncomplete] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [recentBiz, setRecentBiz] = useState<RecentBiz[]>([]);
  const [recent, setRecent] = useState<RecentBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [sponsorAds, setSponsorAds] = useState(DEFAULT_SPONSOR_ADS);
  const [serverPaged, setServerPaged] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setRecent(getRecentBusinesses());
  }, [router.asPath]);

  useEffect(() => {
    setRecentBiz(getRecentBiz());
  }, [router.asPath]);

  const hasActiveFilters =
    (scope === "businesses" && category !== "All") ||
    Boolean(stateFilter) ||
    verifiedOnly ||
    sponsoredFirst ||
    includeIncomplete ||
    sort !== "relevance";

  const rescueCategories = useMemo(() => {
    const seed = input.trim().toLowerCase();
    if (seed.includes("food") || seed.includes("restaurant")) {
      return ["Food", "Shopping", "Health", "Beauty"];
    }
    if (seed.includes("law") || seed.includes("legal")) {
      return ["Professional Services", "Education", "Health", "Shopping"];
    }
    return ["Food", "Shopping", "Beauty", "Health"];
  }, [input]);

  const rescueStates = useMemo(() => {
    const base = ["CA", "GA", "TX", "NY", "FL"];
    return stateFilter
      ? [stateFilter, ...base.filter((x) => x !== stateFilter)]
      : base;
  }, [stateFilter]);

  const didInitFromUrl = useRef(false);
  const skipNextPageResetRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sponsored-businesses", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        const incoming = Array.isArray(data?.sponsors) ? data.sponsors : [];
        if (!cancelled && incoming.length) {
          setSponsorAds(
            incoming.map((x: any) => ({
              img: safeStr(x?.img) || "/default-image.jpg",
              name: safeStr(x?.name) || "Sponsored Business",
              tagline:
                safeStr(x?.tagline) || "Featured on Black Wealth Exchange",
              url: safeStr(x?.url) || "#",
              cta: safeStr(x?.cta) || "Learn More",
            })),
          );
        }
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    const s = normalizeSort(router.query.sort);
    const st = typeof router.query.state === "string" ? router.query.state : "";
    const vo = String(router.query.verifiedOnly ?? "0") === "1";
    const sp = String(router.query.sponsoredFirst ?? "0") === "1";
    const inc = String(router.query.includeIncomplete ?? "0") === "1";

    if (q) setInput(q);
    if (scope === "businesses") setCategory(cat || "All");
    setSort(s);
    setStateFilter(st ? st.toUpperCase().slice(0, 2) : "");
    setVerifiedOnly(vo);
    setSponsoredFirst(sp);
    setIncludeIncomplete(inc);
    skipNextPageResetRef.current = true;
    setPage(Math.max(1, p));

    didInitFromUrl.current = true;
  }, [
    router.isReady,
    router.query.search,
    router.query.q,
    router.query.category,
    router.query.page,
    router.query.sort,
    router.query.state,
    router.query.verifiedOnly,
    router.query.sponsoredFirst,
    router.query.includeIncomplete,
    scope,
  ]);

  // Sync URL shallowly
  useEffect(() => {
    if (!router.isReady) return;
    if (!didInitFromUrl.current) return;

    const nextQuery = buildDirectoryUrlQuery({
      routerQuery: router.query,
      scope,
      input,
      page,
      category,
      sort,
      stateFilter,
      verifiedOnly,
      sponsoredFirst,
      includeIncomplete,
    });

    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    input,
    category,
    page,
    scope,
    sort,
    stateFilter,
    verifiedOnly,
    sponsoredFirst,
    includeIncomplete,
  ]);

  // Reset page when query changes
  useEffect(() => {
    if (skipNextPageResetRef.current) {
      skipNextPageResetRef.current = false;
      return;
    }
    setPage(1);
  }, [
    input,
    category,
    scope,
    sort,
    stateFilter,
    verifiedOnly,
    sponsoredFirst,
    includeIncomplete,
  ]);

  // Fetch
  useEffect(() => {
    const q = input.trim();

    const hasAnyFilter = Boolean(q) || hasActiveFilters;
    if (!hasAnyFilter) {
      setRows([]);
      setTotal(0);
      setHasSearched(false);
      setServerPaged(false);
      return;
    }

    setIsLoading(true);
    setFetchError("");

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
      params.set("sort", sort);
      if (stateFilter) params.set("state", stateFilter);
      if (verifiedOnly) params.set("verifiedOnly", "1");
      if (sponsoredFirst) params.set("sponsoredFirst", "1");
      if (includeIncomplete) params.set("includeIncomplete", "1");
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
            setFetchError("Could not load directory results. Please retry.");
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
  }, [
    input,
    category,
    page,
    scope,
    sort,
    stateFilter,
    verifiedOnly,
    sponsoredFirst,
    includeIncomplete,
    hasActiveFilters,
  ]);

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
    () => injectSponsoredEveryN(pageRows, sponsorAds, 5),
    [pageRows, sponsorAds],
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
    if (r.__kind === "org") return `/organizations/${slug}`;

    const qp = new URLSearchParams();
    qp.set("from", "directory");
    if (input.trim()) qp.set("q", input.trim());

    return `/business-directory/${slug}?${qp.toString()}`;
  };

  const getTrustMeta = (r: Row) => {
    const status = safeStr((r as any).status).toLowerCase();
    const verified =
      (r as any).verified === true ||
      (r as any).isVerified === true ||
      status === "verified";

    const approved = status === "approved" || status === "verified" || !status;
    const sponsored = Number((r as any).amountPaid || 0) > 0;

    const completenessScore = Math.max(
      0,
      Math.min(100, Number((r as any).completenessScore || 0)),
    );

    const isComplete =
      typeof (r as any).isComplete === "boolean"
        ? (r as any).isComplete
        : completenessScore >= 70;

    const qualityTier = verified
      ? "high"
      : isComplete
        ? "medium"
        : "basic";

    return { verified, approved, sponsored, isComplete, completenessScore, qualityTier };
  };

  const getWebsite = (r: Row) => safeStr((r as any).website);
  const getPhone = (r: Row) => safeStr((r as any).phone);

  const sponsorsToShow = [
    ...sponsorAds,
    ...Array(Math.max(0, 10 - sponsorAds.length)).fill({
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

  useEffect(() => {
    if (!hasSearched || isLoading || total !== 0) return;
    trackFlowEvent({
      eventType: "no_results_shown",
      source: "business_directory",
      query: input.trim(),
      category,
      state: stateFilter,
    });
  }, [hasSearched, isLoading, total, input, category, stateFilter]);

  const canonical = canonicalUrl("/business-directory");
  const title = "Black-Owned Business Directory | Find Verified Black Businesses Near You";
  const description = truncateMeta(
    "Search Black-owned businesses by category and location. Discover verified listings, trusted profiles, and local services on Black Wealth Exchange.",
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
      </Head>
      {/* subtle glows like index */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[520px] w-[520px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-6">
        {/* Header */}
        <div className="relative mb-5 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_90px_rgba(0,0,0,0.55)] sm:p-5">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[40rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-[-6rem] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {scope === "organizations"
                    ? "Organizations Directory"
                    : "Business Directory"}
                  <span className="ml-2 text-[#D4AF37]">• Trusted Search</span>
                </h1>
                <p className="mt-1 text-sm text-white/65 sm:text-base">
                  Premium discovery flow with clean ranking, trust cues, and
                  faster decisions.
                </p>
                <details className="mt-2 max-w-2xl rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                  <summary className="cursor-pointer list-none font-semibold text-white/75">
                    Quick paths
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href="/black-owned-businesses" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Find Black-owned businesses by city</Link>
                    <Link href="/shop-black-owned-products" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Shop Black-owned products</Link>
                    <Link href="/black-jobs" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Explore Black jobs</Link>
                  </div>
                </details>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Trusted listings
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push({
                    pathname: "/business-directory",
                    query: {
                      ...router.query,
                      type: "businesses",
                      scope: "businesses",
                      tab: "businesses",
                      page: 1,
                    },
                  })
                }
                className={cx(
                  "rounded-xl border px-3 py-2 text-xs font-extrabold tracking-wide transition",
                  scope === "businesses"
                    ? "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]"
                    : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                )}
              >
                Businesses
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push({
                    pathname: "/business-directory",
                    query: {
                      ...router.query,
                      type: "organizations",
                      scope: "organizations",
                      tab: "organizations",
                      page: 1,
                    },
                  })
                }
                className={cx(
                  "rounded-xl border px-3 py-2 text-xs font-extrabold tracking-wide transition",
                  scope === "organizations"
                    ? "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]"
                    : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                )}
              >
                Organizations
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/75">
              <span className="font-semibold text-white/85">Ranking:</span> Trust + relevance first. Verified and higher-quality profiles are prioritized.
            </div>
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
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur">
              <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-[30rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <input
                    type="text"
                    placeholder={
                      scope === "organizations"
                        ? "Search churches, nonprofits, orgs…"
                        : "Find Black-owned businesses…"
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-4 py-3 text-[14px] text-white placeholder:text-white/35 outline-none transition focus:border-[#D4AF37]/40 focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </div>
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
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    setPage(1);
                  }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[12px] font-bold text-white/75 transition hover:bg-white/[0.06]"
                  title="Clear search"
                >
                  Clear
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                <span>
                  Use search first, then narrow with filters if needed.
                </span>
                <span className="inline-flex items-center gap-1 text-white/45">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters are optional
                </span>
              </div>
            </div>

            {/* Filter/sort controls */}
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[11px] font-bold text-white/55">
                    Sort
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(normalizeSort(e.target.value))}
                    className="mt-1 w-full bg-transparent text-sm text-white outline-none"
                  >
                    <option value="relevance">Relevance (best match)</option>
                    <option value="newest">Newest</option>
                    <option value="completeness">Completeness</option>
                  </select>
                </label>

                <label className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[11px] font-bold text-white/55">
                    State
                  </div>
                  <input
                    value={stateFilter}
                    onChange={(e) =>
                      setStateFilter(e.target.value.toUpperCase().slice(0, 2))
                    }
                    placeholder="CA"
                    className="mt-1 w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                  <span className="font-semibold text-white/80">
                    Verified only
                  </span>
                  <button
                    type="button"
                    onClick={() => setVerifiedOnly((v) => !v)}
                    className={cx(
                      "relative h-6 w-11 rounded-full border transition",
                      verifiedOnly
                        ? "border-emerald-400/40 bg-emerald-400/20"
                        : "border-white/10 bg-black/30",
                    )}
                    aria-label="Toggle verified-only results"
                    aria-pressed={verifiedOnly}
                  >
                    <span
                      className={cx(
                        "absolute top-0.5 h-5 w-5 rounded-full transition",
                        verifiedOnly
                          ? "left-5 bg-emerald-300"
                          : "left-0.5 bg-white/60",
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                  <span className="font-semibold text-white/80">
                    Sponsored first
                  </span>
                  <button
                    type="button"
                    onClick={() => setSponsoredFirst((v) => !v)}
                    className={cx(
                      "relative h-6 w-11 rounded-full border transition",
                      sponsoredFirst
                        ? "border-[#D4AF37]/50 bg-[#D4AF37]/15"
                        : "border-white/10 bg-black/30",
                    )}
                    aria-label="Toggle sponsored-first ordering"
                    aria-pressed={sponsoredFirst}
                  >
                    <span
                      className={cx(
                        "absolute top-0.5 h-5 w-5 rounded-full transition",
                        sponsoredFirst
                          ? "left-5 bg-[#D4AF37]"
                          : "left-0.5 bg-white/60",
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm sm:col-span-2 lg:col-span-4">
                  <span className="font-semibold text-white/80">
                    Show incomplete listings
                  </span>
                  <button
                    type="button"
                    onClick={() => setIncludeIncomplete((v) => !v)}
                    className={cx(
                      "relative h-6 w-11 rounded-full border transition",
                      includeIncomplete
                        ? "border-sky-400/40 bg-sky-400/20"
                        : "border-white/10 bg-black/30",
                    )}
                    aria-label="Toggle incomplete listing visibility"
                    aria-pressed={includeIncomplete}
                  >
                    <span
                      className={cx(
                        "absolute top-0.5 h-5 w-5 rounded-full transition",
                        includeIncomplete
                          ? "left-5 bg-sky-300"
                          : "left-0.5 bg-white/60",
                      )}
                    />
                  </button>
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("All");
                      setSort("relevance");
                      setStateFilter("");
                      setVerifiedOnly(false);
                      setSponsoredFirst(false);
                      setIncludeIncomplete(false);
                      setPage(1);
                    }}
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-bold text-white/80 transition hover:bg-black/45"
                  >
                    Clear filters
                  </button>
                ) : (
                  <span className="text-xs text-white/45">
                    No active filters
                  </span>
                )}

                {scope === "businesses" && category !== "All" && (
                  <span className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-1 text-[11px] font-bold text-[#D4AF37]">
                    Category: {category}
                  </span>
                )}
                {stateFilter && (
                  <span className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-[11px] font-bold text-white/80">
                    State: {stateFilter}
                  </span>
                )}
                {sort !== "relevance" && (
                  <span className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-[11px] font-bold text-white/80">
                    Sort: {sort}
                  </span>
                )}
                {verifiedOnly && (
                  <span className="rounded-lg border border-emerald-400/30 bg-emerald-400/15 px-2 py-1 text-[11px] font-bold text-emerald-200">
                    Verified only
                  </span>
                )}
                {sponsoredFirst && (
                  <span className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-1 text-[11px] font-bold text-[#D4AF37]">
                    Sponsored first
                  </span>
                )}
                {includeIncomplete && (
                  <span className="rounded-lg border border-sky-400/30 bg-sky-400/15 px-2 py-1 text-[11px] font-bold text-sky-200">
                    Showing incomplete listings
                  </span>
                )}
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
                  <div className="absolute inset-0 z-20 rounded-xl bg-black/70 p-4 backdrop-blur-sm">
                    <div className="mb-3 h-4 w-40 animate-pulse rounded bg-white/10" />
                    <div className="space-y-2">
                      <div className="h-14 animate-pulse rounded-lg bg-white/10" />
                      <div className="h-14 animate-pulse rounded-lg bg-white/10" />
                      <div className="h-14 animate-pulse rounded-lg bg-white/10" />
                    </div>
                  </div>
                )}

                {fetchError ? (
                  <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {fetchError}
                  </div>
                ) : null}

                {!hasSearched ? (
                  <div className="py-10 text-center text-white/50">
                    Discover and support Black-owned businesses & organizations.
                    Start your search above.
                  </div>
                ) : total === 0 && !isLoading ? (
                  <div className="py-10 text-center text-white/50">
                    <div>
                      No results found for{" "}
                      <span className="text-white/70">“{input.trim()}”</span>.
                    </div>
                    <div className="mt-2 text-xs text-white/40">
                      Try a broader term, clear filters, or switch between
                      Businesses and Organizations.
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                      {scope === "businesses" && category !== "All" ? (
                        <span className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-1 text-[#D4AF37]">
                          Category: {category}
                        </span>
                      ) : null}
                      {stateFilter ? (
                        <span className="rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-white/80">
                          State: {stateFilter}
                        </span>
                      ) : null}
                      {verifiedOnly ? (
                        <span className="rounded-lg border border-emerald-400/40 bg-emerald-400/15 px-2 py-1 text-emerald-200">
                          Verified only
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCategory("All");
                          setSort("relevance");
                          setStateFilter("");
                          setVerifiedOnly(false);
                          setSponsoredFirst(false);
                          setIncludeIncomplete(false);
                          setPage(1);
                          trackFlowEvent({
                            eventType: "filter_relaxed",
                            source: "business_directory_no_result",
                            query: input.trim(),
                            category,
                            state: stateFilter,
                          });
                        }}
                        className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-black/45"
                      >
                        Clear filters
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInput("");
                          setPage(1);
                          trackFlowEvent({
                            eventType: "rescue_action_clicked",
                            source: "business_directory_no_result",
                            query: input.trim(),
                          });
                        }}
                        className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-black/45"
                      >
                        Clear search
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 text-center">
                      <p className="text-[11px] uppercase tracking-wide text-white/45">
                        Continue your intent
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {rescueCategories.map((cat) => (
                          <button
                            key={`rescue-cat-${cat}`}
                            type="button"
                            onClick={() => {
                              setCategory(cat);
                              setVerifiedOnly(false);
                              setPage(1);
                              trackFlowEvent({
                                eventType: "suggested_category_clicked",
                                source: "business_directory_no_result",
                                query: input.trim(),
                                category: cat,
                              });
                            }}
                            className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] text-white/85"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {rescueStates.slice(0, 3).map((st) => (
                          <button
                            key={`rescue-state-${st}`}
                            type="button"
                            onClick={() => {
                              setStateFilter(st);
                              setVerifiedOnly(false);
                              setPage(1);
                              trackFlowEvent({
                                eventType: "rescue_action_clicked",
                                source: "business_directory_no_result_state",
                                query: input.trim(),
                                state: st,
                              });
                            }}
                            className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] text-white/85"
                          >
                            Try {st}
                          </button>
                        ))}
                        <Link
                          href="/search-results"
                          className="rounded-full border border-[#D4AF37]/45 bg-[#D4AF37]/15 px-3 py-1 text-[11px] text-[#F1D57A]"
                        >
                          Open Search Results
                        </Link>
                      </div>
                    </div>
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
                            src={sponsorAds[(item as any).sponsorIdx].img}
                            alt={sponsorAds[(item as any).sponsorIdx].name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-xl object-cover border border-white/15"
                          />
                          <div className="min-w-0 flex-1">
                            <a
                              href={sponsorAds[(item as any).sponsorIdx].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate text-[#D4AF37] font-extrabold hover:underline"
                            >
                              {sponsorAds[(item as any).sponsorIdx].name}
                            </a>
                            <div className="truncate text-[12px] text-white/55">
                              {sponsorAds[(item as any).sponsorIdx].tagline}
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

                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {getTrustMeta(item as Row).verified ? (
                                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                                  Verified
                                </span>
                              ) : getTrustMeta(item as Row).approved ? (
                                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/75">
                                  Approved listing
                                </span>
                              ) : null}
                              {getTrustMeta(item as Row).sponsored && (
                                <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                                  Sponsored
                                </span>
                              )}
                              {!getTrustMeta(item as Row).isComplete && (
                                <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                                  Incomplete profile
                                </span>
                              )}
                              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/75">
                                Quality score {Math.round(getTrustMeta(item as Row).completenessScore)}
                              </span>
                            </div>

                            {/* Details line: rating · price · category */}
                            <div className="mt-1 text-[12px] text-white/70">
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

                            <div className="mt-2 flex flex-wrap gap-2">
                              <Link
                                href={getHref(item as Row)}
                                className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[11px] font-extrabold text-black hover:bg-yellow-500"
                              >
                                View details
                              </Link>
                              {getWebsite(item as Row) ? (
                                <a
                                  href={getWebsite(item as Row)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white/80 hover:bg-black/45"
                                >
                                  Website
                                </a>
                              ) : null}
                              {getLocation(item as Row) ? (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getLocation(item as Row))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white/80 hover:bg-black/45"
                                >
                                  Directions
                                </a>
                              ) : null}
                            </div>
                          </div>

                          {/* Right mini meta (phone) */}
                          <div className="hidden sm:block min-w-[140px] text-right text-[11px] text-white/55">
                            {getPhone(item as Row) ? (
                              <a
                                href={`tel:${getPhone(item as Row)}`}
                                className="truncate underline hover:text-white/80"
                              >
                                {getPhone(item as Row)}
                              </a>
                            ) : (
                              <div className="text-white/35">
                                No phone listed
                              </div>
                            )}
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
                  {sponsorAds.map((ad) => (
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
