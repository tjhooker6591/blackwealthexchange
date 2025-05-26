"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  "All", "Food", "Retail", "Beauty", "Professional", "Services"
];

const SIDEBAR_ADS = [
  {
    img: "/pamfa1.jpg",
    name: "Pamfa United Citizens",
    tagline: "Bold. Fearless. Iconic.",
    url: "https://pamfaunited.com",
    cta: "Shop Now",
    color: "bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-100",
  },
  {
    img: "/titans.jpg",
    name: "Titan Era Apparel",
    tagline: "Level Up Your Look.",
    url: "https://titanshop.com",
    cta: "Explore",
    color: "bg-gradient-to-br from-blue-500 via-blue-300 to-white",
  },
];

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

export default function BusinessDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const router = useRouter();
  const { search } = router.query;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLUListElement>(null);

  // Initial load from URL
  useEffect(() => {
    if (typeof search === "string") setSearchQuery(search);
  }, [search]);

  // Debounced Fetch businesses
  useEffect(() => {
    setIsLoading(true);
    const delay = setTimeout(() => {
      fetch(`/api/searchBusinesses?search=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then((data: Business[]) => {
          setBusinesses(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch(() => {
          setBusinesses([]);
          setIsLoading(false);
        });
    }, 300); // 300ms debounce
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Category filtering (client-side)
  useEffect(() => {
    if (category === "All") setFilteredBusinesses(businesses);
    else setFilteredBusinesses(businesses.filter(b => b.category === category));
  }, [category, businesses]);

  // Fetch autocomplete suggestions (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/searchBusinesses?search=${encodeURIComponent(searchQuery)}&limit=6`)
        .then(res => res.json())
        .then((data: Business[]) => {
          setSuggestions(data.slice(0, 6));
          setShowSuggestions(true);
        });
    }, 180);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Dismiss suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !searchInputRef.current?.contains(e.target as Node) &&
        !suggestionBoxRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSuggestions]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push(`/business-directory?search=${encodeURIComponent(searchQuery)}`, undefined, { shallow: true });
    setShowSuggestions(false);
  };

  // Keyboard nav for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") setSuggestionIndex(i => (i + 1) % suggestions.length);
    else if (e.key === "ArrowUp") setSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length);
    else if (e.key === "Enter") {
      setSearchQuery(suggestions[suggestionIndex].business_name);
      setShowSuggestions(false);
      handleSearchSubmit();
    }
  };

  // Image fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = "/default-image.jpg";
  };

  // Insert sponsored ad into results every N results
  function injectSponsoredAds(arr: Business[]) {
    const result: (Business | { isAd: boolean; adIndex: number })[] = [];
    for (let i = 0; i < arr.length; i++) {
      result.push(arr[i]);
      if (i === 1 || i === 4) {
        result.push({ isAd: true, adIndex: (i === 1 ? 0 : 1) }); // Insert sidebar ad after 2nd/5th result
      }
    }
    return result;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col md:flex-row">
      {/* Main Column */}
      <div className="flex-1 w-full md:w-3/4 p-2 md:p-6 mx-auto">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded transition font-semibold text-xs
                ${category === cat
                  ? "bg-gold text-black shadow"
                  : "bg-gray-800 text-white hover:bg-gold hover:text-black border border-gray-700"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Search Bar w/ Auto-complete */}
        <form className="relative w-full mb-4" onSubmit={handleSearchSubmit} autoComplete="off">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Find Black-Owned Businesses..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); setSuggestionIndex(0); }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all"
            style={{ zIndex: 20 }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1 px-3 py-1 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition"
          >Search</button>
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              ref={suggestionBoxRef}
              className="absolute left-0 right-0 bg-gray-800 border border-gray-600 rounded mt-1 z-30 shadow-xl max-h-48 overflow-y-auto"
            >
              {suggestions.map((b, idx) => (
                <li
                  key={b._id}
                  className={`px-4 py-2 cursor-pointer ${idx === suggestionIndex ? "bg-gold text-black" : "hover:bg-gray-700"}`}
                  onMouseDown={() => { setSearchQuery(b.business_name); setShowSuggestions(false); handleSearchSubmit(); }}
                >
                  {b.business_name}
                </li>
              ))}
            </ul>
          )}
        </form>
        {/* Results header */}
        <div className="mb-2 text-sm text-gray-400">
          {isLoading
            ? "Searching businesses..."
            : filteredBusinesses.length > 0
              ? `Showing results for "${searchQuery || "All"}"${category !== "All" ? ` in ${category}` : ""}`
              : `No businesses found for "${searchQuery || "All"}"${category !== "All" ? ` in ${category}` : ""}`
          }
        </div>
        {/* Results */}
        <div>
          {isLoading ? (
            <div className="py-10 text-center text-gray-400 animate-pulse">
              <div className="w-20 h-20 rounded-full mx-auto mb-2 bg-gray-700"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-800 rounded w-2/3 mx-auto"></div>
            </div>
          ) : filteredBusinesses.length > 0 ? (
            <div>
              {injectSponsoredAds(filteredBusinesses).map((item, idx) =>
                (item as any).isAd ? (
                  <SidebarAdCard key={`ad-${(item as any).adIndex}-${idx}`} {...SIDEBAR_ADS[(item as any).adIndex % SIDEBAR_ADS.length]} isInline />
                ) : (
                  <div
                    key={(item as Business)._id}
                    className="flex items-center gap-3 py-2 border-b border-gray-800"
                  >
                    <div className="flex-shrink-0">
                      <Image
                        src={(item as Business).image || "/default-image.jpg"}
                        alt={(item as Business).business_name}
                        width={70}
                        height={70}
                        className="object-cover rounded shadow border-2 border-gold bg-gray-100"
                        onError={handleImageError}
                        priority={idx < 3}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/business-directory/${(item as Business).alias}`}
                        className="text-gold font-semibold hover:underline block truncate text-base md:text-lg"
                        style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                      >
                        {(item as Business).business_name}
                      </Link>
                      <div
                        className="text-gray-300 text-xs md:text-sm block mt-0.5"
                        style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                      >
                        {(item as Business).description || "Description not available"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right min-w-[100px] max-w-[120px] break-words">
                      {(item as Business).phone && <div>{(item as Business).phone}</div>}
                      {(item as Business).address && <div className="truncate">{(item as Business).address}</div>}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="py-8 text-gray-400 text-center">No businesses found for &quot;{searchQuery || "All"}&quot;.</div>
          )}
        </div>
      </div>
      {/* Sidebar */}
      <aside className="w-full md:w-80 md:border-l border-gray-800 md:pl-4 p-2 pt-6 md:pt-10 bg-gray-900">
        <div className="text-xs uppercase text-gray-400 mb-2 ml-1">Sponsored</div>
        {SIDEBAR_ADS.map(ad => (
          <SidebarAdCard key={ad.url} {...ad} />
        ))}
      </aside>
    </div>
  );
}

// Sidebar ad card with sponsored badge and hover
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
      className={`relative block rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 transition p-3 mb-4 cursor-pointer border border-yellow-300
        ${color} ${isInline ? "my-4" : ""}`}
      style={{
        minHeight: 100,
        borderWidth: "2px",
        borderColor: "#FFD700"
      }}
    >
      <span className="absolute top-2 right-3 bg-yellow-400 text-yellow-900 text-[10px] rounded px-2 font-bold z-10 shadow">Ad</span>
      <Image
        src={img}
        alt={name}
        width={88}
        height={88}
        className="object-cover rounded mb-2 border-2 border-white shadow-md"
        priority
      />
      <div className="font-semibold text-gray-900 text-sm truncate">{name}</div>
      <div className="text-xs text-gray-700 mb-2 truncate">{tagline}</div>
      <div>
        <span className="inline-block px-2 py-1 rounded bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-500 transition">{cta}</span>
      </div>
    </a>
  );
}
