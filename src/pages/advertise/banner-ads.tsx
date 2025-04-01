"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BannerAdsPage() {
  const router = useRouter();

  const handleAdSelect = (placement: string) => {
    // Navigate to shared ad submission form with banner type and placement info
    router.push(`/advertise-form?type=banner&placement=${placement}`);
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold text-gold mb-4">
        Advertise with Banner Ads
      </h1>
      <p className="text-lg text-gray-400 max-w-2xl mb-10">
        Promote your business with visually engaging banner ads placed across
        high-traffic areas of the platform. Select a banner location below to
        begin the process.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Top of Homepage Banner */}
        <div className="bg-white text-black rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2">Top of Homepage</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Get maximum visibility with a large banner at the very top of the
            homepage.
          </p>
          <button
            onClick={() => handleAdSelect("homepage-top")}
            className="px-5 py-2 bg-black text-gold rounded hover:bg-gray-900 transition"
          >
            Select This Placement
          </button>
        </div>

        {/* Sidebar Banner */}
        <div className="bg-white text-black rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2">Sidebar Ad</h2>
          <p className="text-gray-600 mb-4 text-sm">
            A persistent sidebar banner visible throughout user navigation.
          </p>
          <button
            onClick={() => handleAdSelect("sidebar")}
            className="px-5 py-2 bg-black text-gold rounded hover:bg-gray-900 transition"
          >
            Select This Placement
          </button>
        </div>

        {/* Footer Banner */}
        <div className="bg-white text-black rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2">Footer Banner</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Appears at the bottom of every page — great for long-term
            visibility.
          </p>
          <button
            onClick={() => handleAdSelect("footer")}
            className="px-5 py-2 bg-black text-gold rounded hover:bg-gray-900 transition"
          >
            Select This Placement
          </button>
        </div>

        {/* Dashboard Banner */}
        <div className="bg-white text-black rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2">User Dashboard</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Display your banner on the business or user dashboard for targeted
            exposure.
          </p>
          <button
            onClick={() => handleAdSelect("dashboard")}
            className="px-5 py-2 bg-black text-gold rounded hover:bg-gray-900 transition"
          >
            Select This Placement
          </button>
        </div>
      </div>

      <div className="mt-10">
        <Link href="/advertise-with-us">
          <button className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition">
            Go Back to Ad Options
          </button>
        </Link>
      </div>
    </div>
  );
}
