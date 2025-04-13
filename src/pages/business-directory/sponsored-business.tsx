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
      <h1 className="text-4xl font-bold text-gold text-center mb-10">
        Sponsored Business Directory
      </h1>

      <p className="text-center text-gray-400 max-w-2xl mx-auto mb-12">
        Discover and support Black-owned businesses that are proudly featured on
        our platform. Want to get listed?{" "}
        <Link href="/advertise-with-us" className="text-gold underline">
          Sponsor your brand
        </Link>
        .
      </p>

      {/* Top Sponsors Section */}
      {topSponsors.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gold mb-6 text-center">
            🌟 Top Sponsors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {topSponsors.map((biz) => (
              <div
                key={biz._id}
                className="bg-gradient-to-br from-yellow-500 to-gold text-black rounded-xl shadow-lg overflow-hidden"
              >
                <Image
                  src={biz.logo || "/ads/default-banner.jpg"}
                  alt={biz.name}
                  width={500}
                  height={250}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-1">{biz.name}</h3>
                  <p className="text-sm mb-3">{biz.description}</p>
                  <Link
                    href={`/business/${biz.slug}`}
                    className="inline-block bg-black text-gold px-4 py-2 rounded font-semibold hover:bg-gray-900 transition"
                  >
                    View Business
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Standard Sponsors Grid */}
      <section>
        <h2 className="text-2xl font-semibold text-gold mb-6 text-center">
          Sponsored Listings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentItems.map((biz) => (
            <div
              key={biz._id}
              className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden"
            >
              <Image
                src={biz.logo || "/ads/default-banner.jpg"}
                alt={biz.name}
                width={500}
                height={250}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  {biz.name}
                </h3>
                <p className="text-sm text-gray-400 mb-3">{biz.description}</p>
                <Link
                  href={`/business/${biz.slug}`}
                  className="inline-block bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition"
                >
                  View Business
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
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
