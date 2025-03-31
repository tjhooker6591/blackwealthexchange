"use client";

import React from "react";
import Link from "next/link";

export default function BannerAdsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gold mb-4">Banner Ads</h1>
      <p className="text-lg text-gray-400 max-w-xl mb-6">
        This page is under construction. Soon, you’ll be able to upload and manage custom banner ads to showcase your brand on the platform.
      </p>
      <Link href="/advertise-form">
        <button className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition">
          Go Back to Ad Options
        </button>
      </Link>
    </div>
  );
}
