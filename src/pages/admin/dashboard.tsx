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

/** -----------------------------
 * Stats shapes
 * ----------------------------- */

// Legacy flat stats (your current page expected this)
type StatsLegacy = {
  pendingBusinesses?: number;
  pendingPayouts?: number;
  activeAffiliates?: number;
  pendingJobs?: number;
  pendingProducts?: number;
  totalUsers?: number;
  internApplications?: number;

  pendingListings?: number;
  totalDirectoryListings?: number;
  directoryRevenue?: number;

  totalProducts?: number;
  featuredProducts?: number;
  outOfStockProducts?: number;
  lowStockProducts?: number;

  totalOrders?: number;
  grossSales?: number;
  platformRevenue?: number;
};

// New structured stats (from the updated dashboard-stats.ts I gave you)
type StatsV2 = {
  pendingApprovalsTotal?: number;

  businesses?: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  organizations?: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };

  affiliates?: { active: number; pendingPayouts: number };

  jobs?: { pending: number };
  products?: { pending: number };

  directory?: {
    pendingApprovals: number;
    active: number;
    expired: number;
    paidPurchases: number;
    paidUnlinked: number;
  };

  totalUsers?: number;
  internApplications?: number;

  consultingLeads?: number;
};

// What we actually render (normalized view model)
type StatsVM = {
  // rollups
  pendingApprovalsTotal: number;

  // platform
  totalUsers: number;
  internApplications: number;

  // approvals
  pendingBusinesses: number;
  pendingOrganizations: number;
  pendingJobs: number;
  pendingProducts: number;
  pendingDirectory: number;
  pendingPayouts: number;

  // orgs & biz totals
  totalBusinesses: number;
  approvedBusinesses: number;
  rejectedBusinesses: number;

  totalOrganizations: number;
  approvedOrganizations: number;
  rejectedOrganizations: number;

  // affiliates
  activeAffiliates: number;

  // directory health
  directoryActive: number;
  directoryExpired: number;
  directoryPaidPurchases: number;
  directoryPaidUnlinked: number;

  // optional business signals
  directoryRevenue: number; // will be 0 unless you add it to API
  totalDirectoryListings: number; // fallback if you still track this
};

const _DEFAULT_VM: StatsVM = {
  pendingApprovalsTotal: 0,

  totalUsers: 0,
  internApplications: 0,

  pendingBusinesses: 0,
  pendingOrganizations: 0,
  pendingJobs: 0,
  pendingProducts: 0,
  pendingDirectory: 0,
  pendingPayouts: 0,

  totalBusinesses: 0,
  approvedBusinesses: 0,
  rejectedBusinesses: 0,

  totalOrganizations: 0,
  approvedOrganizations: 0,
  rejectedOrganizations: 0,

  activeAffiliates: 0,

  directoryActive: 0,
  directoryExpired: 0,
  directoryPaidPurchases: 0,
  directoryPaidUnlinked: 0,

  directoryRevenue: 0,
  totalDirectoryListings: 0,
};

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStats(data: StatsV2 & StatsLegacy): StatsVM {
  const pendingBusinesses = toNum(
    data.businesses?.pending ?? data.pendingBusinesses,
  );
  const pendingOrganizations = toNum(data.organizations?.pending ?? 0);
  const pendingJobs = toNum(data.jobs?.pending ?? data.pendingJobs);
  const pendingProducts = toNum(data.products?.pending ?? data.pendingProducts);
  const pendingPayouts = toNum(
    data.affiliates?.pendingPayouts ?? data.pendingPayouts,
  );

  const pendingDirectory = toNum(
    data.directory?.pendingApprovals ?? data.pendingListings ?? 0,
  );

  const pendingApprovalsTotal =
    toNum(data.pendingApprovalsTotal ?? 0) ||
    pendingBusinesses +
      pendingOrganizations +
      pendingJobs +
      pendingProducts +
      pendingDirectory +
      pendingPayouts;

  return {
    pendingApprovalsTotal,

    totalUsers: toNum(data.totalUsers),
    internApplications: toNum(data.internApplications),

    pendingBusinesses,
    pendingOrganizations,
    pendingJobs,
    pendingProducts,
    pendingDirectory,
    pendingPayouts,

    totalBusinesses: toNum(data.businesses?.total ?? 0),
    approvedBusinesses: toNum(data.businesses?.approved ?? 0),
    rejectedBusinesses: toNum(data.businesses?.rejected ?? 0),

    totalOrganizations: toNum(data.organizations?.total ?? 0),
    approvedOrganizations: toNum(data.organizations?.approved ?? 0),
    rejectedOrganizations: toNum(data.organizations?.rejected ?? 0),

    activeAffiliates: toNum(data.affiliates?.active ?? data.activeAffiliates),

    directoryActive: toNum(data.directory?.active ?? 0),
    directoryExpired: toNum(data.directory?.expired ?? 0),
    directoryPaidPurchases: toNum(data.directory?.paidPurchases ?? 0),
    directoryPaidUnlinked: toNum(data.directory?.paidUnlinked ?? 0),

    // legacy-only (if you still use these)
    directoryRevenue: toNum(data.directoryRevenue ?? 0),
    totalDirectoryListings: toNum(data.totalDirectoryListings ?? 0),
  };
}

