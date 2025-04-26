"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import BuyNowButton from "@/components/BuyNowButton";

type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
};

const itemsPerPage = 12;

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/marketplace/get-products?page=${currentPage}&limit=${itemsPerPage}&category=${selectedCategory}`,
        );
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, selectedCategory]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleBecomeSeller = () => {
    router.push("/marketplace/become-a-seller");
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePageChange(i + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === i + 1 ? "bg-gold text-black" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="text-center py-10 px-4">
        <h1 className="text-4xl font-extrabold text-gold mb-4">
          🛍️ Marketplace
        </h1>
        <p className="text-lg text-gray-300">
          Discover and support Black-owned businesses. Shop with purpose.
        </p>
      </section>

      {/* Become a Seller */}
      <section className="max-w-5xl mx-auto px-4 mb-8">
        <div className="bg-gold text-black p-5 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
          <div>
            <h3 className="text-xl font-bold">Own a Business?</h3>
            <p className="text-sm">
              Join the movement and sell your products here!
            </p>
          </div>
          <button
            onClick={handleBecomeSeller}
            className="px-4 py-2 bg-black text-gold font-semibold rounded hover:bg-gray-800 transition text-sm"
          >
            Become a Seller
          </button>
        </div>
      </section>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-3 justify-center mb-6 px-4">
        {[
          "All",
          "Apparel",
          "Accessories",
          "Beauty",
          "Art",
          "Books",
          "Home",
          "Food",
          "Other",
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-1.5 rounded-full border text-sm font-medium transition ${
              selectedCategory === cat
                ? "bg-gold text-black border-gold"
                : "border-gray-500 text-gray-300 hover:bg-gray-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <h3 className="text-2xl font-bold text-gold mb-4">
          {selectedCategory} Products
        </h3>
        {loading ? (
          <p className="text-center text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-gray-900 p-4 rounded shadow hover:shadow-lg transition"
                >
                  <div className="w-full h-40 relative mb-3">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        style={{ objectFit: "cover", borderRadius: "0.5rem" }}
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-700 flex items-center justify-center rounded">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg text-gold font-semibold truncate">
                    {product.name}
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">
                    ${product.price.toFixed(2)}
                  </p>
                  <div className="space-y-2">
                    <BuyNowButton
                      userId="replace-with-user-id"
                      itemId={product._id}
                      amount={product.price}
                      type="product"
                    />
                    <button
                      onClick={() =>
                        router.push(`/marketplace/product/${product._id}`)
                      }
                      className="w-full text-sm px-4 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-800"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </section>

      {/* Story / Message */}
      <section className="max-w-4xl mx-auto text-center py-12 px-4">
        <Image
          src="/marketplace/story3.jpg"
          alt="Empowering the Community"
          width={400}
          height={300}
          className="object-cover rounded mx-auto mb-4"
        />
        <p className="text-gray-400">
          Every purchase supports Black entrepreneurs and helps circulate wealth
          within our communities. Together, we’re building a legacy of
          empowerment and economic strength.
        </p>
      </section>

      {/* Footer */}
      <footer className="text-center py-8">
        <Link href="/">
          <button className="px-6 py-3 bg-black text-gold border border-gold font-semibold rounded hover:bg-gray-800 transition">
            Back to Home
          </button>
        </Link>
      </footer>
    </div>
  );
}
