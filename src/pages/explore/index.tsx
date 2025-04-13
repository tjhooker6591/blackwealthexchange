"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  price: string;
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

export default function ExploreMarketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/marketplace/get-products");
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Product[] = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch products", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gold mb-6 text-center">
          Explore the Marketplace
        </h1>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full border transition text-sm font-semibold ${
                selectedCategory === cat
                  ? "bg-gold text-black border-gold"
                  : "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
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
                    ${product.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
