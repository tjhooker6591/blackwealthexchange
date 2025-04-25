import React, { useEffect, useState } from "react";
import Link from "next/link";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    pendingBusinesses: 0,
    pendingPayouts: 0,
    activeAffiliates: 0,
    pendingJobs: 0,
    pendingProducts: 0,
    totalUsers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/dashboard-stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
        setMessage("Error loading dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gold">Admin Control Center</h1>
        <p className="text-gray-400 mt-2">
          Manage all core operations of Black Wealth Exchange
        </p>
      </header>

      {message && (
        <div className="mb-6 p-3 bg-red-600 rounded text-center text-sm">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-center">Loading dashboard...</p>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-center">
            <StatCard
              title="Pending Businesses"
              value={stats.pendingBusinesses}
            />
            <StatCard title="Pending Payouts" value={stats.pendingPayouts} />
            <StatCard
              title="Active Affiliates"
              value={stats.activeAffiliates}
            />
            <StatCard title="Pending Jobs" value={stats.pendingJobs} />
            <StatCard title="Pending Products" value={stats.pendingProducts} />
            <StatCard title="Total Users" value={stats.totalUsers} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <AdminLink
              href="/admin/business-approvals"
              label="Manage Business Approvals"
            />
            <AdminLink
              href="/admin/affiliate-payouts"
              label="Review Affiliate Payouts"
            />
            <AdminLink href="/admin/affiliates" label="Manage Affiliates" />
            <AdminLink
              href="/admin/job-approvals"
              label="Approve Job Postings"
            />
            <AdminLink
              href="/admin/product-approvals"
              label="Approve Marketplace Products"
            />
            <AdminLink
              href="/admin/user-management"
              label="User & Account Management"
            />
            <AdminLink
              href="/admin/content-moderation"
              label="Moderate Articles & Resources"
            />
            <AdminLink
              href="/admin/analytics"
              label="View Platform Analytics"
            />
          </div>
        </>
      )}
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-gray-800 p-6 rounded shadow">
    <p className="text-gray-400">{title}</p>
    <p className="text-3xl text-gold font-bold">{value}</p>
  </div>
);

// Reusable Admin Link Button
const AdminLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="block bg-gold text-black text-center py-4 rounded font-semibold hover:bg-yellow-400 transition"
  >
    {label}
  </Link>
);

export default AdminDashboard;
