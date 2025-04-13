"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface Order {
  _id: string;
  productName: string;
  buyerEmail: string;
  amount: number;
  date: string;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [revenue, setRevenue] = useState<number>(0);

  useEffect(() => {
    // Fetch products for the seller
    fetch("/api/marketplace/products/by-seller")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []));

    // Fetch orders for the seller
    fetch("/api/marketplace/orders/by-seller")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        const total = data.orders?.reduce(
          (sum: number, order: Order) => sum + order.amount,
          0,
        );
        setRevenue(total || 0);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h2 className="text-3xl font-bold text-yellow-500 mb-6">
        Seller Dashboard
      </h2>

      {/* Revenue Summary */}
      <div className="mb-8 p-4 bg-gray-800 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-2 text-yellow-400">
          Revenue Summary
        </h3>
        <p className="text-2xl">${revenue.toFixed(2)}</p>
      </div>

      {/* Product List */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-yellow-400">
            Your Products
          </h3>
          <Link
            href="/marketplace/add-products"
            className="text-sm text-yellow-300 underline"
          >
            + Add New Product
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-gray-400">No products added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <div className="relative w-full h-40 mb-2 rounded overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded"
                  />
                </div>
                <h4 className="text-lg font-bold">{product.name}</h4>
                <p className="text-sm text-gray-300">{product.category}</p>
                <p className="text-yellow-400 font-semibold mt-2">
                  ${product.price.toFixed(2)}
                </p>
                <div className="mt-3 flex gap-4">
                  <Link
                    href={`/marketplace/edit-products?id=${product._id}`}
                    className="text-sm text-blue-400 underline"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      fetch(
                        `/api/marketplace/products/delete?id=${product._id}`,
                        { method: "DELETE" },
                      ).then(() => {
                        setProducts((prev) =>
                          prev.filter((p) => p._id !== product._id),
                        );
                      });
                    }}
                    className="text-sm text-red-400 underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders */}
      <div>
        <h3 className="text-2xl font-semibold text-yellow-400 mb-4">
          Recent Orders
        </h3>
        {orders.length === 0 ? (
          <p className="text-gray-400">No orders yet.</p>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order._id} className="bg-gray-800 p-4 rounded-lg shadow">
                <p className="font-semibold">{order.productName}</p>
                <p className="text-sm text-gray-300">
                  Buyer: {order.buyerEmail}
                </p>
                <p className="text-sm text-yellow-400">
                  Amount: ${order.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  Date: {new Date(order.date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
