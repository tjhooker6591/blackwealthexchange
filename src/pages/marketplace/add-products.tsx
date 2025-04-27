"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function AddProductPage() {
  const router = useRouter();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [success, setSuccess] = useState(false); // ✅ New state for success message
  const [error, setError] = useState(""); // Optional: handle errors better

  const isFormValid = productName && price && category && imageFile;

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/verify");
      if (res.status !== 200) {
        router.push("/auth/seller-login");
      }
    };
    checkAuth();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (isFormValid) {
      const formData = new FormData();
      formData.append("name", productName);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("image", imageFile);

      const res = await fetch("/api/marketplace/add-product", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true); // ✅ Trigger success message
      } else {
        setError(data.error || "Failed to add product.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto bg-gray-900 p-6 rounded-lg border border-gold">
        {success ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gold mb-4">
              ✅ Product Submitted!
            </h1>
            <p className="mb-6">
              Your product has been submitted and is{" "}
              <strong>awaiting admin approval</strong>. You will see it listed
              once approved.
            </p>
            <button
              onClick={() => router.push("/marketplace/dashboard")}
              className="bg-gold text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gold mb-4">
              Add a New Product
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Fill out the details below to list your product in the
              marketplace.
            </p>

            {/* Form Fields */}
            <div className="mb-4">
              <label className="block text-sm mb-1">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                placeholder="e.g. Black Heritage Hoodie"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                rows={3}
                placeholder="Describe the product..."
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Price ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                placeholder="e.g. 29.99"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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

            <div className="mb-4">
              <label className="block text-sm mb-1">Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
            </div>

            {error && <p className="text-red-500 mb-4">❌ {error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`w-full py-2 px-4 rounded text-black font-semibold transition ${
                isFormValid
                  ? "bg-gold hover:bg-yellow-500"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              Submit Product
            </button>
          </>
        )}
      </div>
    </div>
  );
}
