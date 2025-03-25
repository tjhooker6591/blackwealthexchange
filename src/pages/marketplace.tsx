"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: number;
  title: string;
  image: string;
  price: string; // e.g., "$250"
  category: "recent" | "top" | "compare";
}

const Marketplace: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Sample data – replace with your API call or data source.
    const sampleProducts: Product[] = [
      {
        id: 1,
        title: "Vintage Leather Bag",
        image: "/marketplace/leather-bag.jpg",
        price: "$250",
        category: "recent",
      },
      {
        id: 2,
        title: "Classic Watch",
        image: "/marketplace/classic-watch.jpg",
        price: "$350",
        category: "recent",
      },
      {
        id: 3,
        title: "Handcrafted Jewelry",
        image: "/marketplace/jewelry.jpg",
        price: "$150",
        category: "top",
      },
      {
        id: 4,
        title: "Designer Sunglasses",
        image: "/marketplace/sunglasses.jpg",
        price: "$300",
        category: "top",
      },
      {
        id: 5,
        title: "Luxury Perfume",
        image: "/marketplace/perfume.jpg",
        price: "$180",
        category: "compare",
      },
      {
        id: 6,
        title: "Elegant Dress",
        image: "/marketplace/elegant-dress.jpg",
        price: "$400",
        category: "compare",
      },
      // Add more products as needed...
    ];
    setProducts(sampleProducts);
  }, []);

  // Filter products by category
  const recentlyListed = products.filter((p) => p.category === "recent");
  const topPicks = products.filter((p) => p.category === "top");
  const comparisonProducts = products.filter((p) => p.category === "compare");

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Marketplace Title */}
      <section className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-center mb-4">
          Marketplace
        </h1>
        <p className="text-xl text-center mb-8">
          Discover exclusive Black-owned products curated for quality and style.
          Shop the latest listings, top picks, and compare premium offerings to
          find your perfect match.
        </p>
      </section>

      {/* Two-Column Layout for Recently Listed & Placeholder Image/Text */}
      <section className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Recently Listed */}
          <div>
            <h2 className="text-3xl font-bold mb-4">Recently Listed</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {recentlyListed.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="relative h-24 w-full mb-2">
                    <Image
                      src={product.image}
                      alt={product.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded"
                    />
                  </div>
                  <h4 className="font-semibold text-lg">{product.title}</h4>
                  <p className="text-sm text-gray-600">{product.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Just the Image + Text, No White Box */}
          <div className="flex flex-col items-center justify-center p-6">
            <Image
              src="/marketplace/story3.jpg" // Replace with the path to your uploaded image
              alt="Empowering the Black Community"
              width={400}
              height={300}
              className="object-cover rounded mb-4"
            />
            <p className="text-gray-700 text-center">
              Our marketplace is the gateway to supporting Black-owned
              businesses and circulating wealth within our communities. By
              leveraging our collective spending power, we can uplift
              entrepreneurs, create jobs, and close the racial wealth gap one
              purchase at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Top Picks */}
      <section className="container mx-auto px-4 py-8">
        <h3 className="text-3xl font-bold mb-4">Top Picks</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {topPicks.map((product) => (
            <div
              key={product.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="relative h-24 w-full mb-2">
                <Image
                  src={product.image}
                  alt={product.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded"
                />
              </div>
              <h4 className="font-semibold text-lg">{product.title}</h4>
              <p className="text-sm text-gray-600">{product.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Products */}
      <section className="container mx-auto px-4 py-8 mb-12">
        <h3 className="text-3xl font-bold mb-4">Comparison Products</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {comparisonProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="relative h-24 w-full mb-2">
                <Image
                  src={product.image}
                  alt={product.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded"
                />
              </div>
              <h4 className="font-semibold text-lg">{product.title}</h4>
              <p className="text-sm text-gray-600">{product.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Back to Home Button */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <Link href="/">
          <button className="px-6 py-3 bg-black text-gold border border-gold font-semibold rounded hover:bg-gray-800 transition">
            Back to Home
          </button>
        </Link>
      </footer>
    </div>
  );
};

export default Marketplace;
