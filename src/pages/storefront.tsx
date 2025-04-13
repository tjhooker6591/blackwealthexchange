"use client";

import React from "react";
import Link from "next/link";
import Image from "next/legacy/image";

export default function Storefront() {
  return (
    <main className="bg-black text-white min-h-screen py-16 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gold mb-6">
          Discover Black-Owned Excellence
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
          The Storefront showcases verified Black-owned brands offering products
          and services across fashion, wellness, art, culture, education, and
          more.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-6 mb-12">
          <Link href="/marketplace">
            <button className="bg-gold text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition">
              Explore All Products
            </button>
          </Link>
          <Link href="/marketplace/add-products">
            <button className="bg-transparent border border-gold text-gold px-6 py-3 rounded-lg font-semibold hover:bg-gold hover:text-black transition">
              Add Your Product
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
                image: "/categories/fashion.jpg",
              },
              { title: "Health & Beauty", image: "/categories/beauty.jpg" },
              { title: "Books & Education", image: "/categories/books.jpg" },
              { title: "Home & Decor", image: "/categories/home.jpg" },
              { title: "Food & Beverage", image: "/categories/food.jpg" },
              { title: "Tech & Innovation", image: "/categories/tech.jpg" },
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
  );
}
