// src/pages/marketplace/dashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
};

type Order = {
  _id: string;
  createdAt: string;
  totalPrice: number;
  // add other fields as needed
};

export default function SellerDashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Fetch products
    fetch("/api/marketplace/get-products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        // data = { products: Product[], total: number }
        setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((err) => console.error("Error fetching products:", err));

    // Fetch orders
    fetch("/api/marketplace/get-orders", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        // data = { orders: Order[] }
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      })
      .catch((err) => console.error("Error fetching orders:", err));
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/marketplace/edit-product?id=${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`/api/marketplace/delete-products?id=${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="min-h-screen p-6 bg-black text-white">
      <h1 className="text-3xl font-bold text-gold mb-8">Seller Dashboard</h1>

      {/* Products Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">My Products</h2>
        {products.length === 0 ? (
          <p className="text-gray-400">You have no products listed.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-gray-800 rounded p-4 border border-gray-700"
              >
                <div className="relative h-40 w-full mb-3">
                  <Image
                    src={product.imageUrl || "/placeholder.png"}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-400 mb-1">
                  Category: {product.category}
                </p>
                <p className="text-sm text-gray-400 mb-3">
                  Price: ${product.price}
                </p>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleEdit(product._id)}
                    className="px-3 py-1 text-sm bg-gold text-black rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-400">No orders have been placed yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-gray-800 p-4 rounded border border-gray-700"
              >
                <p className="text-white mb-1">Order ID: {order._id}</p>
                <p className="text-gray-400 mb-1">
                  Placed: {new Date(order.createdAt).toLocaleString()}
                </p>
                <p className="text-gray-400">
                  Total: ${order.totalPrice.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
