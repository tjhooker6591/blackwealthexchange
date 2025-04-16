// src/components/dashboards/SellerDashboard.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  products: number;
  orders: number;
  revenue: number;
};

export default function SellerDashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const verifyAndLoadStats = async () => {
      try {
        // Verify session & role
        const sessionRes = await fetch("/api/auth/me", { cache: "no-store" });
        const sessionData = await sessionRes.json();
        if (sessionData?.user?.accountType !== "seller") {
          setAccessDenied(true);
          return;
        }

        // Fetch seller stats
        const statsRes = await fetch("/api/marketplace/stats", { cache: "no-store" });
        const statsData = await statsRes.json();
        setStats({
          products: statsData.products || 0,
          orders: statsData.orders || 0,
          revenue: statsData.revenue || 0,
        });
      } catch (err) {
        console.error("Failed to load seller stats:", err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Loading Seller Dashboard…</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Access Denied. You do not have permission to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Seller Dashboard</h1>
          <nav>
            <Link href="/dashboard" className="mr-4 hover:underline">
              Dashboard Home
            </Link>
            <Link href="/profile" className="hover:underline">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1 p-6 bg-black text-white">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Products Listed" value={stats.products} />
          <StatCard label="Orders Received" value={stats.orders} />
          <StatCard label="Total Revenue" value={`$${stats.revenue.toFixed(2)}`} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard
            title="➕ Add Product"
            description="Add new items to your shop and grow your storefront."
            href="/marketplace/add-products"
            color="bg-indigo-700"
          />
          <DashboardCard
            title="🛒 View My Products"
            description="Manage, edit, or remove the items you’ve listed."
            href="/dashboard/seller/products"
            color="bg-teal-600"
          />
          <DashboardCard
            title="📦 View Orders"
            description="Track customer orders and manage delivery progress."
            href="/dashboard/seller/orders"
            color="bg-amber-700"
          />
          <DashboardCard
            title="📊 Analytics"
            description="View sales performance and track your revenue."
            href="/dashboard/seller/analytics"
            color="bg-pink-700"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-center">
      <h4 className="text-xl font-semibold text-gold">{value}</h4>
      <p className="text-sm text-gray-300 mt-1">{label}</p>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="block">
      <div className={`p-5 rounded-lg shadow hover:shadow-xl transition cursor-pointer ${color}`}>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm">{description}</p>
      </div>
    </Link>
  );
}
