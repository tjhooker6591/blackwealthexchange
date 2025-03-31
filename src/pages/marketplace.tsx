"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

const itemsPerPage = 8;

const Marketplace: React.FC = () => {
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
          `/api/marketplace/get-products?page=${currentPage}&limit=${itemsPerPage}&category=${selectedCategory}`
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
    setCurrentPage(1); // reset to page 1 when category changes
  };

  const handleViewProduct = (id: string) => {
    router.push(`/marketplace/product/${id}`);
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
              currentPage === i + 1 ? "bg-black text-white" : ""
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
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Header */}
      <section className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Marketplace</h1>
        <p className="text-xl mb-8">
          Discover exclusive Black-owned products curated for quality and style.
        </p>
      </section>

      {/* Become a Seller */}
      <section className="container mx-auto px-4 pt-4 pb-6">
        <div className="bg-gold text-black p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
          <div>
            <h3 className="text-xl font-bold">Are You a Black-Owned Business?</h3>
            <p className="text-sm">Join our Marketplace and start selling to thousands of conscious buyers.</p>
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
      <div className="container mx-auto px-4 pb-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {["All", "Apparel", "Accessories", "Beauty", "Art", "Books", "Home", "Food", "Other"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full border text-sm font-medium transition ${
                selectedCategory === cat
                  ? "bg-gold text-black border-gold"
                  : "border-gray-500 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <section className="container mx-auto px-4 py-8">
        <h3 className="text-3xl font-bold mb-4">{selectedCategory} Products</h3>
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-600">No products available in this category.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleViewProduct(product._id)}
                >
                  <div className="w-full h-32 relative mb-2">
                    <Image
                      src={product.imageUrl || "/placeholder.png"}
                      alt={product.name}
                      fill
                      style={{ objectFit: "cover", borderRadius: "0.5rem" }}
                    />
                  </div>
                  <h4 className="font-semibold text-lg truncate">{product.name}</h4>
                  <p className="text-sm text-gray-600">
                    ${typeof product.price === "number" ? product.price.toFixed(2) : "N/A"}
                  </p>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </section>

      {/* Story/Message */}
      <section className="container mx-auto px-4 pb-10 text-center">
        <Image
          src="/marketplace/story3.jpg"
          alt="Empowering the Black Community"
          width={400}
          height={300}
          className="object-cover rounded mx-auto mb-4"
        />
        <p className="text-gray-700 max-w-2xl mx-auto">
          Our marketplace is the gateway to supporting Black-owned businesses and circulating wealth within our communities.
          By leveraging our collective spending power, we can uplift entrepreneurs, create jobs, and close the racial wealth gap one purchase at a time.
        </p>
      </section>

      {/* Back to Home */}
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
