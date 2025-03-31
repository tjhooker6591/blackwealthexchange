"use client";

import React from "react";
import Link from "next/link";

export default function FeaturedSponsorAd() {
  return (
    <div className="my-4 p-2 bg-gray-800 border border-gold rounded text-center">
      <h2 className="text-xl font-bold text-gold mb-1">Featured Sponsor</h2>
      <p className="text-gray-300 text-sm">
        Boost your brands visibility by becoming our featured sponsor.
      </p>
      <Link href="/advertise-with-us">
        <button className="mt-2 px-3 py-1 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition text-sm">
          Learn More
        </button>
      </Link>
    </div>
  );
}
