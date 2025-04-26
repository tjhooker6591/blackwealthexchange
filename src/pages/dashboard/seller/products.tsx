"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

type Product = {
  _id: string;
  name: string;
  price: number;
  status: string;
};

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Step 1: Get seller session info
        const sessionRes = await axios.get("/api/auth/me");
        const sellerId = sessionRes.data?.user?.id;

        if (!sellerId) {
          console.error("No seller ID found.");
          setLoading(false);
          return;
        }

        // Step 2: Fetch products with sellerId
        const res = await axios.get(`/api/marketplace/get-products?sellerView=true&sellerId=${sellerId}`);
        setProducts(res.data.products);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/marketplace/delete-product?id=${productId}`);
      setProducts(products.filter((p) => p._id !== productId));
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product.");
    }
  };

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold text-gold mb-6">
        🛒 Manage My Products
      </h1>

      <Link
        href="/marketplace/add-products"
        className="bg-gold text-black px-4 py-2 rounded hover:bg-yellow-400 transition mb-6 inline-block"
      >
        + Add New Product
      </Link>

      {loading ? (
        <p>Loading your products...</p>
      ) : products.length === 0 ? (
        <p>You haven’t listed any products yet.</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-gray-900 p-4 rounded flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg text-gold">{product.name}</h2>
                <p>${product.price}</p>
                <p className="text-sm text-gray-400">
                  Status: {product.status}
                </p>
              </div>
              <div className="space-x-4">
                <Link
                  href={`/marketplace/edit-product?id=${product._id}`}
                  className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-400 transition"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="bg-red-600 px-3 py-1 rounded hover:bg-red-500 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
