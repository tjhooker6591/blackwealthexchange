import React, { useEffect, useState } from "react";
import Link from "next/link";

const AdminDashboard = () => {
  // 1. State for dashboard numbers
  const [stats, setStats] = useState({
    pendingBusinesses: 0,
    pendingPayouts: 0,
    activeAffiliates: 0,
    pendingJobs: 0,
    pendingProducts: 0,
    totalUsers: 0,
    pendingListings: 0,
    totalDirectoryListings: 0,
    directoryRevenue: 0,
    totalProducts: 0,
    featuredProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    grossSales: 0,
    platformRevenue: 0,
  });

  // 2. State for featured slots/waitlist
  const [slotData, setSlotData] = useState<any>(null);
  const [slotLoading, setSlotLoading] = useState(true);
  const [slotMessage, setSlotMessage] = useState<string>("");

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/dashboard-stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats((prev) => ({ ...prev, ...data }));
      } catch (_err) {
        console.error(_err); // Linter-safe: _err
      }
      // No loading/message state used
    };
    fetchStats();
  }, []);

  // Fetch slot data
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch("/api/admin/directory-slots");
        if (!res.ok) throw new Error("Failed to fetch slot data");
        const data = await res.json();
        setSlotData(data);
      } catch (_err) {
        setSlotMessage("Error loading slot data.");
      } finally {
        setSlotLoading(false);
      }
    };
    fetchSlots();
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6 md:p-10">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gold mb-1">Admin Control Center</h1>
        <p className="text-gray-400 mt-2">
          Manage and monitor all core operations of Black Wealth Exchange
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Platform Stats */}
        <div>
          <SectionTitle>Platform Overview</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Users" value={stats.totalUsers} />
            <StatCard title="Pending Businesses" value={stats.pendingBusinesses} />
            <StatCard title="Active Affiliates" value={stats.activeAffiliates} />
            <StatCard title="Pending Payouts" value={stats.pendingPayouts} />
          </div>
        </div>

        {/* Directory Section */}
        <div>
          <SectionTitle>Directory Listings</SectionTitle>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatCard title="Total Listings" value={stats.totalDirectoryListings} />
            <StatCard title="Pending Listings" value={stats.pendingListings} />
            <StatCard title="Directory Revenue ($)" value={Number(stats.directoryRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })} />
          </div>
          {/* Featured Directory Slots */}
          <div className="bg-gray-800 rounded p-4 mt-2">
            <h3 className="text-lg text-gold mb-2">Featured Directory Slots</h3>
            {slotMessage && (
              <div className="mb-2 p-2 bg-red-600 rounded text-center text-sm">
                {slotMessage}
              </div>
            )}
            {slotLoading ? (
              <p>Loading slot data...</p>
            ) : slotData ? (
              <>
                <div className="mb-2 text-sm">
                  <span className="font-semibold">Slots Filled:</span>{" "}
                  {slotData.slotsFilled} / {slotData.maxSlots}
                </div>
                <ul className="mb-2 text-sm">
                  {slotData.featured.map((biz: any) => (
                    <li key={biz._id}>
                      <span className="font-semibold">Slot {biz.featuredSlot}:</span> {biz.businessName}
                      {" "}
                      <span className="text-gray-400">
                        (expires {new Date(biz.featuredEndDate).toLocaleDateString()})
                      </span>
                    </li>
                  ))}
                </ul>
                {slotData.slotsAvailable === 0 && (
                  <div className="mb-2">
                    <span className="text-yellow-400">Waitlist:</span>{" "}
                    {slotData.waitlist.length > 0 ? (
                      slotData.waitlist.map((biz: any, idx: number) => (
                        <span key={biz._id} className="mr-2">
                          #{biz.queuePosition || idx + 1}: {biz.businessName}
                          {idx === 0 && <span className="text-green-400"> (Next up!)</span>}
                        </span>
                      ))
                    ) : (
                      <span>No one in the waitlist.</span>
                    )}
                  </div>
                )}
                {slotData.expiringSoon.length > 0 && (
                  <div className="mb-1">
                    <span className="text-yellow-400">Expiring Soon:</span>{" "}
                    {slotData.expiringSoon.map((biz: any) => (
                      <span key={biz._id} className="mr-2">
                        {biz.businessName} ({new Date(biz.featuredEndDate).toLocaleDateString()})
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p>No directory slot data found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Marketplace Section */}
      <SectionTitle>Marketplace Overview</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard title="Total Products" value={stats.totalProducts} />
        <StatCard title="Featured Products" value={stats.featuredProducts} />
        <StatCard title="Out of Stock" value={stats.outOfStockProducts} />
        <StatCard title="Low Stock" value={stats.lowStockProducts} />
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Gross Sales ($)" value={Number(stats.grossSales).toLocaleString(undefined, { minimumFractionDigits: 2 })} />
        <StatCard title="Platform Revenue ($)" value={Number(stats.platformRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })} />
      </div>

      {/* Quick Actions */}
      <SectionTitle>Quick Admin Actions</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto mb-12">
        <AdminLink href="/admin/business-approvals" label="Manage Business Approvals" />
        <AdminLink href="/admin/directory-approvals" label="Approve Directory Listings" />
        <AdminLink href="/admin/affiliate-payouts" label="Review Affiliate Payouts" />
        <AdminLink href="/admin/affiliates" label="Manage Affiliates" />
        <AdminLink href="/admin/job-approvals" label="Approve Job Postings" />
        <AdminLink href="/admin/product-approvals" label="Approve Marketplace Products" />
        <AdminLink href="/admin/user-management" label="User & Account Management" />
        <AdminLink href="/admin/content-moderation" label="Moderate Articles & Resources" />
        <AdminLink href="/admin/analytics" label="View Platform Analytics" />
        <AdminLink href="/admin/featured-products" label="Manage Featured Products" />
        <AdminLink href="/admin/inventory-report" label="View Inventory Report" />
      </div>
    </div>
  );
};

// Section heading for clarity
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl md:text-2xl text-gold font-bold mt-12 mb-3">{children}</h2>
);

const StatCard = ({ title, value }: { title: string; value: number | string }) => (
  <div className="bg-gray-800 p-5 rounded shadow text-center">
    <p className="text-gray-400 text-sm">{title}</p>
    <p className="text-2xl text-gold font-bold mt-1">{value}</p>
  </div>
);

const AdminLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="block bg-gold text-black text-center py-3 rounded font-semibold hover:bg-yellow-400 transition"
  >
    {label}
  </Link>
);

export default AdminDashboard;
