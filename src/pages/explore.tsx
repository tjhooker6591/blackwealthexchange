"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

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

  async function handleBuyNow(productId: string) {
    try {
      setBuyingId(productId);

      const res = await fetch("/api/marketplace/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");

      // Stripe Checkout URL
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Missing checkout URL");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Could not start checkout.");
      setBuyingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gold">
            Explore Black Wealth Exchange
          </h1>
          <p className="text-gray-400 mt-2">
            Discover businesses, products, jobs, and opportunities built for our
            community.
          </p>
        </div>

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

        {loading ? (
          <p className="text-center text-gray-400">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-gray-400">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden shadow-md hover:shadow-lg transition"
              >
                {/* Keep card click = go to product page */}
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/marketplace/product/${product._id}`)
                  }
                  className="w-full text-left hover:scale-[1.01] transition-transform duration-200"
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
                </button>

                {/* Buy Now restores “go to checkout” behavior */}
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    disabled={buyingId === product._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuyNow(product._id);
                    }}
                    className="w-full mt-2 px-4 py-2 rounded-lg font-bold bg-gold text-black hover:bg-yellow-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {buyingId === product._id
                      ? "Starting checkout..."
                      : "Buy Now"}
                  </button>

                  <Link
                    href={`/marketplace/product/${product._id}`}
                    className="block text-center text-sm text-gray-300 underline mt-2"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

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
