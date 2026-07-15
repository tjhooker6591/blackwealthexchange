/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
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

function splitCategoryTokens(v: any): string[] {
  const raw = categoriesToString(v);
  if (!raw) return [];
  return raw
    .split(/[,&/|]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function trackFlowEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);
  const url = "/api/search/quality-events";
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

function toInt(v: any, def: number) {
  const n = parseInt(safeStr(v), 10);
  return Number.isFinite(n) ? n : def;
}

function normalizeWebsiteUrl(url: string) {
  const raw = safeStr(url).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

function formatCategoryDisplay(raw: any) {
  const text = categoriesToString(raw)
    .split(/[,&/|]/g)
    .map((part) => safeStr(part))
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "healthcare") return "Health Care";
      if (lower === "nonprofit" || lower === "non-profit") return "Nonprofit";
      if (lower === "restaurants") return "Restaurant";
      if (lower === "beauty salons") return "Beauty Salon";
      return part
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });

  return Array.from(new Set(text)).slice(0, 3).join(" • ");
}

function normalizeClaimStage(value: any) {
  const normalized = safeStr(value).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "claim_pending") return "claim_initiated";
  if (normalized === "pending_review") return "ownership_verification_pending";
  if (normalized === "ownership_review_pending")
    return "ownership_verification_pending";
  if (normalized === "verification_pending")
    return "ownership_verification_pending";
  if (normalized === "approved") return "ownership_verified";
  if (normalized === "ownership_approved") return "ownership_verified";
  if (normalized === "rejected") return "ownership_verification_failed";
  if (normalized === "ownership_rejected")
    return "ownership_verification_failed";
  return normalized;
}

function resolveDirectoryOwnershipState(row: any) {
  const statuses = [
    normalizeClaimStage(row?.publicListingStatus),
    normalizeClaimStage(row?.claimStage),
    normalizeClaimStage(row?.ownershipReviewStatus),
  ].filter(Boolean);

  const canonicalState = statuses.includes("ownership_verified")
    ? "ownership_verified"
    : statuses.includes("ownership_verification_failed")
      ? "ownership_verification_failed"
      : statuses.includes("disputed")
        ? "disputed"
        : statuses.includes("additional_evidence_required")
          ? "additional_evidence_required"
          : statuses.includes("ownership_verification_pending") ||
              statuses.includes("claim_initiated")
            ? "ownership_verification_pending"
            : null;

  return {
    canonicalState,
    isOwnershipVerified: canonicalState === "ownership_verified",
  };
}

function formatStateDisplay(value: any) {
  const state = safeStr(value).trim();
  if (!state) return "";
  return state.length === 2 ? state.toUpperCase() : state;
}

