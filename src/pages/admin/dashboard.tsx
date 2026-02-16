// src/pages/admin/dashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import type { AdminFilters } from "@/components/admin/AdminFilterBar";

// Type for Consulting Interest
type ConsultingInterest = {
  _id: string;
  name: string;
  email: string;
  company?: string;
  message?: string;
  createdAt: string;
};

type Stats = {
  pendingBusinesses: number;
  pendingPayouts: number;
  activeAffiliates: number;
  pendingJobs: number;
  pendingProducts: number;
  totalUsers: number;
  internApplications: number;

  pendingListings: number;
  totalDirectoryListings: number;
  directoryRevenue: number;

  totalProducts: number;
  featuredProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;

  totalOrders: number;
  grossSales: number;
  platformRevenue: number;
};

type SlotBiz = {
  _id: string;
  businessName: string;
  featuredSlot: number;
  featuredEndDate: string;
  queuePosition?: number;
};

type SlotData = {
  slotsFilled: number;
  maxSlots: number;
  slotsAvailable: number;
  featured: SlotBiz[];
  waitlist: SlotBiz[];
  expiringSoon: SlotBiz[];
};

const DEFAULT_STATS: Stats = {
  pendingBusinesses: 0,
  pendingPayouts: 0,
  activeAffiliates: 0,
  pendingJobs: 0,
  pendingProducts: 0,
  totalUsers: 0,
  internApplications: 0,
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
};

