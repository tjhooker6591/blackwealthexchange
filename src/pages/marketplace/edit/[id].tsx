"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const { id: productId } = router.query;

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    image: "",
    category: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/marketplace/product?id=${productId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch product");

        // Adjust based on your API response structure
        setFormData({
          name: data.name || "",
          description: data.description || "",
          price: data.price?.toString() || "",
          image: data.image || "",
          category: data.category || "",
        });
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/marketplace/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Update failed");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading product...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-gold mb-4">Edit Product</h1>

        {success && (
          <p className="text-green-500 mb-4">
            ✅ Product updated successfully!
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />
          <input
            type="text"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />
          <input
            type="text"
            name="image"
            placeholder="Image URL"
            value={formData.image}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 border border-gray-600"
          />

          <button
            type="submit"
            className="w-full py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition"
          >
            Save Changes
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/marketplace/dashboard"
            className="text-blue-400 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
