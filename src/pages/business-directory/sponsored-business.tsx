"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/legacy/image";

const ITEMS_PER_PAGE = 9;

type Business = {
  _id: string;
  name: string;
  description: string;
  slug: string;
  logo?: string;
  tier: string;
};

export default function SponsoredBusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchSponsors = async () => {
      const res = await fetch("/api/sponsored-businesses");
      const data = await res.json();
      setBusinesses(data);
    };
    fetchSponsors();
  }, []);

  const topSponsors = businesses.filter((b) => b.tier === "top");
  const standardSponsors = businesses.filter((b) => b.tier !== "top");

  const totalPages = Math.ceil(standardSponsors.length / ITEMS_PER_PAGE);
  const currentItems = standardSponsors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      {/* Header */}
      <h1 className="text-4xl font-extrabold text-gold text-center mb-6 animate-fadeIn">
        Sponsored Business Directory
      </h1>

      <p className="text-center text-gray-400 max-w-2xl mx-auto mb-12 animate-fadeIn delay-200">
        Discover and support Black-owned businesses proudly featured on our platform.
        Want premium visibility?{" "}
         
      </p>

      {/* Top Sponsors */}
      {topSponsors.length > 0 && (
        <section className="mb-20">
          <h2 className="text-3xl font-semibold text-gold mb-8 text-center">
            🌟 Our Top Sponsors
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {topSponsors.map((biz) => (
              <div
                key={biz._id}
                className="relative bg-gradient-to-br from-yellow-400 to-gold text-black rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition duration-300 w-80 animate-fadeUp"
              >
                <div className="absolute top-2 right-2 bg-black text-gold px-3 py-1 text-xs font-bold rounded-full">
                  ⭐ Top Sponsor
                </div>
                <Image
                  src={biz.logo || "/ads/default-banner.jpg"}
                  alt={biz.name}
                  width={500}
                  height={250}
                  className="w-full h-40 object-cover"
                />
                <div className="p-5">
                  <h3 className="text-xl font-extrabold mb-2">🏅 {biz.name}</h3>
                  <p className="text-sm mb-4 line-clamp-3">{biz.description}</p>
                  <Link
                    href={`/business/${biz.slug}`}
                    className="inline-block bg-black text-gold px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition"
                  >
                    🔎 View Business
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Standard Sponsors */}
      <section>
        <h2 className="text-2xl font-semibold text-gold mb-6 text-center">
          💼 Featured Sponsored Listings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentItems.map((biz) => (
            <div
              key={biz._id}
              className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition duration-300 animate-fadeUp"
            >
              <Image
                src={biz.logo || "/ads/default-banner.jpg"}
                alt={biz.name}
                width={500}
                height={250}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-1">🏢 {biz.name}</h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-3">{biz.description}</p>
                <Link
                  href={`/business/${biz.slug}`}
                  className="inline-block bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition"
                >
                  🔗 View Business
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
          >
            ⬅️ Previous
          </button>
          <span className="text-sm text-gray-400">
            📄 Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
          >
            Next ➡️
          </button>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-24 text-center bg-gray-800 rounded-2xl p-10 shadow-xl animate-fadeIn delay-500">
        <h3 className="text-2xl font-bold text-gold mb-4"> Want to See Your Business Here?</h3>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
          📈 Join hundreds of businesses gaining premium exposure on Black Wealth Exchange.
          Get noticed, drive traffic, and grow your brand today.
        </p>
        <Link
          href="/advertise-with-us"
          className="inline-block bg-gold text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 transition"
        >
          🚀 Become a Sponsor
        </Link>
      </div>
    </div>
  );
}
