"use client";

import React from "react";
import Link from "next/link";

export default function BusinessDirectoryAdPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gold mb-4">
        Business Directory Ads
      </h1>
      <p className="text-lg text-gray-400 max-w-xl mb-6">
        This section will allow you to feature your business at the top of
        relevant directory categories. Stay tuned — ad placements here will
        drive visibility and discovery for your brand!
      </p>
      <Link href="/advertise-form">
        <button className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition">
          Back to Advertising Options
        </button>
      </Link>
    </div>
  );
}
