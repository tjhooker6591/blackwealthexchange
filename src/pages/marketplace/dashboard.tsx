"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

interface Product {
  _id: string;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
}

interface Order {
  _id: string;
  productId: string;
  buyerEmail: string;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
}

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/verify");
      if (res.status !== 200) {
        router.push("/auth/seller-login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, orderRes] = await Promise.all([
          fetch("/api/marketplace/get-products"),
          fetch("/api/marketplace/get-orders"),
        ]);
        const productsData = await productRes.json();
        const ordersData = await orderRes.json();

        setProducts(productsData);
        setOrders(ordersData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/marketplace/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?",
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/marketplace/delete-product?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((product) => product._id !== id));
      } else {
        const data = await res.json();
        alert(`Failed to delete product: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/seller-login");
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gold">Seller Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Sales Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded text-center border border-gold">
            <h2 className="text-sm text-gray-400">Total Products</h2>
            <p className="text-2xl font-bold text-white">{products.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center border border-gold">
            <h2 className="text-sm text-gray-400">Orders</h2>
            <p className="text-2xl font-bold text-white">{orders.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded text-center border border-gold">
            <h2 className="text-sm text-gray-400">Total Revenue</h2>
            <p className="text-2xl font-bold text-white">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Product List */}
        <h2 className="text-xl font-semibold text-gold mb-4">Your Products</h2>
        {loading ? (
          <p className="text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-400">You have not added any products yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
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

        {/* Orders Table */}
        <h2 className="text-xl font-semibold text-gold mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-400">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border border-gray-700 bg-gray-900">
              <thead>
                <tr className="text-gold border-b border-gray-700">
                  <th className="p-2">Buyer</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-t border-gray-800 text-white"
                  >
                    <td className="p-2">{order.buyerEmail}</td>
                    <td className="p-2">{order.quantity}</td>
                    <td className="p-2">${order.total.toFixed(2)}</td>
                    <td className="p-2">{order.status}</td>
                    <td className="p-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
