"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

// Categories and Ad Data
const CATEGORIES = [
  "All",
  "Food",
  "Retail",
  "Beauty",
  "Professional",
  "Services",
];

// Sponsors/ads (add more as needed)
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
    name: "Titan Era Apparel",
    tagline: "Level Up Your Look.",
    url: "https://titanshop.com",
    cta: "Explore",
  },
  // Add up to 18 real sponsors if you have them!
];

// Business type
interface Business {
  _id: string;
  image?: string;
  business_name: string;
  alias: string;
  description?: string;
  phone?: string;
  address?: string;
  category?: string;
}

// Sponsor card for horizontal carousel (top of page)
function SponsorCard({
  img,
  name,
  tagline,
  url,
  cta,
}: {
  img: string;
  name: string;
  tagline: string;
  url: string;
  cta: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="relative flex flex-col items-center justify-between rounded-xl shadow-lg bg-gray-800/90 border-2 border-yellow-400 p-3 hover:-translate-y-1 transition cursor-pointer min-w-[130px] max-w-[145px] mx-auto"
      style={{ minHeight: 215 }}
    >
      <img
        src={img}
        alt={name}
        className="h-16 w-16 object-cover rounded shadow border border-white mb-2"
        style={{ background: "#eee" }}
      />
      <div className="text-gold font-semibold text-[15px] text-center truncate mb-1">{name}</div>
      <div className="text-gray-300 text-xs text-center mb-2 truncate">{tagline}</div>
      <span className="inline-block px-2 py-1 rounded bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-500 transition mb-2">
        {cta}
      </span>
      <span className="absolute top-1 right-2 bg-yellow-400 text-yellow-900 text-[10px] rounded px-2 font-bold z-10 shadow">
        Sponsored
      </span>
    </a>
  );
}

// Sidebar ad card for stacked right bar (original look)
function SidebarAdCard({
  img,
  name,
  tagline,
  url,
  cta,
  color = "bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-100",
  isInline = false,
}: {
  img: string;
  name: string;
  tagline: string;
  url: string;
  cta: string;
  color?: string;
  isInline?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className={`relative block rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition p-3 mb-4 cursor-pointer border border-yellow-300
        ${color} ${isInline ? "my-4" : ""}`}
      style={{
        minHeight: 90,
        borderWidth: "2px",
        borderColor: "#FFD700",
      }}
    >
      <span className="absolute top-2 right-3 bg-yellow-400 text-yellow-900 text-[10px] rounded px-2 font-bold z-10 shadow">
        Ad
      </span>
      <img
        src={img}
        className="h-20 w-20 object-cover rounded mb-2 border border-white shadow-md"
        alt={name}
      />
      <div className="font-semibold text-gray-900 text-sm truncate">{name}</div>
      <div className="text-xs text-gray-700 mb-2 truncate">{tagline}</div>
      <div>
        <span className="inline-block px-2 py-1 rounded bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-500 transition">
          {cta}
        </span>
      </div>
    </a>
  );
}

// Inject sponsors into search results at specific positions (3,7,12)
function injectSponsoredIntoResults(
  businesses: Business[],
  sponsors: typeof SIDEBAR_ADS,
  positions = [3, 7, 12]
) {
  const result: (Business | { isSponsor: true; sponsorIdx: number })[] = [];
  let sponsorIdx = 0;
  let bizIdx = 0;
  for (let i = 0; i < businesses.length; i++) {
    // Add business
    result.push(businesses[i]);
    bizIdx++;
    // At each trigger position, inject a sponsor if available
    if (positions.includes(bizIdx) && sponsorIdx < sponsors.length) {
      result.push({ isSponsor: true, sponsorIdx });
      sponsorIdx++;
    }
  }
  return result;
}

