"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type Product = {
  _id: string;
  name: string;
  price: number;
  status: string;
  stockQuantity?: number;
};

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellerReady, setSellerReady] = useState<boolean | null>(null);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError("");

        const sellerRes = await axios.get("/api/marketplace/get-my-seller", {
          withCredentials: true,
        });
        const seller = sellerRes.data?.seller;

        if (!seller?._id) {
          setError(
            "No seller profile found for this account yet. Complete seller onboarding first.",
          );
          setLoading(false);
          return;
        }

        const acctRes = await axios.get("/api/stripe/account-status", {
          withCredentials: true,
        });
        const ready =
          Boolean(acctRes.data?.connected) &&
          Boolean(acctRes.data?.detailsSubmitted) &&
          Boolean(acctRes.data?.chargesEnabled) &&
          Boolean(acctRes.data?.payoutsEnabled);
        setSellerReady(ready);

        const res = await axios.get(
          `/api/marketplace/get-products?sellerView=true&sellerId=${encodeURIComponent(seller._id)}&limit=100`,
          { withCredentials: true },
        );
        setProducts(Array.isArray(res.data?.products) ? res.data.products : []);

        const ordersRes = await axios.get(`/api/marketplace/get-orders`, {
          withCredentials: true,
        });
        const orders = Array.isArray(ordersRes.data?.orders)
          ? ordersRes.data.orders
          : [];
        const pending = orders.filter((o: any) => {
          const status = String(
            o?.orderState || o?.status || "pending",
          ).toLowerCase();
          return [
            "paid",
            "pending",
            "pending_fulfillment",
            "processing",
          ].includes(status);
        }).length;
        setPendingOrderCount(pending);
      } catch (err: any) {
        console.error("Failed to load products", err);
        setError(err?.response?.data?.error || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/marketplace/delete-product?id=${productId}`, {
        withCredentials: true,
      });
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      alert(err?.response?.data?.error || "Failed to delete product.");
    }
  };

  const outOfStockCount = products.filter(
    (p) => Number(p?.stockQuantity ?? 0) <= 0,
  ).length;

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gold">
            🛒 Manage My Products
          </h1>
          <div className="flex gap-2">
            <Link
              href="/marketplace/dashboard"
              className="px-4 py-2 rounded border border-gray-700 hover:bg-gray-900 transition"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/marketplace/add-products"
              className="bg-gold text-black px-4 py-2 rounded hover:bg-yellow-400 transition"
            >
              + Add New Product
            </Link>
          </div>
        </div>

        <div className="mb-5 rounded border border-yellow-500/40 bg-yellow-900/20 p-3 text-sm text-yellow-100">
          <p className="font-semibold">Action Required</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              New or pending fulfillment orders:{" "}
              <span className="font-semibold">{pendingOrderCount}</span>
            </li>
            <li>
              Out-of-stock products:{" "}
              <span className="font-semibold">{outOfStockCount}</span>
            </li>
            <li>
              Payout status:{" "}
              {sellerReady === false ? (
                <>
                  <span className="font-semibold">Setup required</span>
                  <Link
                    href="/marketplace/become-a-seller?refresh=1"
                    className="ml-2 underline"
                  >
                    Finish payout setup
                  </Link>
                </>
              ) : (
                <span className="font-semibold text-emerald-300">Ready</span>
              )}
            </li>
          </ul>
        </div>

        {loading ? (
          <p>Loading your products...</p>
        ) : error ? (
          <div className="rounded border border-red-500/40 bg-red-900/20 p-4">
            <p className="text-red-200">{error}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/marketplace/become-a-seller" className="underline">
                Go to seller onboarding
              </Link>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded border border-gray-700 bg-gray-900 p-4">
            <p>You haven’t listed any products yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Next step: add your first product, then it will appear here with
              pending/active status.
            </p>
            <Link
              href="/marketplace/add-products"
              className="inline-block mt-3 bg-gold text-black px-4 py-2 rounded hover:bg-yellow-400 transition"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-gray-900 p-4 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >
                <div>
                  <h2 className="text-lg text-gold">{product.name}</h2>
                  <p>${Number(product.price || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-400">
                    Status: {product.status}
                  </p>
                  <p className="text-sm text-gray-400">
                    Stock: {Number(product.stockQuantity ?? 0)}
                    {Number(product.stockQuantity ?? 0) <= 0 ? (
                      <span className="ml-2 rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300 border border-red-400/40">
                        Out of stock, update inventory
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="space-x-3">
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
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/dashboard/seller/products",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
    };
    if (payload.accountType !== "seller") {
      return {
        redirect: {
          destination: "/login?redirect=/dashboard/seller/products",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/dashboard/seller/products",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
