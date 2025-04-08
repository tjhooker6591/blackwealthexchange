"use client";

import { useState } from "react";

export default function AddPamfaProducts() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const demoProducts = [
    {
      name: "Pamfa Denim Jeans",
      description: "Stylish high-waist women’s denim by Pamfa United Citizen.",
      price: 55,
      category: "Apparel",
      imageUrl: "/pamfa-denim.jpg",
    },
    {
      name: "Pamfa Logo Tee",
      description: "Black tee with bold Pamfa United Citizen logo print.",
      price: 25,
      category: "Apparel",
      imageUrl: "/pamfa-shirt.jpg",
    },
    {
      name: "Empowerment Journal (Book)",
      description:
        "A reflective guided journal promoting self-worth and daily growth.",
      price: 18,
      category: "Books",
      imageUrl: "/book-Elevate_Risingabovetheeveryday-1.jpg",
    },
    {
      name: "United Voices Anthology (Book)",
      description:
        "Collection of essays and poetry on Black resilience and community strength.",
      price: 22,
      category: "Books",
      imageUrl: "/book-overqualified-2.jpg",
    },
  ];

  const handleAddProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/add-demo-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: demoProducts }),
      });

      if (!res.ok) throw new Error("Failed to add demo products");
      setSuccess(true);
    } catch (err) {
      console.error("Error adding products:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gold mb-4">
          Add Pamfa Demo Products
        </h1>
        <p className="mb-6 text-gray-300">
          Click below to seed your live Marketplace with branded Pamfa products
          and books.
        </p>
        <button
          onClick={handleAddProducts}
          disabled={loading}
          className="px-6 py-3 bg-gold text-black font-bold rounded hover:bg-yellow-400 transition"
        >
          {loading ? "Adding..." : "Add Products to DB"}
        </button>
        {success && (
          <p className="mt-4 text-green-500">✅ Products added successfully!</p>
        )}
      </div>
    </div>
  );
}