export default function BusinessDirectory() {
  const [input, setInput] = useState(""); // search bar input
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState<string>("All");
  const [searched, setSearched] = useState(false); // true after first search

  // Fetch businesses for a search term (only called on submit)
  function fetchBusinesses(query: string) {
    setIsLoading(true);
    fetch(`/api/searchBusinesses?search=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => setBusinesses(Array.isArray(data) ? data : []))
      .catch(() => setBusinesses([]))
      .finally(() => setIsLoading(false));
  }

  // Only fetch on submit!
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchBusinesses(input);
    setSearched(true);
  };

  // Image fallback
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = "/default-image.jpg";
  };

  // Category filtering (after a search)
  const filtered =
    category === "All"
      ? businesses
      : businesses.filter((b) => b.category === category);

  // Sponsor list for carousel (pad with placeholders if fewer than 18)
  const sponsorsToShow = [
    ...SIDEBAR_ADS,
    ...Array(Math.max(0, 18 - SIDEBAR_ADS.length)).fill({
      img: "/placeholder.png",
      name: "Your Business Here",
      tagline: "Sponsor This Spot!",
      url: "/advertise",
      cta: "Advertise",
    }),
  ].slice(0, 18);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col md:flex-row">
      {/* Main column */}
      <div className="flex-1 w-full md:w-3/4 p-2 md:p-6 mx-auto">
        {/* Category Filter */}
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
          className="relative w-full mb-6"
          onSubmit={handleSearchSubmit}
          autoComplete="off"
        >
          <input
            type="text"
            placeholder="Find Black-Owned Businesses..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all"
            style={{ zIndex: 20 }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1 px-3 py-1 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition"
          >
            Search
          </button>
        </form>
        {/* Sponsored Carousel */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs uppercase text-yellow-400 font-bold tracking-widest">
              Sponsored
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
            spaceBetween={18}
            slidesPerView={6}
            navigation
            style={{ paddingBottom: 12 }}
            breakpoints={{
              320: { slidesPerView: 1.2 },
              480: { slidesPerView: 2 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 6 },
            }}
          >
            {sponsorsToShow.map((ad, idx) => (
              <SwiperSlide key={ad.url + idx}>
                <SponsorCard {...ad} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        {/* Results */}
        <div>
          {searched ? (
            isLoading ? (
              <div className="py-10 text-center text-gray-400">
                Loading businesses...
              </div>
            ) : filtered.length > 0 ? (
              <div>
                {injectSponsoredIntoResults(filtered, SIDEBAR_ADS).map((item, idx) =>
                  (item as any).isSponsor ? (
                    // Sponsor row within results, styled like a business row but marked
                    <div
                      key={`sponsor-inline-${idx}`}
                      className="flex items-center gap-3 py-2 border-b border-gray-800 bg-gray-800/70 relative"
                    >
                      <img
                        src={SIDEBAR_ADS[(item as any).sponsorIdx].img}
                        alt={SIDEBAR_ADS[(item as any).sponsorIdx].name}
                        width={58}
                        height={58}
                        className="object-cover rounded shadow border border-gold bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <a
                          href={SIDEBAR_ADS[(item as any).sponsorIdx].url}
                          target="_blank"
                          rel="noopener"
                          className="text-gold font-semibold hover:underline truncate block"
                        >
                          {SIDEBAR_ADS[(item as any).sponsorIdx].name}
                        </a>
                        <div className="text-gray-400 text-xs truncate">
                          {SIDEBAR_ADS[(item as any).sponsorIdx].tagline}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-right min-w-[120px]">
                        <span className="inline-block px-2 py-1 rounded bg-yellow-400 text-black font-bold text-[11px] absolute top-2 right-3 shadow">
                          Sponsored
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Regular business result row
                    <div
                      key={(item as Business)._id}
                      className="flex items-center gap-3 py-2 border-b border-gray-800"
                    >
                      <img
                        src={(item as Business).image || "/default-image.jpg"}
                        alt={(item as Business).business_name}
                        width={58}
                        height={58}
                        className="object-cover rounded shadow border border-gold bg-gray-100"
                        onError={handleImageError}
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/business-directory/${(item as Business).alias}`}
                          className="text-gold font-semibold hover:underline truncate block"
                        >
                          {(item as Business).business_name}
                        </Link>
                        <div className="text-gray-400 text-xs truncate">
                          {(item as Business).description || "Description not available"}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-right min-w-[120px]">
                        {(item as Business).phone && <div>{(item as Business).phone}</div>}
                        {(item as Business).address && (
                          <div className="truncate">{(item as Business).address}</div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="py-8 text-gray-400 text-center">
                No businesses found for &quot;{input}&quot;.
              </div>
            )
          ) : (
            <div className="py-8 text-gray-400 text-center">
              Discover and support Black-owned businesses! Start your search above.
            </div>
          )}
        </div>
      </div>
      {/* Sidebar */}
      <aside className="w-full md:w-80 md:border-l border-gray-800 md:pl-4 p-2 pt-6 md:pt-10 bg-gray-900">
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
