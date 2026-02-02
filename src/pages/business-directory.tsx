/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

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
    url: "https://titanshop.com",
    cta: "Explore",
  },
];

interface Business {
  _id: string;
  image?: string;
  business_name: string;
  alias: string;
  description?: string;
  phone?: string | null;
  address?: string;
  category?: string;
  categories?: string | string[];
  display_categories?: string;
}

type SearchResponse = {
  requestId: string;
  tookMs: number;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  items: Business[];
  dbUsed?: string;
};

// --- Only these categories will show at the top! ---
const TOP_CATEGORIES = ["Food", "Shopping", "Beauty", "Health", "Clothing"];
const CATEGORIES = ["All", ...TOP_CATEGORIES];

const PAGE_SIZE = 20;

function injectSponsoredEveryN(
  businesses: Business[],
  sponsors: typeof SIDEBAR_ADS,
  interval = 4,
) {
  if (sponsors.length === 0) return businesses;
  const result: (Business | { isSponsor: true; sponsorIdx: number })[] = [];
  let sponsorIdx = 0;
  for (let i = 0; i < businesses.length; i++) {
    result.push(businesses[i]);
    if ((i + 1) % interval === 0) {
      result.push({
        isSponsor: true,
        sponsorIdx: sponsorIdx % sponsors.length,
      });
      sponsorIdx++;
    }
  }
  return result;
}

function SponsorCard({ img, name, tagline, url, cta }: any) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="relative flex flex-col items-center justify-between rounded-xl shadow-lg bg-gray-800/90 border-2 border-yellow-400 p-2 sm:p-3 hover:-translate-y-1 transition cursor-pointer min-w-[110px] max-w-[130px] mx-auto"
      style={{ minHeight: 150 }}
    >
      <img
        src={img}
        alt={name}
        className="h-12 w-12 object-cover rounded shadow border border-white mb-1"
        style={{ background: "#eee" }}
      />
      <div className="text-gold font-semibold text-xs sm:text-[11px] text-center truncate mb-1">
        {name}
      </div>
      <div className="text-gray-300 text-[11px] sm:text-xs text-center mb-1 truncate">
        {tagline}
      </div>
      <span className="inline-block px-2 py-1 rounded bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-500 transition mb-2">
        {cta}
      </span>
      <span className="absolute top-1 right-2 bg-yellow-400 text-yellow-900 text-[9px] sm:text-[10px] rounded px-2 font-bold z-10 shadow">
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
  color = "bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-100",
}: any) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className={`relative block rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition p-3 mb-4 cursor-pointer border border-yellow-300 ${color}`}
      style={{
        minHeight: 80,
        borderWidth: "2px",
        borderColor: "#FFD700",
      }}
    >
      <span className="absolute top-2 right-3 bg-yellow-400 text-yellow-900 text-[9px] sm:text-[10px] rounded px-2 font-bold z-10 shadow">
        Ad
      </span>
      <img
        src={img}
        className="h-14 w-14 object-cover rounded mb-1 border border-white shadow-md"
        alt={name}
      />
      <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
        {name}
      </div>
      <div className="text-[11px] sm:text-xs text-gray-700 mb-1 truncate">
        {tagline}
      </div>
      <div>
        <span className="inline-block px-2 py-1 rounded bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-500 transition">
          {cta}
        </span>
      </div>
    </a>
  );
}

function normalizeCategoryText(b: Business): string {
  const cats = Array.isArray(b.categories)
    ? b.categories.join(" ")
    : b.categories || "";
  const combined = `${cats} ${b.category || ""} ${b.display_categories || ""}`;
  return combined.toLowerCase();
}

