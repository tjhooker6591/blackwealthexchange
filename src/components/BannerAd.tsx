"use client";

import React from "react";
import Image from "next/image";

export default function BannerAd() {
  return (
    <div className="my-2 p-1 bg-gray-800 border border-gold rounded text-center">
      <p className="text-xs text-gray-300">Sponsored Ad</p>
      <Image
        src="/ads/banner-ad.jpg" // Ensure this image exists in /public/ads/
        alt="Banner Ad"
        width={250}
        height={60}
        className="mx-auto"
      />
    </div>
  );
}
