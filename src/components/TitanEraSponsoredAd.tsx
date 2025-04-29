// TitanEraSponsoredAd.tsx
"use client";

import Link from "next/link";
import Image from "next/legacy/image";

export default function TitanEraSponsoredAd() {
  return (
    <div className="bg-gray-900 border border-gold rounded-lg p-6 mb-8 shadow-lg">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative w-full md:w-1/3 h-48">
          <Image
            src="/ads/titanera-banner.jpg" // You will need to upload a TitanEra banner image
            alt="TitanEra Film Production"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gold mb-2">
            TitanEra Productions
          </h3>
          <p className="text-gray-300 mb-4 text-sm">
            Elevating Black storytelling through groundbreaking films and
            cinematic excellence. Join the movement that’s reshaping the future
            of media.
          </p>
          <Link
            href="https://www.instagram.com/titaneraoffical/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
          >
            Follow TitanEra
          </Link>
        </div>
      </div>
    </div>
  );
}
