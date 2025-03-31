"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/marketplace/get-product?id=${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product", err);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/marketplace/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...product }),
      });
      if (res.ok) router.push("/marketplace/dashboard");
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-lg border border-gold">
        <h1 className="text-2xl font-bold text-gold mb-4">Edit Product</h1>

        <div className="mb-4">
          <label className="block text-sm mb-1">Product Name</label>
          <input
            name="name"
            type="text"
            value={product.name}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Description</label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Price ($)</label>
          <input
            name="price"
            type="number"
            value={product.price}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">Category</label>
          <select
            name="category"
            value={product.category}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          >
            <option value="">Select a category</option>
            <option value="apparel">Apparel</option>
            <option value="accessories">Accessories</option>
            <option value="beauty">Beauty</option>
            <option value="art">Art</option>
            <option value="books">Books</option>
            <option value="home">Home Goods</option>
            <option value="food">Food & Drink</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-2 px-4 mt-4 rounded text-black font-semibold bg-gold hover:bg-yellow-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
