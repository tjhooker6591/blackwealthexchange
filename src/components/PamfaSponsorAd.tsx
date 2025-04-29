"use client";

import React from "react";
import Image from "next/legacy/image";

export default function PamfaSponsorAd() {
  return (
    <div className="bg-gray-800 border border-gold p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-6 my-8">
      <div className="relative w-full md:w-48 h-48">
        <Image
          src="/ads/pamfa-united-ad.jpg"
          alt="Pamfa United Citizens"
          layout="fill"
          className="object-cover rounded-lg"
        />
      </div>
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-2xl font-bold text-gold mb-2">Pamfa United Citizens</h2>
        <p className="text-gray-300 mb-4">
          Elevate your wardrobe with fashion that empowers. Bold. Fearless. Iconic.
        </p>
        <a
          href="https://www.facebook.com/Pamfaunitedcitizens/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="px-6 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
            Shop Now
          </button>
        </a>
      </div>
    </div>
  );
}

