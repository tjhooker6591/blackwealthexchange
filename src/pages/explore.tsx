"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

const categories = [
  "All",
  "Beauty & Grooming",
  "Clothing & Fashion",
  "Food & Beverage",
  "Home & Lifestyle",
  "Books & Education",
  "Tech & Gadgets",
  "Jewelry & Accessories",
  "Health & Wellness",
  "Baby & Kids",
  "Art & Culture",
  "Business & Services",
];

export default function ExplorePage() {
  const [filter, setFilter] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/marketplace/get-products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts =
    filter === "All"
      ? products
      : products.filter((product) => product.category === filter);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gold">
            Explore Black Wealth Exchange
          </h1>
          <p className="text-gray-400 mt-2">
            Discover businesses, products, jobs, and opportunities built for our
            community.
          </p>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                filter === cat
                  ? "bg-gold text-black"
                  : "bg-gray-700 text-white hover:bg-gold hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Display */}
        {loading ? (
          <p className="text-center text-gray-400">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-gray-400">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link
                key={product._id}
                href={`/marketplace/product/${product._id}`}
                className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg"
              >
                <div className="relative w-full h-48 bg-gray-800">
                  <Image
                    src={product.imageUrl || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-1">{product.name}</h2>
                  <p className="text-sm text-gray-400 mb-1">
                    {product.category}
                  </p>
                  <p className="text-md font-semibold text-gold">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA at Bottom */}
        <div className="text-center mt-16">
          <Link href="/signup">
            <button className="px-8 py-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-500 transition">
              Join the Movement
            </button>
          </Link>
          <p className="text-gray-400 mt-4 text-sm">
            Already a member?{" "}
            <Link href="/login" className="underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