function formatMoney(n: number) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const AdminDashboard = () => {
  // 1) Dashboard stats
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsErr, setStatsErr] = useState("");

  // 2) Featured slots/waitlist
  const [slotData, setSlotData] = useState<SlotData | null>(null);
  const [slotLoading, setSlotLoading] = useState(true);
  const [slotMessage, setSlotMessage] = useState<string>("");

  // 3) Consulting interests
  const [consulting, setConsulting] = useState<ConsultingInterest[]>([]);
  const [consultingLoading, setConsultingLoading] = useState(true);
  const [consultingErr, setConsultingErr] = useState("");

  // 4) Admin filter state (applies to consulting table below)
  const DEFAULT_FILTERS: AdminFilters = {
    search: "",
    status: "all",
    type: "all",
    range: "all",
    sort: "newest",
  };
  const [filters, setFilters] = useState<AdminFilters>(DEFAULT_FILTERS);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsErr("");
      try {
        const res = await fetch("/api/admin/dashboard-stats", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats((prev) => ({ ...prev, ...(data || {}) }));
      } catch (e: any) {
        setStatsErr(e?.message || "Error loading dashboard stats.");
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch slot data
  useEffect(() => {
    const fetchSlots = async () => {
      setSlotLoading(true);
      setSlotMessage("");
      try {
        const res = await fetch("/api/admin/directory-slots", {
          credentials: "include",
        });
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

  // Fetch consulting interests
  useEffect(() => {
    const fetchConsulting = async () => {
      setConsultingLoading(true);
      setConsultingErr("");
      try {
        const res = await fetch("/api/admin/consulting-interests", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch consulting interests");
        const data = await res.json();
        setConsulting(Array.isArray(data) ? data : []);
      } catch (_err) {
        setConsultingErr("Error loading consulting waitlist.");
      } finally {
        setConsultingLoading(false);
      }
    };
    fetchConsulting();
  }, []);

  // Apply filters to consulting waitlist
  const filteredConsulting = useMemo(() => {
    const now = Date.now();

    const withinRange = (iso: string) => {
      if (filters.range === "all") return true;
      const days = parseInt(filters.range, 10);
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return true;
      const diffDays = (now - t) / (1000 * 60 * 60 * 24);
      return diffDays <= days;
    };

    const matchesSearch = (item: ConsultingInterest) => {
      const q = filters.search.trim().toLowerCase();
      if (!q) return true;
      const hay = `${item.name} ${item.email} ${item.company ?? ""} ${
        item.message ?? ""
      }`.toLowerCase();
      return hay.includes(q);
    };

    let out = consulting
      .filter((item) => withinRange(item.createdAt))
      .filter((item) => matchesSearch(item));

    out = [...out].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      const aName = (a.name ?? "").toLowerCase();
      const bName = (b.name ?? "").toLowerCase();

      switch (filters.sort) {
        case "oldest":
          return aTime - bTime;
        case "name_asc":
          return aName.localeCompare(bName);
        case "name_desc":
          return bName.localeCompare(aName);
        case "newest":
        default:
          return bTime - aTime;
      }
    });

    return out;
  }, [consulting, filters.range, filters.search, filters.sort]);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6 md:p-10">
      <header className="mb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-gold mb-1">
              Admin Control Center
            </h1>
            <p className="text-gray-400 mt-2">
              Manage and monitor all core operations of Black Wealth Exchange
            </p>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-2">
            <Link
              href="/admin/tools"
              className="rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
            >
              Open Tools
            </Link>
            <Link
              href="/"
              className="rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
            >
              View Site
            </Link>
          </div>
        </div>

        {(statsErr || slotMessage || consultingErr) && (
          <div className="mt-6 grid grid-cols-1 gap-3">
            {statsErr ? (
              <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {statsErr}
              </div>
            ) : null}
            {slotMessage ? (
              <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {slotMessage}
              </div>
            ) : null}
            {consultingErr ? (
              <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {consultingErr}
              </div>
            ) : null}
          </div>
        )}
      </header>

      {/* Top sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Platform Stats */}
        <div>
          <SectionTitle>Platform Overview</SectionTitle>

          {statsLoading ? (
            <div className="rounded border border-gray-700 bg-gray-800 p-4 text-sm text-gray-300">
              Loading platform stats…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Total Users" value={stats.totalUsers} />

              <Link href="/admin/intern-applications" className="block">
                <div className="bg-gray-800 p-5 rounded shadow text-center hover:bg-gray-700 transition cursor-pointer">
                  <p className="text-gray-400 text-sm">Intern Applications</p>
                  <p className="text-2xl text-gold font-bold mt-1">
                    {stats.internApplications}
                  </p>
                </div>
              </Link>

              <StatCard
                title="Pending Businesses"
                value={stats.pendingBusinesses}
              />
              <StatCard
                title="Active Affiliates"
                value={stats.activeAffiliates}
              />
              <StatCard title="Pending Payouts" value={stats.pendingPayouts} />
              <StatCard title="Pending Jobs" value={stats.pendingJobs} />
            </div>
          )}
        </div>

        {/* Directory Section */}
        <div>
          <SectionTitle>Directory Listings</SectionTitle>

          {slotLoading && !slotData ? (
            <div className="rounded border border-gray-700 bg-gray-800 p-4 text-sm text-gray-300">
              Loading directory slot data…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <StatCard
                  title="Total Listings"
                  value={stats.totalDirectoryListings}
                />
                <StatCard
                  title="Pending Listings"
                  value={stats.pendingListings}
                />
                <StatCard
                  title="Directory Revenue ($)"
                  value={formatMoney(stats.directoryRevenue)}
                />
                <Link href="/admin/directory-approvals" className="block">
                  <div className="bg-gray-800 p-5 rounded shadow text-center hover:bg-gray-700 transition cursor-pointer">
                    <p className="text-gray-400 text-sm">Open Approvals</p>
                    <p className="text-2xl text-gold font-bold mt-1">→</p>
                  </div>
                </Link>
              </div>

              {/* Featured Directory Slots */}
              <div className="bg-gray-800 rounded p-4 mt-2 border border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg text-gold">Featured Directory Slots</h3>
                  <button
                    onClick={() => {
                      // just re-run slots fetch quickly
                      setSlotLoading(true);
                      setSlotMessage("");
                      fetch("/api/admin/directory-slots", {
                        credentials: "include",
                      })
                        .then(async (r) => {
                          if (!r.ok) throw new Error("Failed to fetch slot data");
                          const data = await r.json();
                          setSlotData(data);
                        })
                        .catch(() => setSlotMessage("Error loading slot data."))
                        .finally(() => setSlotLoading(false));
                    }}
                    className={cx(
                      "rounded border px-3 py-1 text-xs transition",
                      "border-gray-700 bg-gray-900 hover:bg-gray-700 text-gray-200"
                    )}
                    disabled={slotLoading}
                  >
                    {slotLoading ? "Refreshing…" : "Refresh"}
                  </button>
                </div>

                {slotLoading ? (
                  <p className="mt-3 text-sm text-gray-300">
                    Loading slot data…
                  </p>
                ) : slotData ? (
                  <div className="mt-3 text-sm">
                    <div className="mb-3">
                      <span className="font-semibold">Slots Filled:</span>{" "}
                      {slotData.slotsFilled} / {slotData.maxSlots}{" "}
                      <span className="text-gray-400">
                        (available: {slotData.slotsAvailable})
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="font-semibold text-gray-200 mb-1">
                        Featured
                      </div>
                      {slotData.featured?.length ? (
                        <ul className="space-y-1">
                          {slotData.featured.map((biz) => (
                            <li key={biz._id} className="text-gray-200">
                              <span className="font-semibold">
                                Slot {biz.featuredSlot}:
                              </span>{" "}
                              {biz.businessName}{" "}
                              <span className="text-gray-400">
                                (expires{" "}
                                {new Date(biz.featuredEndDate).toLocaleDateString()}
                                )
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-400">No featured slots.</div>
                      )}
                    </div>

                    {slotData.slotsAvailable === 0 ? (
                      <div className="mb-3">
                        <div className="font-semibold text-yellow-400 mb-1">
                          Waitlist
                        </div>
                        {slotData.waitlist?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {slotData.waitlist.map((biz, idx) => (
                              <span
                                key={biz._id}
                                className="rounded-full border border-yellow-500/20 bg-black/30 px-3 py-1 text-xs text-yellow-200"
                              >
                                #{biz.queuePosition || idx + 1}:{" "}
                                {biz.businessName}
                                {idx === 0 ? (
                                  <span className="text-green-300">
                                    {" "}
                                    (Next up!)
                                  </span>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            No one in the waitlist.
                          </div>
                        )}
                      </div>
                    ) : null}

                    {slotData.expiringSoon?.length ? (
                      <div className="mb-1">
                        <div className="font-semibold text-yellow-400 mb-1">
                          Expiring Soon
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {slotData.expiringSoon.map((biz) => (
                            <span
                              key={biz._id}
                              className="rounded-full border border-yellow-500/20 bg-black/30 px-3 py-1 text-xs text-yellow-200"
                            >
                              {biz.businessName} (
                              {new Date(biz.featuredEndDate).toLocaleDateString()}
                              )
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-300">
                    No directory slot data found.
                  </p>
                )}
              </div>
            </>
          )}
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
        <StatCard title="Gross Sales ($)" value={formatMoney(stats.grossSales)} />
        <StatCard
          title="Platform Revenue ($)"
          value={formatMoney(stats.platformRevenue)}
        />
        <StatCard title="Pending Products" value={stats.pendingProducts} />
      </div>

      {/* Quick Actions */}
      <SectionTitle>Quick Admin Actions</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto mb-12">
        <AdminLink
          href="/admin/business-approvals"
          label="Manage Business Approvals"
        />
        <AdminLink
          href="/admin/directory-approvals"
          label="Approve Directory Listings"
        />
        <AdminLink
          href="/admin/affiliate-payouts"
          label="Review Affiliate Payouts"
        />
        <AdminLink href="/admin/affiliates" label="Manage Affiliates" />
        <AdminLink href="/admin/job-approvals" label="Approve Job Postings" />
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
        <AdminLink href="/admin/analytics" label="View Platform Analytics" />
        <AdminLink
          href="/admin/featured-products"
          label="Manage Featured Products"
        />
        <AdminLink
          href="/admin/inventory-report"
          label="View Inventory Report"
        />
        <AdminLink href="/admin/intern-applications" label="Intern Applications" />
      </div>

      {/* Consulting Service Waitlist */}
      <SectionTitle>Consulting Service Waitlist</SectionTitle>

      <div className="mb-4">
        <AdminFilterBar
          value={filters}
          onChange={setFilters}
          showType={false}
          showRange={true}
          showSort={true}
        />
      </div>

      <div className="bg-gray-800 rounded p-4 mt-4 mb-20 border border-gray-700">
        {consultingLoading ? (
          <p>Loading waitlist...</p>
        ) : consultingErr ? (
          <div className="p-2 bg-red-600 rounded text-center text-sm">
            {consultingErr}
          </div>
        ) : filteredConsulting.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No one has signed up for notifications yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left mt-2">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-gold font-semibold py-2 px-3">Name</th>
                  <th className="text-gold font-semibold py-2 px-3">Email</th>
                  <th className="text-gold font-semibold py-2 px-3">Company</th>
                  <th className="text-gold font-semibold py-2 px-3">Message</th>
                  <th className="text-gold font-semibold py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsulting.map((item) => (
                  <tr key={item._id} className="border-b border-gray-700">
                    <td className="py-2 px-3">{item.name}</td>
                    <td className="py-2 px-3">{item.email}</td>
                    <td className="py-2 px-3">{item.company || "--"}</td>
                    <td className="py-2 px-3">{item.message || "--"}</td>
                    <td className="py-2 px-3">
                      {new Date(item.createdAt).toLocaleString()}
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
};

// Section heading for clarity
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl md:text-2xl text-gold font-bold mt-12 mb-3">
    {children}
  </h2>
);

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => (
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

