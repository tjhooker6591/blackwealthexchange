"use client";

import React from "react";
import Link from "next/link";
import Head from "next/head";
import Image from "next/legacy/image";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function Storefront() {
  return (
    <>
      <Head>
        <title>Storefront | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Explore Black Wealth Exchange storefront categories and jump into the marketplace to browse available products and seller opportunities.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/storefront")} />
      </Head>
      <main className="bg-black text-white min-h-screen py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gold mb-6">
            Discover Black-Owned Excellence
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
            Explore featured Black-owned shopping categories, then open the
            marketplace to browse the products and sellers currently available
            on BWE.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-6 mb-12">
            <Link href="/marketplace">
              <button className="bg-gold text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition">
                Open Marketplace
              </button>
            </Link>
            <Link href="/marketplace/become-a-seller">
              <button className="bg-transparent border border-gold text-gold px-6 py-3 rounded-lg font-semibold hover:bg-gold hover:text-black transition">
                Start Seller Setup
              </button>
            </Link>
          </div>

          <section className="mt-10">
            <h2 className="text-3xl text-gold font-bold mb-6">
              Featured Categories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Apparel & Accessories",
                  image: "/images/fallback/retail.jpg",
                },
                {
                  title: "Health & Beauty",
                  image: "/images/fallback/health.jpg",
                },
                {
                  title: "Books & Education",
                  image: "/images/fallback/community.jpg",
                },
                {
                  title: "Home & Decor",
                  image: "/images/fallback/realestate.jpg",
                },
                {
                  title: "Food & Beverage",
                  image: "/images/fallback/food.jpg",
                },
                {
                  title: "Tech & Innovation",
                  image: "/images/fallback/technology.jpg",
                },
              ].map((category, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-gold transition"
                >
                  <Image
                    src={category.image}
                    alt={category.title}
                    width={500}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl text-gold font-semibold mb-2">
                      {category.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Explore curated products and services from this category.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