export default function BusinessDirectory() {
  const [input, setInput] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [category, setCategory] = useState<string>("All");
  const [hasSearched, setHasSearched] = useState(false);

  const router = useRouter();
  const didInitialSearch = useRef(false);

  // Autofill from ?search= param
  useEffect(() => {
    if (!router.isReady) return;
    const initial =
      typeof router.query.search === "string" ? router.query.search : "";
    if (initial && input !== initial && !didInitialSearch.current) {
      setInput(initial);
      didInitialSearch.current = true;
    }
  }, [router.isReady, router.query.search, input]);

  const abortRef = useRef<AbortController | null>(null);

  // Main debounced search (resets to page 1)
  useEffect(() => {
    // If nothing is selected, return empty
    if (!input.trim() && (category === "All" || !category)) {
      setBusinesses([]);
      setTotal(0);
      setPage(1);
      setHasMore(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setIsLoadingMore(false);

    const timeout = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams();
      if (input.trim()) params.set("search", input.trim());
      if (category && category !== "All") params.set("category", category);
      params.set("page", "1");
      params.set("limit", String(PAGE_SIZE));

      fetch(`/api/search/businesses?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((data: SearchResponse) => {
          if (controller.signal.aborted) return;

          const items = Array.isArray(data?.items) ? data.items : [];
          setBusinesses(items);
          setTotal(typeof data?.total === "number" ? data.total : items.length);
          setPage(1);
          setHasMore(Boolean(data?.hasMore));
          setHasSearched(true);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            setBusinesses([]);
            setTotal(0);
            setPage(1);
            setHasMore(false);
            setHasSearched(true);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 350);

    return () => {
      clearTimeout(timeout);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [input, category]);

  async function loadMore() {
    if (isLoadingMore || isLoading || !hasMore) return;

    setIsLoadingMore(true);

    // Cancel any in-flight search before loading more
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const nextPage = page + 1;

    const params = new URLSearchParams();
    if (input.trim()) params.set("search", input.trim());
    if (category && category !== "All") params.set("category", category);
    params.set("page", String(nextPage));
    params.set("limit", String(PAGE_SIZE));

    try {
      const r = await fetch(`/api/search/businesses?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = (await r.json()) as SearchResponse;

      if (controller.signal.aborted) return;

      const items = Array.isArray(data?.items) ? data.items : [];
      setBusinesses((prev) => [...prev, ...items]);
      setTotal(typeof data?.total === "number" ? data.total : total);
      setPage(nextPage);
      setHasMore(Boolean(data?.hasMore));
      setHasSearched(true);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        // keep current results; just stop loading more
      }
    } finally {
      if (!controller.signal.aborted) setIsLoadingMore(false);
    }
  }

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = "/default-image.jpg";
  };

  // Keep client-side filter as a safety net (API already filters by category)
  const filtered =
    category === "All"
      ? businesses
      : businesses.filter((b) =>
          normalizeCategoryText(b).includes(category.toLowerCase()),
        );

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

  const emptyLabel = input.trim()
    ? `No businesses found for "${input}".`
    : category !== "All"
      ? `No businesses found in "${category}".`
      : "No businesses found.";

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col md:flex-row">
      {/* Main content column */}
      <div className="flex-1 w-full md:w-3/4 p-2 sm:p-3 md:p-6 mx-auto">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded transition font-semibold text-xs
                ${
                  category === cat
                    ? "bg-gold text-black shadow"
                    : "bg-gray-800 text-white hover:bg-gold hover:text-black border border-gray-700"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form
          className="relative w-full mb-2"
          onSubmit={(e) => e.preventDefault()}
          autoComplete="off"
        >
          <input
            type="text"
            placeholder="Find Black-Owned Businesses..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all text-sm"
            style={{ zIndex: 20 }}
          />
        </form>

        {/* Results summary */}
        {hasSearched && (
          <div className="mb-3 text-xs sm:text-sm text-gray-300 flex items-center justify-between">
            <div>
              <span className="text-yellow-400 font-semibold">
                {total.toLocaleString()}
              </span>{" "}
              results
              {category !== "All" ? (
                <span className="text-gray-400"> in {category}</span>
              ) : null}
              {input.trim() ? (
                <span className="text-gray-400"> for “{input.trim()}”</span>
              ) : null}
            </div>
            <div className="text-gray-500">
              {isLoading ? "Searching..." : hasMore ? "More available" : "End"}
            </div>
          </div>
        )}

        {/* Sponsored Carousel */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs uppercase text-yellow-400 font-bold tracking-widest">
              Featured Sponsors
            </h2>
            <a
              href="/all-sponsors"
              className="text-xs text-gold hover:underline font-semibold"
            >
              See All
            </a>
          </div>
          <Swiper
            modules={[Navigation]}
            spaceBetween={4}
            slidesPerView="auto"
            centeredSlides={false}
            navigation
            style={{ paddingBottom: 8 }}
          >
            {sponsorsToShow.map((ad, idx) => (
              <SwiperSlide
                key={ad.url + idx}
                className="!w-[140px] sm:!w-[160px]"
              >
                <SponsorCard {...ad} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Results */}
        <div className="relative min-h-[120px]">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/80 pointer-events-none">
              <div className="text-yellow-400 font-semibold text-lg animate-pulse">
                Loading...
              </div>
            </div>
          )}

          {hasSearched ? (
            filtered.length > 0 ? (
              <div>
                {injectSponsoredEveryN(filtered, SIDEBAR_ADS, 4).map(
                  (item, idx) =>
                    (item as any).isSponsor ? (
                      <div
                        key={`sponsor-inline-${(item as any).sponsorIdx}-${idx}`}
                        className="flex items-center gap-2 sm:gap-3 py-2 border-b border-gray-800 bg-gray-800/70 relative"
                      >
                        <img
                          src={SIDEBAR_ADS[(item as any).sponsorIdx].img}
                          alt={SIDEBAR_ADS[(item as any).sponsorIdx].name}
                          width={44}
                          height={44}
                          className="object-cover rounded shadow border border-gold bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <a
                            href={SIDEBAR_ADS[(item as any).sponsorIdx].url}
                            target="_blank"
                            rel="noopener"
                            className="text-gold font-semibold hover:underline truncate block text-xs sm:text-sm"
                          >
                            {SIDEBAR_ADS[(item as any).sponsorIdx].name}
                          </a>
                          <div className="text-gray-400 text-[11px] sm:text-xs truncate">
                            {SIDEBAR_ADS[(item as any).sponsorIdx].tagline}
                          </div>
                        </div>
                        <span className="inline-block px-2 py-1 rounded bg-yellow-400 text-black font-bold absolute top-2 right-2 sm:right-3 shadow text-[10px] sm:text-xs">
                          Sponsored
                        </span>
                      </div>
                    ) : (
                      <div
                        key={(item as Business)._id}
                        className="flex items-center gap-2 sm:gap-3 py-2 border-b border-gray-800"
                      >
                        <img
                          src={(item as Business).image || "/default-image.jpg"}
                          alt={(item as Business).business_name}
                          width={44}
                          height={44}
                          className="object-cover rounded shadow border border-gold bg-gray-100"
                          onError={handleImageError}
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/business-directory/${(item as Business).alias}`}
                            className="text-gold font-semibold hover:underline truncate block text-xs sm:text-sm"
                          >
                            {(item as Business).business_name}
                          </Link>
                          <div className="text-gray-400 text-[11px] sm:text-xs truncate">
                            {(item as Business).description ||
                              "Description not available"}
                          </div>
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 min-w-[60px] sm:min-w-[90px] text-right">
                          {(item as Business).phone && (
                            <div>{(item as Business).phone}</div>
                          )}
                          {(item as Business).address && (
                            <div className="truncate">
                              {(item as Business).address}
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                )}

                {/* Load more */}
                <div className="py-6 flex justify-center">
                  {hasMore ? (
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className={`px-5 py-2 rounded-lg font-bold transition border border-yellow-400 ${
                        isLoadingMore
                          ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                          : "bg-yellow-400 text-black hover:bg-yellow-500"
                      }`}
                    >
                      {isLoadingMore ? "Loading..." : "Load More"}
                    </button>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      You’ve reached the end.
                    </div>
                  )}
                </div>
              </div>
            ) : isLoading ? null : (
              <div className="py-8 text-gray-400 text-center">{emptyLabel}</div>
            )
          ) : (
            <div className="py-8 text-gray-400 text-center">
              Discover and support Black-owned businesses! Start your search
              above.
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="hidden md:block w-full md:w-80 md:border-l border-gray-800 md:pl-4 p-2 pt-6 md:pt-10 bg-gray-900">
        <div className="text-xs uppercase text-gray-400 mb-2 ml-1">
          Sponsored
        </div>
        {SIDEBAR_ADS.map((ad) => (
          <SidebarAdCard key={ad.url} {...ad} />
        ))}
      </aside>
    </div>
  );
}
