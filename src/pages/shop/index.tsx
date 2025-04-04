"use client";

import React from "react";
import Link from "next/link";

export default function ShopIndex() {
  return (
    <main className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gold mb-4">
          Welcome to the Black Wealth Exchange Marketplace
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto mb-10 text-lg">
          Explore a powerful collection of products and services from
          Black-owned businesses. Support the movement. Circulate the dollar.
          Empower our communities.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-6">
          <Link href="/marketplace">
            <button className="bg-gold text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition">
              Browse the Marketplace
            </button>
          </Link>
          <Link href="/marketplace/become-a-seller">
            <button className="bg-transparent border border-gold text-gold px-6 py-3 rounded-lg font-semibold hover:bg-gold hover:text-black transition">
              Become a Seller
            </button>
          </Link>
        </div>
      </div>

      <section className="mt-24 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl text-gold font-bold mb-6">Why Shop With Us?</h2>
        <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-10">
          Every dollar you spend here fuels independence, innovation, and
          generational wealth. Our marketplace is more than shopping—it’s
          strategy.
        </p>
        <div className="grid md:grid-cols-3 gap-10 px-6">
          <div>
            <h3 className="text-xl font-semibold text-gold mb-2">
              Verified Black-Owned Brands
            </h3>
            <p className="text-gray-400">
              We highlight and prioritize businesses that are Black-owned,
              curated, and community-approved.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gold mb-2">
              Quality & Culture
            </h3>
            <p className="text-gray-400">
              Shop everything from fashion and art to health and education—built
              by us, for us, and for everyone who supports equity.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gold mb-2">
              Circulate the Dollar
            </h3>
            <p className="text-gray-400">
              Your purchase helps build economic power, not just profit. Keep
              wealth in our ecosystem where it belongs.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
