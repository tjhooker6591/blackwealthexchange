"use client";

import React from "react";
import Image from "next/image"; // ✅ modern import

export default function BannerAd() {
  return (
    <div className="my-2 p-1 bg-gray-800 border border-gold rounded text-center">
      <p className="text-xs text-gray-300">Sponsored Ad</p>
      <Image
        src="/ads/banner-ad.jpg" // ✅ make sure this exists in /public/ads/
        alt="Banner Ad"
        width={250}
        height={60}
        className="mx-auto"
        style={{ objectFit: "cover" }} // ✅ for clean scaling
        priority
      />
    </div>
  );
}
