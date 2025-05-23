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
      {/* Hero Section */}
      <header className="hero bg-gray-800 p-20 text-center shadow-md">
        <h1 className="text-4xl font-bold text-gold">Business Directory</h1>
        <p className="text-lg mt-2 text-gray-300">
          Discover and support Black-owned businesses across various industries.
        </p>
        {/* Back Button */}
        <div className="mt-4">
          <Link href="/">
            <button className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto p-6">
        <div className="relative w-full mb-6">
          <input
            type="text"
            placeholder="Find Black-Owned Businesses..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all"
          />
          <button
            onClick={handleSearchSubmit}
            className="absolute right-2 top-1 px-3 py-1 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition"
          >
            Search
          </button>
        </div>

        {/* Featured Sponsor Ad */}
        <div className="text-xs uppercase text-gray-400 mb-1">Sponsored</div>
        <PamfaSponsorAd />

        {/* Display results with Sponsored Ads inserted */}
        {isLoading ? (
          <p>Loading...</p>
        ) : filteredBusinesses.length > 0 ? (
          <div className="search-results mt-6">
            {filteredBusinesses.map((business, index) => (
              <React.Fragment key={business._id}>
                <div className="search-result-item flex items-start space-x-4 py-3 border-b border-gray-700">
                  <Image
                    src={business.image || "/default-image.jpg"}
                    alt={business.business_name}
                    width={64}
                    height={64}
                    className="object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <Link
                      href={`/business-directory/${business.alias}`}
                      passHref
                    >
                      <span className="text-lg font-semibold text-gold hover:underline cursor-pointer">
                        {business.business_name}
                      </span>
                    </Link>
                    <p className="text-sm text-gray-300 mt-1">
                      {business.description || "Description not available"}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      {business.phone || "No phone number available"}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      {business.address || "No address available"}
                    </p>
                  </div>
                </div>

                {/* Insert Sponsored Ads */}
                {index === 2 && <PamfaSponsorAd />}
                {index === 5 && <TitanEraSponsoredAd />}
                {(index + 1) % 8 === 0 && <BannerAd />}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <p>No businesses found for &quot;{search || searchQuery}&quot;</p>
        )}
      </div>

      {/* Custom Solution Ad Section */}
      <div className="container mx-auto px-4">
        <CustomSolutionAd />
      </div>
    </div>
  );
}
