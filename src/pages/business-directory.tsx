"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/legacy/image";
import Fuse from "fuse.js";
import PamfaSponsorAd from "@/components/PamfaSponsorAd";
import TitanEraSponsoredAd from "@/components/TitanEraSponsoredAd";
import BannerAd from "@/components/BannerAd";
import CustomSolutionAd from "@/components/CustomSolutionAd";

// Define the interface for a Business
interface Business {
  _id: string;
  image?: string;
  business_name: string;
  alias: string;
  description?: string;
  phone?: string;
  address?: string;
}

export default function BusinessDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { search } = router.query;
  const [initialLoad, setInitialLoad] = useState(true);

  // On initial load, if the URL has a search query, set it into state
  useEffect(() => {
    if (initialLoad && typeof search === "string") {
      setSearchQuery(search);
      setInitialLoad(false);
    }
  }, [search, initialLoad]);

  // Memoize Fuse.js options
  const fuseOptions = useMemo(
    () => ({
      keys: ["business_name", "description"],
      includeScore: true,
      threshold: 0.3,
    }),
    [],
  );

  useEffect(() => {
    if (searchQuery) {
      setIsLoading(true);
      fetch(`/api/searchBusinesses?search=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data: Business[]) => {
          if (Array.isArray(data)) {
            const fuse = new Fuse(data, fuseOptions);
            const result = fuse.search(searchQuery);
            setFilteredBusinesses(result.map((res) => res.item));
          } else {
            setFilteredBusinesses([]);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching businesses:", err);
          setIsLoading(false);
        });
    } else {
      setFilteredBusinesses([]);
    }
  }, [searchQuery, fuseOptions]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = () => {
    router.push(
      `/business-directory?search=${encodeURIComponent(searchQuery)}`,
      undefined,
      { shallow: true },
    );
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Search Bar + Main/Sidebar Grid */}
      <div className="container mx-auto flex flex-col md:flex-row gap-8 p-6">
        {/* --- Main Content --- */}
        <main className="flex-1">
          {/* Minimal Search Bar & Back */}
          <div className="flex items-center gap-2 mb-3 relative">
            <Link href="/" className="mr-2">
              <button className="px-3 py-1 bg-gray-700 text-white font-semibold rounded hover:bg-gray-600 transition text-xs">
                Back
              </button>
            </Link>
            <input
              type="text"
              placeholder="Find Black-Owned Businesses..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="flex-1 px-3 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:ring-1 focus:ring-gold focus:outline-none text-sm"
              style={{ minWidth: 0 }}
            />
            <button
              onClick={handleSearchSubmit}
              className="ml-2 px-3 py-1 bg-gold text-black rounded font-semibold hover:bg-yellow-500 transition text-xs"
            >
              Search
            </button>
          </div>

          {/* Sponsored Banner (mobile only, card style) */}
          <div className="md:hidden mb-3">
            <div className="text-xs uppercase text-gray-400 mb-1">
              Sponsored
            </div>
            <div className="rounded border border-yellow-700 bg-gray-800 p-2">
              <PamfaSponsorAd />
            </div>
          </div>

          {/* Display results with Sponsored Ads inserted */}
          {isLoading ? (
            <p className="text-gray-300 text-sm px-2 py-6">Loading...</p>
          ) : filteredBusinesses.length > 0 ? (
            <div className="search-results mt-3">
              {filteredBusinesses.map((business, index) => (
                <React.Fragment key={business._id}>
                  <div className="flex items-center py-2 border-b border-gray-800 hover:bg-gray-800 transition group px-2">
                    <Image
                      src={business.image || "/default-image.jpg"}
                      alt={business.business_name}
                      width={40}
                      height={40}
                      className="object-cover rounded mr-3"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/business-directory/${business.alias}`}
                        passHref
                      >
                        <span className="font-semibold text-gold text-base hover:underline cursor-pointer truncate block">
                          {business.business_name}
                        </span>
                      </Link>
                      <span className="text-xs text-gray-300 truncate block">
                        {business.description?.slice(0, 60) || "No description"}
                      </span>
                      <span className="text-xs text-gray-400 mr-3">
                        {business.phone || ""}
                      </span>
                      <span className="text-xs text-gray-400">
                        {business.address || ""}
                      </span>
                    </div>
                  </div>
                  {/* Inline Sponsored Ads for extra impressions */}
                  {index === 2 && (
                    <div className="my-2 rounded border border-yellow-700 bg-gray-800 p-2">
                      <PamfaSponsorAd />
                    </div>
                  )}
                  {index === 5 && (
                    <div className="my-2 rounded border border-cyan-700 bg-gray-800 p-2">
                      <TitanEraSponsoredAd />
                    </div>
                  )}
                  {(index + 1) % 8 === 0 && (
                    <div className="my-2 rounded border border-yellow-700 bg-gray-800 p-2">
                      <BannerAd />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-gray-300 text-sm px-2 py-6">
              No businesses found for &quot;{search || searchQuery}&quot;
            </p>
          )}

          {/* Custom Solution Ad Section */}
          <div className="mt-6">
            <CustomSolutionAd />
          </div>
        </main>

        {/* --- Right Sidebar (desktop only) --- */}
        <aside className="hidden md:block w-80 sticky top-24 self-start">
          <div className="text-xs uppercase text-gray-400 mb-2">Sponsored</div>
          <div className="rounded border border-yellow-700 bg-gray-800 p-2 mb-3">
            <PamfaSponsorAd />
          </div>
          <div className="rounded border border-cyan-700 bg-gray-800 p-2 mb-3">
            <TitanEraSponsoredAd />
          </div>
          <div className="rounded border border-yellow-700 bg-gray-800 p-2">
            <BannerAd />
          </div>
        </aside>
      </div>
    </div>
  );
}