function buildLocationDisplay(parts: {
  city?: any;
  state?: any;
  address?: any;
}) {
  const city = safeStr(parts.city).trim();
  const state = formatStateDisplay(parts.state);
  const address = safeStr(parts.address).trim();
  const cityState = [city, state].filter(Boolean).join(", ");
  return cityState || address || "";
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

type PlacementCard = {
  id: string;
  name: string;
  tagline: string;
  image: string;
  targetUrl: string;
  startsAt?: string | null;
  endsAt?: string | null;
};

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

type BusinessDirectoryProps = {
  initialRows: Row[];
  initialTotal: number;
};

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
        loading="lazy"
        decoding="async"
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

function SidebarAdCard({
  img,
  name,
  tagline,
  url,
  cta,
  label = "Sponsored",
}: any) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
    >
      <div className="pointer-events-none absolute -top-14 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <span className="absolute top-3 right-3 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-extrabold text-white/70">
        {label}
      </span>
      <div className="flex items-start gap-3">
        <img
          src={img}
          className="h-12 w-12 object-cover rounded-xl border border-white/15 shadow"
          alt={name}
          loading="lazy"
          decoding="async"
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

export default function BusinessDirectory({
  initialRows,
  initialTotal,
}: BusinessDirectoryProps) {
  const router = useRouter();
  const claimMode = router.isReady && router.query.mode === "claim";

  // Scope is driven by query (index pushes type/scope/tab)
  const scope: DirectoryScope = useMemo(() => {
    if (!router.isReady) return "businesses";
    return normalizeScope(
      router.query.type ?? router.query.scope ?? router.query.tab,
    );
  }, [router.isReady, router.query.type, router.query.scope, router.query.tab]);

  // Categories only apply to businesses
  const CATEGORY_COUNTS: Record<string, number> = {
    Barbershop: 126,
    Dining: 8,
    Food: 8,
    Health: 6,
    Wellness: 6,
    Shopping: 0,
    Beauty: 0,
    "Financial Services": 0,
    "Professional Services": 3,
    Clothing: 0,
    "Real Estate": 1,
    Technology: 1,
  };
  const PRIMARY_CATEGORIES = [
    "All",
    "Barbershop",
    "Dining",
    "Food",
    "Health",
    "Wellness",
  ];
  const MORE_CATEGORIES = [
    "Shopping",
    "Beauty",
    "Financial Services",
    "Professional Services",
    "Clothing",
    "Real Estate",
    "Technology",
    "Wellness",
  ];

  const [input, setInput] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("relevance");
  const [stateFilter, setStateFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sponsoredFirst, setSponsoredFirst] = useState(false);
  const [includeIncomplete, setIncludeIncomplete] = useState(false);

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [sponsorAds, setSponsorAds] = useState(DEFAULT_SPONSOR_ADS);
  const [directoryFeaturedAds, setDirectoryFeaturedAds] = useState<
    PlacementCard[]
  >([]);
  const [sidebarBannerAds, setSidebarBannerAds] = useState<PlacementCard[]>([]);
  const [serverPaged, setServerPaged] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(initialRows.length > 0);
  const [fetchError, setFetchError] = useState("");
  const [queryMode, setQueryMode] = useState<string>("strict");
  const [searchMeta, setSearchMeta] = useState<{
    strictTokens?: string[];
    intentTokens?: string[];
    locationTokens?: string[];
    usedFallback?: boolean;
    noExactCategoryMatchInLocation?: boolean;
  } | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 20;

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
  const didUseInitialResultsRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sponsorsRes, placementsRes] = await Promise.all([
          fetch("/api/sponsored-businesses", {
            cache: "no-store",
          }),
          fetch("/api/advertising/public-placements", {
            cache: "no-store",
          }),
        ]);

        const sponsorData = await sponsorsRes.json().catch(() => null);
        const incoming = Array.isArray(sponsorData?.sponsors)
          ? sponsorData.sponsors
          : [];
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

        const placementsData = await placementsRes.json().catch(() => null);
        if (!cancelled && placementsData?.ok) {
          setDirectoryFeaturedAds(
            Array.isArray(placementsData?.placements?.directoryFeatured)
              ? placementsData.placements.directoryFeatured
              : [],
          );
          setSidebarBannerAds(
            Array.isArray(placementsData?.placements?.bannerSidebar)
              ? placementsData.placements.bannerSidebar
              : [],
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
      if (scope === "businesses" && initialRows.length > 0) {
        didUseInitialResultsRef.current = true;
        setRows(initialRows);
        setTotal(initialTotal);
        setHasSearched(true);
        setServerPaged(true);
        setQueryMode("strict");
        setSearchMeta(null);
        setFetchError("");
        setIsLoading(false);
        return;
      }

      setRows([]);
      setTotal(0);
      setHasSearched(false);
      setServerPaged(false);
      setQueryMode("strict");
      setSearchMeta(null);
      return;
    }

    if (
      scope === "businesses" &&
      !q &&
      !hasActiveFilters &&
      initialRows.length > 0 &&
      !didUseInitialResultsRef.current
    ) {
      didUseInitialResultsRef.current = true;
      setRows(initialRows);
      setTotal(initialTotal);
      setHasSearched(true);
      setServerPaged(true);
      setQueryMode("strict");
      setSearchMeta(null);
      setFetchError("");
      setIsLoading(false);
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

      fetch(`/api/search/businesses?${params.toString()}`, {
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
            setQueryMode("strict");
            setSearchMeta(null);
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
            setQueryMode(
              typeof data.queryMode === "string" ? data.queryMode : "strict",
            );
            setSearchMeta(data.searchMeta || null);
            const serverPage = toInt(data.page, page);
            if (serverPage !== page) {
              skipNextPageResetRef.current = true;
              setPage(serverPage);
            }
            return;
          }

          setRows([]);
          setTotal(0);
          setServerPaged(false);
          setHasSearched(true);
          setQueryMode("strict");
          setSearchMeta(null);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            setRows([]);
            setTotal(0);
            setServerPaged(false);
            setHasSearched(true);
            setQueryMode("strict");
            setSearchMeta(null);
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
    // Server-side filtering is canonical for paged results; avoid double-filter mismatch.
    if (serverPaged) return rows;

    if (scope !== "businesses") return rows;
    if (!category || category === "All") return rows;

    const want = category.toLowerCase();
    return rows.filter((r: any) => {
      const catStr = categoriesToString(
        r.categories || r.category || r.display_categories || "",
      ).toLowerCase();
      return catStr.includes(want);
    });
  }, [rows, scope, category, serverPaged]);

  // Pagination fallback
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  const pageRows = useMemo(() => {
    if (serverPaged) return filteredRows;
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, serverPaged, page]);

  const visibleWithSponsors = useMemo(() => pageRows, [pageRows]);

  useEffect(() => {
    if (!hasSearched) return;
    trackFlowEvent({
      eventType: "search_results_loaded",
      query: input.trim(),
      resultCount: total,
      filters: {
        scope,
        category,
        stateFilter,
        verifiedOnly,
        sponsoredFirst,
        includeIncomplete,
      },
    });
  }, [
    hasSearched,
    input,
    total,
    scope,
    category,
    stateFilter,
    verifiedOnly,
    sponsoredFirst,
    includeIncomplete,
  ]);
  const approximateMode =
    hasSearched && total > 0 && queryMode !== "strict" && Boolean(input.trim());

  const curatedVisibleRows = useMemo(() => {
    const qualityRank = (q: string) => {
      const quality = safeStr(q).toLowerCase();
      if (quality === "exact") return 3;
      if (quality === "close") return 2;
      return 1;
    };

    const qualitySorted = [...visibleWithSponsors].sort((a: any, b: any) => {
      const aq = qualityRank(a?._matchQuality);
      const bq = qualityRank(b?._matchQuality);
      if (bq !== aq) return bq - aq;

      const aVerified = a?.isVerified === true || a?.verified === true;
      const bVerified = b?.isVerified === true || b?.verified === true;
      if (aVerified !== bVerified) return bVerified ? 1 : -1;

      const aComplete =
        typeof a?.isComplete === "boolean"
          ? a.isComplete
          : Number(a?.completenessScore || a?.qualityScore || 0) >= 70;
      const bComplete =
        typeof b?.isComplete === "boolean"
          ? b.isComplete
          : Number(b?.completenessScore || b?.qualityScore || 0) >= 70;
      if (aComplete !== bComplete) return bComplete ? 1 : -1;

      const aStrength = Number(a?._listingStrength || 0);
      const bStrength = Number(b?._listingStrength || 0);
      return bStrength - aStrength;
    });

    if (!approximateMode) return qualitySorted;

    const filtered = qualitySorted.filter((row: any) => {
      const quality = safeStr(row?._matchQuality).toLowerCase();
      const strength = Number(row?._listingStrength || 0);
      const hasUsefulDescription =
        safeStr(row?.description).trim().length >= 24;
      const hasUsefulLocation =
        Boolean(safeStr(row?.locationDisplay).trim()) ||
        Boolean(safeStr(row?.city).trim()) ||
        Boolean(safeStr(row?.state).trim()) ||
        Boolean(safeStr(row?.address).trim());
      const hasUsefulCategory =
        Boolean(safeStr(row?.primaryCategory).trim()) ||
        Boolean(safeStr(row?.category).trim()) ||
        Boolean(safeStr(row?.categories).trim()) ||
        Boolean(safeStr(row?.display_categories).trim()) ||
        Boolean(safeStr(row?.orgType).trim());

      if (quality !== "approximate") return true;
      if (strength >= 62) return true;
      if ((hasUsefulDescription && hasUsefulLocation) || hasUsefulCategory) {
        return true;
      }
      return false;
    });

    return filtered.length >= 3 ? filtered : qualitySorted;
  }, [visibleWithSponsors, approximateMode]);

  const weakListingsSuppressedCount = Math.max(
    0,
    visibleWithSponsors.length - curatedVisibleRows.length,
  );

  const relatedCategorySuggestions = useMemo(() => {
    if (scope !== "businesses") return [] as string[];
    const counts = new Map<string, number>();

    pageRows.forEach((row) => {
      if ((row as any).__kind !== "business") return;
      const tokens = splitCategoryTokens(
        (row as any).display_categories ||
          (row as any).categories ||
          (row as any).category,
      );
      tokens.forEach((token) => {
        const current = counts.get(token) || 0;
        counts.set(token, current + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .filter((name) => name.toLowerCase() !== category.toLowerCase())
      .slice(0, 5);
  }, [pageRows, scope, category]);

  const isApproximateSearch = approximateMode;

  const suggestedRefinement = useMemo(() => {
    const intent = (searchMeta?.intentTokens || [])[0] || "";
    const location = (searchMeta?.locationTokens || [])[0] || "";
    if (intent && location) return `${intent} in ${location}`;
    return intent || location || "";
  }, [searchMeta]);

  const exactMatchCount = useMemo(
    () =>
      curatedVisibleRows.filter(
        (row: any) => safeStr(row?._matchQuality).toLowerCase() === "exact",
      ).length,
    [curatedVisibleRows],
  );

  const approximateCount = useMemo(
    () =>
      curatedVisibleRows.filter(
        (row: any) =>
          safeStr(row?._matchQuality).toLowerCase() === "approximate",
      ).length,
    [curatedVisibleRows],
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
    const normalized = safeStr((r as any).locationDisplay);
    if (normalized) return buildLocationDisplay({ address: normalized });

    return buildLocationDisplay({
      city: (r as any).city,
      state: (r as any).state,
      address: (r as any).address,
    });
  };

  const getCategoryLabel = (r: Row) => {
    const primaryCategory = safeStr((r as any).primaryCategory);
    if (primaryCategory) return formatCategoryDisplay(primaryCategory);

    if (r.__kind === "org") {
      const orgType = safeStr((r as any).orgType);
      const denom = safeStr((r as any).denomination);
      return formatCategoryDisplay(
        [orgType, denom].filter(Boolean).join(" · "),
      );
    }

    const display = safeStr((r as any).display_categories);
    const cats = categoriesToString(
      (r as any).categories || (r as any).category,
    );
    return formatCategoryDisplay(display || cats);
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
    const alias = safeStr((r as any).alias).trim();
    const slug = safeStr((r as any).slug).trim();
    return alias || slug;
  };

  const getHref = (r: Row) => {
    const sponsoredUrl = safeStr((r as any).website);
    if ((r as any).__sponsoredPlacement && /^https?:\/\//i.test(sponsoredUrl)) {
      return sponsoredUrl;
    }

    const kind = safeStr((r as any).kind || (r as any).__kind).toLowerCase();
    const orgLike = kind === "organization" || kind === "org";
    const slugKey = getSlug(r);
    const idKey = safeStr((r as any)._id);
    const key = encodeURIComponent(slugKey || idKey);

    if (orgLike) return `/organizations/${key}`;

    const qp = new URLSearchParams();
    qp.set("from", "directory");
    if (input.trim()) qp.set("q", input.trim());
    if (claimMode) qp.set("mode", "claim");

    return `/business/${key}?${qp.toString()}`;
  };

  const getTrustMeta = (r: Row) => {
    const status = safeStr(
      (r as any).listingStatus || (r as any).trustStatus || (r as any).status,
    ).toLowerCase();
    const ownershipState = resolveDirectoryOwnershipState(r as any);
    const verified =
      ownershipState.isOwnershipVerified ||
      (r as any).isVerified === true ||
      (r as any).verified === true ||
      status === "verified";

    const approved =
      (r as any).isApproved === true ||
      status === "approved" ||
      status === "verified" ||
      status === "active";

    const sponsored =
      (r as any).isSponsored === true || Number((r as any).amountPaid || 0) > 0;

    const isComplete =
      typeof (r as any).isComplete === "boolean"
        ? (r as any).isComplete
        : Number(
            (r as any).qualityScore || (r as any).completenessScore || 0,
          ) >= 70;

    const claimStage = ownershipState.isOwnershipVerified
      ? "ownership_verified"
      : ownershipState.canonicalState === "ownership_verification_pending"
        ? "ownership_verification_pending"
        : ownershipState.canonicalState === "additional_evidence_required"
          ? "additional_evidence_required"
          : ownershipState.canonicalState === "disputed"
            ? "disputed"
            : sponsored
              ? "founding_growth_member"
              : "unclaimed";

    return {
      verified,
      approved,
      sponsored,
      isComplete,
      claimStage,
      publicListingStatus: ownershipState.canonicalState,
    };
  };

  const getWebsite = (r: Row) =>
    normalizeWebsiteUrl(safeStr((r as any).website));
  const getPhone = (r: Row) => safeStr((r as any).phone).trim();

  const sponsorsToShow = sponsorAds.slice(0, 10);

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo =
    total === 0
      ? 0
      : Math.min((page - 1) * pageSize + curatedVisibleRows.length, total);
  const title =
    "Black-Owned Business Directory by City & Category | Black Wealth Exchange";
  const description = truncateMeta(
    "Search Black-owned businesses by city, state, and category in the Black Wealth Exchange directory. Use trust signals and filters to find, compare, and contact the right business faster.",
  );
  const canonical = canonicalUrl("/business-directory");
  const directorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: canonical,
  };

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

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={canonicalUrl("/images/hero1.jpg")} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={canonicalUrl("/images/hero1.jpg")}
        />
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(directorySchema)}
      </script>
      <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
        {/* subtle glows like index */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[520px] w-[520px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-6">
          {/* Header */}
          <div className="relative mb-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_90px_rgba(0,0,0,0.55)] sm:mb-5 sm:p-5">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[40rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 right-[-6rem] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-2 sm:items-end sm:gap-3">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                    {claimMode
                      ? "Find the business you want to claim"
                      : scope === "organizations"
                        ? "Black Organizations Directory"
                        : "Black-Owned Business Directory"}
                    <span className="ml-2 text-[#D4AF37]">
                      {claimMode ? "• Claim Mode" : "• City + Category Hub"}
                    </span>
                  </h1>
                  <p className="mt-1 text-xs text-white/70 sm:text-base">
                    {claimMode
                      ? "Search for your existing BWE listing, select it, and continue to the Founding Membership process. If your business is not listed yet, use the separate listing path below."
                      : "Use this directory hub to discover trusted listings by city, state, and category, then compare and contact the best fit."}
                  </p>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {claimMode ? "Claim guidance active" : "Trusted listings"}
                </span>
              </div>

              {claimMode ? (
                <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 text-sm text-white/80">
                  <div className="font-semibold text-yellow-200">
                    Claim process
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
                    <li>
                      Eligible public listings show{" "}
                      <span className="font-semibold text-yellow-200">
                        Claim This Listing
                      </span>
                      .
                    </li>
                    <li>
                      Claimed or ineligible listings show an unavailable state
                      and cannot continue.
                    </li>
                    <li>
                      Select an existing listing first. Creating a new listing
                      is a separate path.
                    </li>
                  </ul>
                  <div className="mt-3">
                    <Link
                      href="/business-directory/add-business"
                      className="text-yellow-300 underline underline-offset-4 hover:text-yellow-200"
                    >
                      Don’t see your listing yet? Create it here.
                    </Link>
                  </div>
                </div>
              ) : null}

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

              <div className="hidden sm:grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/50 font-bold">
                    Ranking
                  </div>
                  <div className="text-sm font-semibold text-white/80">
                    Trust + relevance first
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/50 font-bold">
                    Control
                  </div>
                  <div className="text-sm font-semibold text-white/80">
                    Strong filters, zero clutter
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-white/50 font-bold">
                    Goal
                  </div>
                  <div className="text-sm font-semibold text-white/80">
                    Find, vet, and contact quickly
                  </div>
                </div>
              </div>

              <details className="sm:hidden rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <summary className="cursor-pointer list-none text-xs font-bold text-white/85">
                  Why this directory?
                </summary>
                <div className="mt-2 grid gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/50 font-bold">
                      Ranking
                    </div>
                    <div className="text-xs font-semibold text-white/80">
                      Trust + relevance first
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/50 font-bold">
                      Control
                    </div>
                    <div className="text-xs font-semibold text-white/80">
                      Strong filters, zero clutter
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/50 font-bold">
                      Goal
                    </div>
                    <div className="text-xs font-semibold text-white/80">
                      Find, vet, and contact quickly
                    </div>
                  </div>
                </div>
              </details>

              <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/70">
                <span className="font-semibold text-white/85">
                  Popular discovery paths:
                </span>
                <Link
                  href="/black-owned-businesses/city/atlanta-ga"
                  className="rounded-full border border-white/15 px-3 py-1 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Atlanta, GA
                </Link>
                <Link
                  href="/black-owned-businesses/city/houston-tx"
                  className="rounded-full border border-white/15 px-3 py-1 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Houston, TX
                </Link>
                <Link
                  href="/black-owned-businesses/category/restaurant"
                  className="rounded-full border border-white/15 px-3 py-1 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Restaurants
                </Link>
                <Link
                  href="/black-owned-businesses/category/beauty"
                  className="rounded-full border border-white/15 px-3 py-1 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Beauty
                </Link>
                <Link
                  href="/black-owned-businesses/category/health-and-wellness"
                  className="rounded-full border border-white/15 px-3 py-1 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Health & Wellness
                </Link>
              </div>

              <details className="sm:hidden rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <summary className="cursor-pointer list-none text-xs font-bold text-white/85">
                  Popular searches
                </summary>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
                  <Link
                    href="/black-owned-businesses/city/atlanta-ga"
                    className="rounded-full border border-white/15 px-3 py-1"
                  >
                    Atlanta, GA
                  </Link>
                  <Link
                    href="/black-owned-businesses/city/houston-tx"
                    className="rounded-full border border-white/15 px-3 py-1"
                  >
                    Houston, TX
                  </Link>
                  <Link
                    href="/black-owned-businesses/category/restaurant"
                    className="rounded-full border border-white/15 px-3 py-1"
                  >
                    Restaurants
                  </Link>
                  <Link
                    href="/black-owned-businesses/category/beauty"
                    className="rounded-full border border-white/15 px-3 py-1"
                  >
                    Beauty
                  </Link>
                </div>
              </details>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            {/* Main */}
            <div className="min-w-0">
              {/* Categories (business only) */}
              {scope === "businesses" && (
                <div className="mb-3 space-y-2">
                  <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
                    {PRIMARY_CATEGORIES.map((cat) => {
                      return (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={cx(
                            "rounded-xl border px-3 py-2 text-[12px] font-extrabold tracking-wide transition whitespace-nowrap",
                            category === cat
                              ? "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]"
                              : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                          )}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <details className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <summary className="cursor-pointer list-none text-xs font-bold text-white/80">
                      More categories
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MORE_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={cx(
                            "rounded-xl border px-3 py-1.5 text-[11px] font-bold transition",
                            category === cat
                              ? "border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]"
                              : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]",
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </details>
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
                    Try keywords like “tax”, “restaurant”, “barber”, or “real
                    estate”.
                  </span>
                  <span className="inline-flex items-center gap-1 text-white/45">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters are optional
                  </span>
                </div>
              </div>

              {/* Filter/sort controls */}
              <details className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
                <summary className="cursor-pointer list-none text-sm font-bold text-white/85">
                  Filters
                </summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
              </details>

              <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <summary className="cursor-pointer list-none text-sm font-bold text-white/80">
                  Featured sponsors and placements
                </summary>
                <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
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
                  {sponsorsToShow.length ? (
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
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/65">
                      No active sponsor campaigns in this slot right now.
                    </div>
                  )}
                </div>
                {scope === "businesses" && directoryFeaturedAds.length ? (
                  <div className="mt-4 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.18)]">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-extrabold">
                        Featured Directory Placements
                      </h2>
                      <span className="text-[11px] text-white/65">
                        Paid featured listings
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {directoryFeaturedAds.map((ad) => (
                        <a
                          key={ad.id}
                          href={ad.targetUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-white/15 bg-black/35 p-3 hover:bg-black/45"
                        >
                          <img
                            src={ad.image || "/default-image.jpg"}
                            alt={ad.name}
                            className="h-24 w-full rounded-lg object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="text-sm font-bold text-white truncate">
                              {ad.name}
                            </div>
                            <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-bold text-[#F1D57A]">
                              Featured
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-white/70 line-clamp-2">
                            {ad.tagline}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </details>

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

                {hasSearched ? (
                  <div className="mt-3 rounded-xl border border-white/15 bg-white/[0.03] p-3 text-xs text-white/80">
                    <div className="font-bold text-white">Trust guide</div>
                    <div className="mt-1 text-white/75">
                      Verified listings include a BWE trust signal. Sponsored
                      and Featured placements are promoted listings. Organic
                      listings are still part of the public directory.
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href="#directory-search"
                        className="text-[#D4AF37] underline"
                      >
                        Broaden your search
                      </a>
                      <span className="text-white/45">•</span>
                      <span>Try a nearby city or browse by category</span>
                    </div>
                  </div>
                ) : null}

                {hasSearched &&
                total > 0 &&
                scope === "businesses" &&
                relatedCategorySuggestions.length ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/45">
                      Related categories
                    </span>
                    {relatedCategorySuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setCategory(suggestion);
                          setPage(1);
                          trackFlowEvent({
                            eventType: "related_category_clicked",
                            source: "business_directory_results",
                            query: input.trim(),
                            category: suggestion,
                          });
                        }}
                        className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] text-white/85"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}

                {isApproximateSearch ? (
                  <div className="mt-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-100">
                    <div className="font-semibold text-amber-50">
                      Approximate matches shown
                    </div>
                    <div className="mt-0.5 text-amber-100/85">
                      Exact intent matches are limited right now. These results
                      prioritize your location and closest intent terms.
                      {exactMatchCount > 0
                        ? ` ${exactMatchCount} exact match${exactMatchCount === 1 ? "" : "es"} found on this page.`
                        : ""}
                    </div>
                    {weakListingsSuppressedCount > 0 ? (
                      <div className="mt-1 text-amber-100/80">
                        Hidden {weakListingsSuppressedCount} low-confidence
                        listing
                        {weakListingsSuppressedCount === 1 ? "" : "s"} to keep
                        results useful.
                      </div>
                    ) : null}
                    {suggestedRefinement ? (
                      <div className="mt-1 text-amber-100/80">
                        Try refining to: “{suggestedRefinement}”
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCategory("All");
                          setVerifiedOnly(false);
                          setPage(1);
                        }}
                        className="rounded-full border border-amber-200/40 bg-black/20 px-2.5 py-1 text-[11px] text-amber-50"
                      >
                        Broaden category filters
                      </button>
                      {scope === "businesses" ? (
                        <button
                          type="button"
                          onClick={() => {
                            router.push({
                              pathname: "/business-directory",
                              query: {
                                ...router.query,
                                type: "organizations",
                                scope: "organizations",
                                tab: "organizations",
                                page: 1,
                              },
                            });
                          }}
                          className="rounded-full border border-amber-200/40 bg-black/20 px-2.5 py-1 text-[11px] text-amber-50"
                        >
                          Switch to Organizations
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {hasSearched && total > 0 && total < 5 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/70">
                    <span className="font-semibold text-white/85">
                      Few results.
                    </span>
                    {stateFilter ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStateFilter("");
                          setPage(1);
                        }}
                        className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[11px] text-white/85"
                      >
                        Remove state filter
                      </button>
                    ) : null}
                    {scope === "businesses" ? (
                      <button
                        type="button"
                        onClick={() => {
                          router.push({
                            pathname: "/business-directory",
                            query: {
                              ...router.query,
                              type: "organizations",
                              scope: "organizations",
                              tab: "organizations",
                              page: 1,
                            },
                          });
                        }}
                        className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2.5 py-1 text-[11px] text-[#F1D57A]"
                      >
                        Check Organizations
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {isApproximateSearch ? (
                  <div className="mt-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-[11px] text-cyan-100">
                    <span className="font-semibold text-cyan-50">
                      {searchMeta?.noExactCategoryMatchInLocation
                        ? "No exact category match in this location, showing related results."
                        : queryMode === "fallback_intent" &&
                            (searchMeta?.locationTokens || []).length > 0
                          ? `No results found in ${(searchMeta?.locationTokens || []).join(" ")}, showing related results.`
                          : "Broadened results."}
                    </span>{" "}
                    We expanded matching to show related results. Exact matches
                    are still ranked first.
                  </div>
                ) : null}

                {hasSearched &&
                total > 0 &&
                approximateCount > 0 &&
                !isApproximateSearch ? (
                  <div className="mt-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-[11px] text-amber-100">
                    <span className="font-semibold text-amber-50">
                      Some results are weaker matches.
                    </span>{" "}
                    Try adding a category, state, or a more specific keyword to
                    sharpen relevance.
                  </div>
                ) : null}

                <div className="relative mt-3 min-h-[160px]">
                  {isLoading && (
                    <div
                      className="absolute inset-0 z-20 rounded-xl bg-black/70 p-4 backdrop-blur-sm"
                      role="status"
                      aria-live="polite"
                      aria-label="Loading search results"
                    >
                      <div className="mb-2 text-sm font-semibold text-[#D4AF37]">
                        Loading results...
                      </div>
                      <div className="mb-3 text-xs text-white/70">
                        Updating listings for your current page and filters.
                      </div>
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
                      <div>
                        Discover and support Black-owned businesses and
                        organizations. Start with a keyword, category, or state.
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {[
                          {
                            label: "Nearby restaurants",
                            q: "restaurant",
                            c: "Food",
                          },
                          {
                            label: "Tax and accounting",
                            q: "tax",
                            c: "Financial Services",
                          },
                          {
                            label: "Home services",
                            q: "home",
                            c: "Home Services",
                          },
                          {
                            label: "Legal help",
                            q: "legal",
                            c: "Professional Services",
                          },
                        ].map((intent) => (
                          <button
                            key={intent.label}
                            type="button"
                            onClick={() => {
                              setInput(intent.q);
                              if (scope === "businesses") setCategory(intent.c);
                              setPage(1);
                              setHasSearched(true);
                              trackFlowEvent({
                                eventType: "quick_intent_clicked",
                                source: "business_directory_empty",
                                query: intent.q,
                                category: intent.c,
                              });
                            }}
                            className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] text-white/85"
                          >
                            {intent.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : total === 0 && !isLoading ? (
                    <div className="py-10 text-center text-white/50">
                      <div>
                        {scope === "businesses" &&
                        category !== "All" &&
                        (CATEGORY_COUNTS[category] ?? 0) === 0 ? (
                          `No listings in this category yet. Try All or another category.`
                        ) : (
                          <>
                            No listings match{" "}
                            <span className="text-white/70">
                              “{input.trim()}”
                            </span>{" "}
                            with current filters.
                          </>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-white/40">
                        Try a broader keyword, clear active filters, or switch
                        between Businesses and Organizations.
                      </div>
                      <div className="mt-2 text-[11px] text-white/55">
                        Helpful queries:{" "}
                        <span className="text-white/75">restaurant</span>,{" "}
                        <span className="text-white/75">clothing</span>,{" "}
                        <span className="text-white/75">services</span>
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
                        <button
                          type="button"
                          onClick={() => {
                            setInput("");
                            setCategory("All");
                            setStateFilter("");
                            setVerifiedOnly(false);
                            setSponsoredFirst(false);
                            setIncludeIncomplete(false);
                            setPage(1);
                          }}
                          className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#F1D57A] hover:bg-[#D4AF37]/20"
                        >
                          Browse all listings
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push({
                              pathname: "/business-directory",
                              query: {
                                ...router.query,
                                type:
                                  scope === "businesses"
                                    ? "organizations"
                                    : "businesses",
                                scope:
                                  scope === "businesses"
                                    ? "organizations"
                                    : "businesses",
                                tab:
                                  scope === "businesses"
                                    ? "organizations"
                                    : "businesses",
                                page: 1,
                              },
                            });
                            trackFlowEvent({
                              eventType: "rescue_action_clicked",
                              source:
                                "business_directory_no_result_switch_scope",
                              query: input.trim(),
                              fromScope: scope,
                            });
                          }}
                          className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-bold text-[#F1D57A] hover:bg-[#D4AF37]/20"
                        >
                          Try{" "}
                          {scope === "businesses"
                            ? "Organizations"
                            : "Businesses"}
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
                      {curatedVisibleRows.map((item, idx) => (
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
                            loading="lazy"
                            decoding="async"
                          />

                          {/* Google-like text block */}
                          <div className="min-w-0 flex-1">
                            {/* Title must always be clickable */}
                            <Link
                              href={getHref(item as Row)}
                              className="block truncate text-[#D4AF37] font-extrabold hover:underline"
                              onClick={() =>
                                trackFlowEvent({
                                  eventType: "search_result_clicked",
                                  query: input.trim(),
                                  resultCount: total,
                                  selectedBusinessId: (item as any)._id,
                                  filters: {
                                    scope,
                                    category,
                                    stateFilter,
                                    verifiedOnly,
                                    sponsoredFirst,
                                    includeIncomplete,
                                  },
                                })
                              }
                            >
                              {getTitle(item as Row) || "Untitled Listing"}
                            </Link>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {getTrustMeta(item as Row).verified ? (
                                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                                  Ownership Verified
                                </span>
                              ) : null}
                              {getTrustMeta(item as Row).claimStage ===
                              "unclaimed" ? (
                                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/75">
                                  Unclaimed
                                </span>
                              ) : null}
                              {[
                                "claim_initiated",
                                "ownership_verification_pending",
                              ].includes(
                                getTrustMeta(item as Row).claimStage || "",
                              ) ? (
                                <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                                  Ownership Verification Pending
                                </span>
                              ) : null}
                              {getTrustMeta(item as Row).claimStage ===
                              "additional_evidence_required" ? (
                                <span className="rounded-full border border-orange-400/30 bg-orange-400/15 px-2 py-0.5 text-[10px] font-bold text-orange-200">
                                  Additional Evidence Required
                                </span>
                              ) : null}
                              {getTrustMeta(item as Row).claimStage ===
                              "founding_growth_member" ? (
                                <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                                  Founding Growth Member
                                </span>
                              ) : null}
                              {!getTrustMeta(item as Row).isComplete && (
                                <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                                  Profile needs more details
                                </span>
                              )}
                            </div>

                            {/* Details line: rating · price · category */}
                            <div className="mt-1 text-[12px] text-white/70">
                              {getRatingLine(item as Row) ||
                                getCategoryLabel(item as Row) ||
                                ""}
                            </div>

                            <div className="mt-0.5 text-[12px] text-white/55">
                              <span className="text-white/72">Category:</span>{" "}
                              {getCategoryLabel(item as Row) || "Being updated"}
                              {" · "}
                              <span className="text-white/72">
                                Location:
                              </span>{" "}
                              {getLocation(item as Row) ||
                                "Location details coming soon"}
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
                                : "Business details are being expanded."}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <Link
                                href={getHref(item as Row)}
                                className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[11px] font-extrabold text-black hover:bg-yellow-500"
                              >
                                View details
                              </Link>
                              {(() => {
                                const trustMeta = getTrustMeta(item as Row);
                                const businessId = safeStr((item as any)._id);
                                const canClaim =
                                  Boolean(businessId) &&
                                  !trustMeta.verified &&
                                  ![
                                    "claim_initiated",
                                    "ownership_verification_pending",
                                    "additional_evidence_required",
                                    "disputed",
                                    "founding_growth_member",
                                    "ownership_verified",
                                  ].includes(trustMeta.claimStage || "");

                                if (canClaim) {
                                  return (
                                    <Link
                                      href={`/founding-membership?businessId=${encodeURIComponent(businessId)}`}
                                      className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/12 px-3 py-1.5 text-[11px] font-bold text-[#F1D57A] hover:bg-[#D4AF37]/18"
                                    >
                                      Claim This Listing
                                    </Link>
                                  );
                                }

                                return (
                                  <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/55">
                                    {trustMeta.verified
                                      ? "Already Verified"
                                      : trustMeta.claimStage ===
                                            "claim_initiated" ||
                                          trustMeta.claimStage ===
                                            "ownership_verification_pending"
                                        ? "Ownership verification pending"
                                        : trustMeta.claimStage ===
                                            "founding_growth_member"
                                          ? "Membership Already Active"
                                          : "Not Claimable"}
                                  </span>
                                );
                              })()}
                              {getWebsite(item as Row) ? (
                                <a
                                  href={getWebsite(item as Row)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white/80 hover:bg-black/45"
                                >
                                  Visit website
                                </a>
                              ) : null}
                              {getPhone(item as Row) ? (
                                <a
                                  href={`tel:${getPhone(item as Row)}`}
                                  className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white/80 hover:bg-black/45 sm:hidden"
                                >
                                  Call
                                </a>
                              ) : null}
                              {getLocation(item as Row) ? (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getLocation(item as Row))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white/80 hover:bg-black/45"
                                >
                                  Get directions
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
                                Contact details coming soon
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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
                {sidebarBannerAds.length ? (
                  <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.16)] backdrop-blur">
                    <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-extrabold mb-3">
                      Banner Placement
                    </div>
                    <div className="space-y-3">
                      {sidebarBannerAds.map((ad) => (
                        <SidebarAdCard
                          key={ad.id}
                          img={ad.image || "/default-image.jpg"}
                          name={ad.name}
                          tagline={ad.tagline}
                          url={ad.targetUrl || "#"}
                          cta="View"
                          label="Sponsored Banner"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
                  <div className="text-[11px] uppercase tracking-widest text-white/50 font-extrabold mb-3">
                    Sponsored
                  </div>
                  <div className="space-y-3">
                    {sponsorAds.length ? (
                      sponsorAds.map((ad) => (
                        <SidebarAdCard key={ad.url} {...ad} label="Sponsored" />
                      ))
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/60">
                        No active sponsored sidebar cards right now.
                      </div>
                    )}
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
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  BusinessDirectoryProps
> = async () => {
  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const raw = await db
      .collection("businesses")
      .find(
        {
          $or: [
            { status: { $in: ["approved", "active", "verified"] } },
            { directoryVisibilityApproved: true },
          ],
        },
        {
          projection: {
            _id: 1,
            alias: 1,
            image: 1,
            business_name: 1,
            name: 1,
            description: 1,
            phone: 1,
            address: 1,
            city: 1,
            state: 1,
            category: 1,
            categories: 1,
            display_categories: 1,
            rating: 1,
            reviewCount: 1,
            priceRange: 1,
            website: 1,
            verified: 1,
            isVerified: 1,
            status: 1,
            amountPaid: 1,
            claimStage: 1,
            publicListingStatus: 1,
            ownershipReviewStatus: 1,
            directoryVisibilityApproved: 1,
            country: 1,
            createdAt: 1,
            updatedAt: 1,
            qualityScore: 1,
            completenessScore: 1,
            isComplete: 1,
          },
        },
      )
      .sort({ directoryVisibilityApproved: -1, updatedAt: -1, createdAt: -1 })
      .limit(20)
      .toArray();

    const initialRows: Row[] = raw.map((row: any) => ({
      _id:
        typeof row?._id?.toString === "function"
          ? row._id.toString()
          : String(row?._id ?? ""),
      alias: typeof row?.alias === "string" ? row.alias : null,
      image: typeof row?.image === "string" ? row.image : null,
      business_name:
        typeof row?.business_name === "string"
          ? row.business_name
          : typeof row?.name === "string"
            ? row.name
            : "Unnamed business",
      name: typeof row?.name === "string" ? row.name : null,
      description:
        typeof row?.description === "string" ? row.description : null,
      phone: typeof row?.phone === "string" ? row.phone : null,
      address: typeof row?.address === "string" ? row.address : null,
      city: typeof row?.city === "string" ? row.city : null,
      state: typeof row?.state === "string" ? row.state : null,
      category: typeof row?.category === "string" ? row.category : null,
      categories: Array.isArray(row?.categories)
        ? row.categories.filter((x: any) => typeof x === "string")
        : typeof row?.categories === "string"
          ? row.categories
          : null,
      display_categories:
        typeof row?.display_categories === "string"
          ? row.display_categories
          : null,
      rating:
        typeof row?.rating === "number" || typeof row?.rating === "string"
          ? row.rating
          : null,
      reviewCount:
        typeof row?.reviewCount === "number" ||
        typeof row?.reviewCount === "string"
          ? row.reviewCount
          : null,
      priceRange: typeof row?.priceRange === "string" ? row.priceRange : null,
      website: typeof row?.website === "string" ? row.website : null,
      verified: typeof row?.verified === "boolean" ? row.verified : null,
      isVerified: typeof row?.isVerified === "boolean" ? row.isVerified : null,
      status: typeof row?.status === "string" ? row.status : null,
      amountPaid: typeof row?.amountPaid === "number" ? row.amountPaid : null,
      claimStage: typeof row?.claimStage === "string" ? row.claimStage : null,
      publicListingStatus:
        typeof row?.publicListingStatus === "string"
          ? row.publicListingStatus
          : null,
      ownershipReviewStatus:
        typeof row?.ownershipReviewStatus === "string"
          ? row.ownershipReviewStatus
          : null,
      country: typeof row?.country === "string" ? row.country : null,
      __kind: "business",
    })) as Row[];

    const total = await db.collection("businesses").countDocuments({
      $or: [
        { status: { $in: ["approved", "active", "verified"] } },
        { directoryVisibilityApproved: true },
      ],
    });

    return {
      props: {
        initialRows,
        initialTotal: total,
      },
    };
  } catch (error) {
    console.error("Failed to SSR business directory:", error);
    return {
      props: {
        initialRows: [],
        initialTotal: 0,
      },
    };
  }
};
