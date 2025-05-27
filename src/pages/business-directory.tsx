"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Categories and Ad Data
const CATEGORIES = [
  "All",
  "Food",
  "Retail",
  "Beauty",
  "Professional",
  "Services",
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
  // Add more ads if needed
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

export default function BusinessDirectory() {
  const [pendingQuery, setPendingQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Business[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const router = useRouter();
  const didInitial = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLUListElement>(null);

  // On initial mount, set search state from URL (ONE TIME ONLY)
  useEffect(() => {
    if (!didInitial.current && typeof router.query.search === "string") {
      setPendingQuery(router.query.search);
      setSearchQuery(router.query.search);
      didInitial.current = true;
    }
  }, [router.query.search]);

  // Fetch only when searchQuery changes
  useEffect(() => {
    if (!searchQuery) {
      setBusinesses([]);
      return;
    }
    setIsLoading(true);
    fetch(`/api/searchBusinesses?search=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data: Business[]) => {
        setBusinesses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setBusinesses([]);
      })
      .finally(() => setIsLoading(false));
  }, [searchQuery]);

  // Category filter is instant, client-side
  const displayedBusinesses =
    category === "All"
      ? businesses
      : businesses.filter((b) => b.category === category);

  // Autocomplete (debounced) - only for suggestions
  useEffect(() => {
    if (!pendingQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(
        `/api/searchBusinesses?search=${encodeURIComponent(pendingQuery)}&limit=6`,
      )
        .then((res) => res.json())
        .then((data: Business[]) => {
          setSuggestions(data.slice(0, 6));
          setShowSuggestions(true);
        });
    }, 200);
    return () => clearTimeout(timeout);
  }, [pendingQuery]);

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

  // Only this triggers a real search
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchQuery(pendingQuery);
    router.push(
      `/business-directory?search=${encodeURIComponent(pendingQuery)}`,
      undefined,
      { shallow: true },
    );
    setShowSuggestions(false);
  };

  // Keyboard nav for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown")
      setSuggestionIndex((i) => (i + 1) % suggestions.length);
    else if (e.key === "ArrowUp")
      setSuggestionIndex(
        (i) => (i - 1 + suggestions.length) % suggestions.length,
      );
    else if (e.key === "Enter") {
      setPendingQuery(suggestions[suggestionIndex].business_name);
      setShowSuggestions(false);
      setTimeout(handleSearchSubmit, 0);
    }
  };

  // Image fallback (for businesses)
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = "/default-image.jpg";
  };

  // Insert sponsored ad into results every N results
  function injectSponsoredAds(arr: Business[]) {
    const result: (Business | { isAd: boolean; adIndex: number })[] = [];
    for (let i = 0; i < arr.length; i++) {
      result.push(arr[i]);
      if (i === 1 || i === 4) {
        result.push({ isAd: true, adIndex: i === 1 ? 0 : 1 }); // Insert first/second sidebar ad after 2nd/5th result
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
          className="relative w-full mb-4"
          onSubmit={handleSearchSubmit}
          autoComplete="off"
        >
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Find Black-Owned Businesses..."
            value={pendingQuery}
            onChange={(e) => {
              setPendingQuery(e.target.value);
              setShowSuggestions(true);
              setSuggestionIndex(0);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all"
            style={{ zIndex: 20 }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1 px-3 py-1 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition"
          >
            Search
          </button>
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              ref={suggestionBoxRef}
              className="absolute left-0 right-0 bg-gray-800 border border-gray-600 rounded mt-1 z-30 shadow-xl max-h-48 overflow-y-auto"
            >
              {suggestions.map((b, suggestionIdx) => (
                <li
                  key={b._id}
                  className={`px-4 py-2 cursor-pointer ${suggestionIdx === suggestionIndex ? "bg-gold text-black" : "hover:bg-gray-700"}`}
                  onMouseDown={() => {
                    setPendingQuery(b.business_name);
                    setShowSuggestions(false);
                    setTimeout(handleSearchSubmit, 0);
                  }}
                >
                  {b.business_name}
                </li>
              ))}
            </ul>
          )}
        </form>
        {/* Results */}
        <div>
          {isLoading ? (
            <div className="py-10 text-center text-gray-400">
              Loading businesses...
            </div>
          ) : displayedBusinesses.length > 0 ? (
            <div>
              {injectSponsoredAds(displayedBusinesses).map((item, index) =>
                (item as any).isAd ? (
                  <SidebarAdCard
                    key={`ad-${(item as any).adIndex}-${index}`}
                    {...SIDEBAR_ADS[(item as any).adIndex % SIDEBAR_ADS.length]}
                    isInline
                  />
                ) : (
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
                        {(item as Business).description ||
                          "Description not available"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right min-w-[120px]">
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
            </div>
          ) : (
            <div className="py-8 text-gray-400 text-center">
              No businesses found for &quot;{searchQuery}&quot;.
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
