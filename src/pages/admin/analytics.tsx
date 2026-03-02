// src/pages/admin/analytics.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

type StatData = {
  users: number;
  businesses: number;
  products: number;
  jobs: number;
  sellers: number;
  grossSales: number;
  platformRevenue: number;
  totalPayouts: number;
  totalOrders: number;
  userGrowth: { month: string; users: number }[];
  revenueByMonth: {
    month: string;
    totalSales: number;
    platformRevenue: number;
    payouts: number;
    orders: number;
  }[];
  sellerLeaderboard: { _id: string; totalSales: number; orders: number }[];
  buyerActivity: {
    uniqueBuyers: number;
    repeatBuyers: number;
    mostActiveBuyer?: { _id: string; orders: number };
  };
  pendingListings?: number;
  approvedListings?: number;
  expiredListings?: number;
  directoryRevenue?: number;
  dirRevenueByMonth?: { month: string; total: number }[];
  adRevenue?: number;
  adRevenueByMonth?: { month: string; total: number }[];
};

type MeResponse = {
  user?: {
    email?: string;
    accountType?: string;
    role?: string;
    isAdmin?: boolean;
    roles?: string[];
  };
};

function userIsAdmin(user?: MeResponse["user"]) {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (user.accountType === "admin") return true;
  if (user.role === "admin") return true;
  if (Array.isArray(user.roles) && user.roles.includes("admin")) return true;
  return false;
}

function money(value?: number) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
    <p className="text-sm text-zinc-400">{label}</p>
    <p className="mt-2 text-2xl font-bold text-gold">{value}</p>
  </div>
);

export default function AnalyticsDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    const res = await fetch("/api/admin/analytics", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Failed to load analytics.");
    }

    setStats(data);
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkAdminAndFetch = async () => {
      try {
        setError(null);

        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          router.replace("/login?redirect=/admin/analytics");
          return;
        }

        const sessionData: MeResponse = await sessionRes
          .json()
          .catch(() => ({}));

        if (!userIsAdmin(sessionData.user)) {
          router.replace("/");
          return;
        }

        await loadAnalytics();
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Failed to load analytics.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAdminAndFetch();

    return () => {
      mounted = false;
    };
  }, [loadAnalytics, router]);

  const refreshData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await loadAnalytics();
    } catch (err: any) {
      setError(err?.message || "Failed to refresh analytics.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-white">Loading analytics...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-500">{error}</p>;
  }

  if (!stats) {
    return <p className="p-8 text-gray-400">No analytics data found.</p>;
  }

  return (
    <>
      <Head>
        <title>Admin | Platform Analytics</title>
      </Head>

      <div className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gold">
                Platform Analytics
              </h1>
              <p className="text-sm text-zinc-400">
                Review marketplace, directory, revenue, and buyer activity
                metrics.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="rounded-lg border border-gold/30 bg-zinc-900 px-4 py-2 text-sm text-gold hover:bg-zinc-800 disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                href="/admin/dashboard"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Back to Admin Dashboard
              </Link>
            </div>
          </div>

          {/* Top Stats Cards */}
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            <StatCard label="Total Users" value={stats.users || 0} />
            <StatCard label="Businesses" value={stats.businesses || 0} />
            <StatCard label="Products" value={stats.products || 0} />
            <StatCard label="Jobs" value={stats.jobs || 0} />
            <StatCard label="Sellers" value={stats.sellers || 0} />
            <StatCard label="Total Orders" value={stats.totalOrders || 0} />
            <StatCard label="Gross Sales" value={money(stats.grossSales)} />
            <StatCard
              label="Platform Revenue"
              value={money(stats.platformRevenue)}
            />
            <StatCard
              label="Seller Payouts"
              value={money(stats.totalPayouts)}
            />
            <StatCard
              label="Directory Revenue"
              value={money(stats.directoryRevenue)}
            />
            <StatCard label="Ad Revenue" value={money(stats.adRevenue)} />
            <StatCard
              label="Pending Listings"
              value={stats.pendingListings || 0}
            />
            <StatCard
              label="Approved Listings"
              value={stats.approvedListings || 0}
            />
            <StatCard
              label="Expired Listings"
              value={stats.expiredListings || 0}
            />
          </div>

          {/* Seller Leaderboard */}
          <div className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-xl font-bold text-gold">Top Sellers</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Seller ID</th>
                    <th className="px-4 py-3">Total Sales</th>
                    <th className="px-4 py-3">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sellerLeaderboard?.length > 0 ? (
                    stats.sellerLeaderboard.map((seller, idx) => (
                      <tr
                        key={`${seller._id}-${idx}`}
                        className="border-b border-zinc-800 last:border-b-0"
                      >
                        <td className="px-4 py-2">{seller._id}</td>
                        <td className="px-4 py-2">
                          {money(seller.totalSales)}
                        </td>
                        <td className="px-4 py-2">{seller.orders}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-zinc-400">
                        No sellers yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buyer Activity */}
          <div className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-xl font-bold text-gold">Buyer Activity</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatCard
                label="Unique Buyers"
                value={stats.buyerActivity?.uniqueBuyers || 0}
              />
              <StatCard
                label="Repeat Buyers"
                value={stats.buyerActivity?.repeatBuyers || 0}
              />
              <StatCard
                label="Most Active Buyer"
                value={
                  stats.buyerActivity?.mostActiveBuyer
                    ? `${stats.buyerActivity.mostActiveBuyer._id} (${stats.buyerActivity.mostActiveBuyer.orders} orders)`
                    : "N/A"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