function formatMoney(n: number) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const AdminDashboard = () => {
  // 1) Raw stats + view model
  const [statsRaw, setStatsRaw] = useState<any>({});
  const stats = useMemo(() => normalizeStats(statsRaw || {}), [statsRaw]);
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
        setStatsRaw(data || {});
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
      const hay =
        `${item.name} ${item.email} ${item.company ?? ""} ${item.message ?? ""}`.toLowerCase();
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
                title="Active Affiliates"
                value={stats.activeAffiliates}
              />
              <StatCard title="Pending Payouts" value={stats.pendingPayouts} />

              <StatCard title="Pending Jobs" value={stats.pendingJobs} />
              <StatCard
                title="Pending Products"
                value={stats.pendingProducts}
              />
            </div>
          )}
        </div>

        {/* Approvals Queue */}
        <div>
          <SectionTitle>Approvals & Queues</SectionTitle>

          {statsLoading ? (
            <div className="rounded border border-gray-700 bg-gray-800 p-4 text-sm text-gray-300">
              Loading approvals…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <StatCard
                  title="Total Pending Approvals"
                  value={stats.pendingApprovalsTotal}
                  tone={stats.pendingApprovalsTotal > 0 ? "warn" : "ok"}
                />

                <Link href="/admin/business-approvals" className="block">
                  <StatCardLink
                    title="Pending Businesses"
                    value={stats.pendingBusinesses}
                  />
                </Link>

                {/* NOTE: create this page if it doesn't exist yet */}
                <Link href="/admin/organization-approvals" className="block">
                  <StatCardLink
                    title="Pending Organizations"
                    value={stats.pendingOrganizations}
                  />
                </Link>

                <Link href="/admin/job-approvals" className="block">
                  <StatCardLink
                    title="Pending Jobs"
                    value={stats.pendingJobs}
                  />
                </Link>

                <Link href="/admin/product-approvals" className="block">
                  <StatCardLink
                    title="Pending Products"
                    value={stats.pendingProducts}
                  />
                </Link>

                <Link href="/admin/directory-approvals" className="block">
                  <StatCardLink
                    title="Pending Directory"
                    value={stats.pendingDirectory}
                  />
                </Link>

                <Link href="/admin/affiliate-payouts" className="block">
                  <StatCardLink
                    title="Pending Affiliate Payouts"
                    value={stats.pendingPayouts}
                  />
                </Link>
              </div>

              {/* Organizations summary */}
              <div className="bg-gray-800 rounded p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg text-gold">Organizations Snapshot</h3>
                  <div className="text-xs text-gray-400">
                    Total:{" "}
                    <span className="text-gray-200 font-semibold">
                      {stats.totalOrganizations}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <MiniStat
                    label="Approved"
                    value={stats.approvedOrganizations}
                  />
                  <MiniStat
                    label="Rejected"
                    value={stats.rejectedOrganizations}
                  />
                  <MiniStat
                    label="Pending"
                    value={stats.pendingOrganizations}
                    tone={stats.pendingOrganizations > 0 ? "warn" : "ok"}
                  />
                </div>

                <div className="mt-3">
                  <Link
                    href="/admin/organization-approvals"
                    className="inline-flex items-center rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs hover:bg-gray-700"
                  >
                    Manage Organization Approvals →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Directory Section */}
      <SectionTitle>Directory Listings</SectionTitle>

      {slotLoading && !slotData ? (
        <div className="rounded border border-gray-700 bg-gray-800 p-4 text-sm text-gray-300">
          Loading directory slot data…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard
              title="Active Listings"
              value={stats.directoryActive || stats.totalDirectoryListings}
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingDirectory}
              tone={stats.pendingDirectory > 0 ? "warn" : "ok"}
            />

            {/* Payments health — this is how we catch “paid but not in admin” */}
            <StatCard
              title="Paid Purchases"
              value={stats.directoryPaidPurchases}
            />
            <StatCard
              title="Paid but Unlinked"
              value={stats.directoryPaidUnlinked}
              tone={stats.directoryPaidUnlinked > 0 ? "danger" : "ok"}
              hint="This indicates someone paid but the listing isn't linked (missing businessId/fulfillment)."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Link href="/admin/directory-approvals" className="block">
              <ActionCard
                title="Open Directory Approvals"
                subtitle="Review pending listings & activate slots"
              />
            </Link>

            {/* Optional: if you have a dedicated directory list page later */}
            <Link href="/admin/directory" className="block">
              <ActionCard
                title="View Directory Listings"
                subtitle="Browse active/expired listings"
              />
            </Link>

            <div className="bg-gray-800 rounded p-4 border border-gray-700">
              <div className="text-sm text-gray-400">Directory Revenue ($)</div>
              <div className="text-2xl text-gold font-bold mt-1">
                {formatMoney(stats.directoryRevenue)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                (Set to 0 until you add revenue calculation in the stats API.)
              </div>
            </div>
          </div>

          {/* Featured Directory Slots */}
          <div className="bg-gray-800 rounded p-4 mt-2 border border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg text-gold">Featured Directory Slots</h3>
              <button
                onClick={() => {
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
                  "border-gray-700 bg-gray-900 hover:bg-gray-700 text-gray-200",
                )}
                disabled={slotLoading}
              >
                {slotLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {slotLoading ? (
              <p className="mt-3 text-sm text-gray-300">Loading slot data…</p>
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
                            #{biz.queuePosition || idx + 1}: {biz.businessName}
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
                          {new Date(biz.featuredEndDate).toLocaleDateString()})
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

      {/* Marketplace Section (kept; will show zeros until API returns these) */}
      <SectionTitle>Marketplace Overview</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard title="Pending Products" value={stats.pendingProducts} />
        <StatCard title="Active Affiliates" value={stats.activeAffiliates} />
        <StatCard title="Pending Jobs" value={stats.pendingJobs} />
        <StatCard title="Pending Businesses" value={stats.pendingBusinesses} />
      </div>

      {/* Quick Actions */}
      <SectionTitle>Quick Admin Actions</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto mb-12">
        <AdminLink
          href="/admin/business-approvals"
          label="Manage Business Approvals"
        />
        {/* NOTE: create this page if missing */}
        <AdminLink
          href="/admin/organization-approvals"
          label="Manage Organization Approvals"
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
        <AdminLink
          href="/admin/intern-applications"
          label="Intern Applications"
        />
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
  tone,
  hint,
}: {
  title: string;
  value: number | string;
  tone?: "ok" | "warn" | "danger";
  hint?: string;
}) => (
  <div
    className={cx(
      "bg-gray-800 p-5 rounded shadow text-center border",
      tone === "danger"
        ? "border-red-500/40"
        : tone === "warn"
          ? "border-yellow-500/30"
          : "border-gray-800",
    )}
    title={hint}
  >
    <p className="text-gray-400 text-sm">{title}</p>
    <p
      className={cx(
        "text-2xl font-bold mt-1",
        tone === "danger"
          ? "text-red-300"
          : tone === "warn"
            ? "text-yellow-300"
            : "text-gold",
      )}
    >
      {value}
    </p>
    {hint ? <p className="text-xs text-gray-500 mt-1">{hint}</p> : null}
  </div>
);

const StatCardLink = ({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) => (
  <div className="bg-gray-800 p-5 rounded shadow text-center hover:bg-gray-700 transition cursor-pointer">
    <p className="text-gray-400 text-sm">{title}</p>
    <p className="text-2xl text-gold font-bold mt-1">{value}</p>
  </div>
);

const MiniStat = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "danger";
}) => (
  <div
    className={cx(
      "rounded border px-3 py-2 text-center",
      tone === "danger"
        ? "border-red-500/40 bg-red-500/10"
        : tone === "warn"
          ? "border-yellow-500/30 bg-yellow-500/10"
          : "border-gray-700 bg-gray-900",
    )}
  >
    <div className="text-xs text-gray-400">{label}</div>
    <div
      className={cx(
        "text-lg font-semibold",
        tone ? "text-gray-100" : "text-gray-200",
      )}
    >
      {value}
    </div>
  </div>
);

const ActionCard = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="bg-gray-800 rounded p-4 border border-gray-700 hover:bg-gray-700 transition">
    <div className="text-gold font-semibold">{title}</div>
    <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
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
