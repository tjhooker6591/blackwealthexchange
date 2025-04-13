"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Business {
  businessName: string;
  email: string;
  verified: boolean;
}

export default function AddBusiness() {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    // Simulate fetching business profile from API
    setTimeout(() => {
      setBusiness({
        businessName: "Example Biz",
        email: "owner@example.com",
        verified: false,
      });
      setLoading(false);
    }, 300);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">Loading your business dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-yellow-500 mb-4">
        Business Dashboard
      </h1>

      <div className="bg-gray-900 p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-yellow-400">
          Your Business Info
        </h2>
        <p className="text-gray-300 mt-2">
          <strong>Business:</strong> {business?.businessName}
        </p>
        <p className="text-gray-300">
          <strong>Email:</strong> {business?.email}
        </p>
        <p className="text-gray-300">
          <strong>Verified:</strong>{" "}
          {business?.verified ? "✅ Yes" : "❌ Not Verified"}
        </p>
        <button className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 transition">
          Edit Business Info
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/business-directory/add">
          <div className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg shadow transition cursor-pointer">
            <h3 className="text-lg font-semibold text-white">
              Submit Business Listing
            </h3>
            <p className="text-sm text-gray-400">
              Add your business to our public directory.
            </p>
          </div>
        </Link>

        <Link href="/advertise">
          <div className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg shadow transition cursor-pointer">
            <h3 className="text-lg font-semibold text-white">Advertising</h3>
            <p className="text-sm text-gray-400">
              Promote your brand with banner ads and featured slots.
            </p>
          </div>
        </Link>

        <Link href="/marketplace/become-a-seller">
          <div className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg shadow transition cursor-pointer">
            <h3 className="text-lg font-semibold text-white">
              Upgrade to Seller
            </h3>
            <p className="text-sm text-gray-400">
              Start selling products in the marketplace.
            </p>
          </div>
        </Link>

        <Link href="/dashboard/analytics">
          <div className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg shadow transition cursor-pointer">
            <h3 className="text-lg font-semibold text-white">Insights</h3>
            <p className="text-sm text-gray-400">
              View analytics for your listings and ad performance.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
