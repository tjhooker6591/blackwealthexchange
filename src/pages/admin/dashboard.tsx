// src/pages/admin/dashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import { getJwtSecret } from "@/lib/env";
import type { AdminFilters } from "@/components/admin/AdminFilterBar";

// Type for Consulting Interest
type ConsultingInterest = {
  _id: string;
  collection?: "consulting_interest" | "consulting_intake";
  name: string;
  email: string;
  company?: string;
  businessName?: string;
  message?: string;
  status?:
    | "pending"
    | "approved"
    | "rejected"
    | "flagged"
    | "spam"
    | "deleted"
    | string;
  lifecycleStage?: string;
  adminNote?: string;
  source?: string;
  ip?: string | null;
  userAgent?: string | null;
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

// Legacy flat stats (older dashboard-stats responses)
type StatsLegacy = {
  pendingBusinesses?: number;
  pendingOrganizations?: number;
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

// Structured stats (newer dashboard-stats shape)
type EntityCountsObject = {
  pending?: number;
  approved?: number;
  rejected?: number;
  total?: number;
};

type RecentJoinRow = {
  _id: string;
  name: string;
  email: string;
  accountType: string;
  sourceCollection: string;
  createdAt: string | null;
  status: string;
  isVerified: boolean;
  isAdmin: boolean;
  isTest: boolean;
  isActive: boolean;
};

type StatsV2 = {
  pendingApprovalsTotal?: number;

  // supports object OR numeric total
  businesses?: EntityCountsObject | number;
  organizations?: EntityCountsObject | number;

  affiliates?: { active?: number; pendingPayouts?: number };

  jobs?: { pending?: number };
  products?: { pending?: number };

  directory?: {
    pendingApprovals?: number;
    active?: number;
    expired?: number;
    paidPurchases?: number;
    paidUnlinked?: number;
  };

  totalUsers?: number;
  internApplications?: number;

  consultingLeads?: number;

  // optional direct totals from some APIs
  businessesCount?: number;
  organizationsCount?: number;

  recentJoins?: {
    windowDays?: number;
    summary?: {
      today?: number;
      last7Days?: number;
      last30Days?: number;
      byAccountType?: Record<
        string,
        { today: number; last7Days: number; last30Days: number }
      >;
    };
    dailyBuckets?: Array<{
      day: string;
      total: number;
      byAccountType: Record<string, number>;
      rows: RecentJoinRow[];
    }>;
    rows?: RecentJoinRow[];
  };
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
  directoryRevenue: number;
  totalDirectoryListings: number;
};

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function readEntityCounts(
  input: EntityCountsObject | number | undefined,
  fallbackPending = 0,
) {
  // Some endpoints may return just a numeric total
  if (typeof input === "number") {
    return {
      pending: toNum(fallbackPending),
      approved: 0,
      rejected: 0,
      total: toNum(input),
    };
  }

  // Newer endpoint returns object counts
  if (input && typeof input === "object") {
    return {
      pending: toNum(input.pending, fallbackPending),
      approved: toNum(input.approved),
      rejected: toNum(input.rejected),
      total: toNum(input.total),
    };
  }

  return {
    pending: toNum(fallbackPending),
    approved: 0,
    rejected: 0,
    total: 0,
  };
}

function normalizeStats(data: Partial<StatsV2 & StatsLegacy>): StatsVM {
  const pendingBusinessesLegacy = toNum((data as any).pendingBusinesses);
  const pendingOrganizationsLegacy = toNum((data as any).pendingOrganizations);

  const pendingJobs = toNum(data.jobs?.pending ?? (data as any).pendingJobs);
  const pendingProducts = toNum(
    data.products?.pending ?? (data as any).pendingProducts,
  );
  const pendingPayouts = toNum(
    data.affiliates?.pendingPayouts ?? (data as any).pendingPayouts,
  );

  const pendingDirectory = toNum(
    data.directory?.pendingApprovals ?? (data as any).pendingListings ?? 0,
  );

  const biz = readEntityCounts(data.businesses, pendingBusinessesLegacy);
  const org = readEntityCounts(data.organizations, pendingOrganizationsLegacy);

  const pendingApprovalsTotal =
    toNum(data.pendingApprovalsTotal) ||
    biz.pending +
      org.pending +
      pendingJobs +
      pendingProducts +
      pendingDirectory +
      pendingPayouts;

  return {
    pendingApprovalsTotal,

    totalUsers: toNum(data.totalUsers),
    internApplications: toNum(data.internApplications),

    pendingBusinesses: biz.pending,
    pendingOrganizations: org.pending,
    pendingJobs,
    pendingProducts,
    pendingDirectory,
    pendingPayouts,

    totalBusinesses: biz.total || toNum((data as any).businessesCount),
    approvedBusinesses: biz.approved,
    rejectedBusinesses: biz.rejected,

    totalOrganizations: org.total || toNum((data as any).organizationsCount),
    approvedOrganizations: org.approved,
    rejectedOrganizations: org.rejected,

    activeAffiliates: toNum(
      data.affiliates?.active ?? (data as any).activeAffiliates,
    ),

    directoryActive: toNum(data.directory?.active ?? 0),
    directoryExpired: toNum(data.directory?.expired ?? 0),
    directoryPaidPurchases: toNum(data.directory?.paidPurchases ?? 0),
    directoryPaidUnlinked: toNum(data.directory?.paidUnlinked ?? 0),

    directoryRevenue: toNum((data as any).directoryRevenue ?? 0),
    totalDirectoryListings: toNum((data as any).totalDirectoryListings ?? 0),
  };
}

function formatMoney(n: number) {
  const num = Number(n || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AdminDashboardProps = {
  initialRecentJoinAccountType: string;
  initialRecentJoinHideTests: boolean;
};

const AdminDashboard = ({
  initialRecentJoinAccountType,
  initialRecentJoinHideTests,
}: AdminDashboardProps) => {
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
  const [consultingSavingId, setConsultingSavingId] = useState<string>("");
  const [consultingNotes, setConsultingNotes] = useState<
    Record<string, string>
  >({});
  const [hideQaTestLikeConsulting, setHideQaTestLikeConsulting] =
    useState<boolean>(false);

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

  const fetchConsulting = async () => {
    setConsultingLoading(true);
    setConsultingErr("");
    try {
      const res = await fetch("/api/admin/consulting-interests", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch consulting interests");
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (data?.interests ?? []);
      setConsulting(Array.isArray(rows) ? rows : []);
    } catch (_err) {
      setConsultingErr("Error loading consulting waitlist.");
    } finally {
      setConsultingLoading(false);
    }
  };

  // Fetch consulting interests
  useEffect(() => {
    fetchConsulting();
  }, []);

  // Apply filters to consulting waitlist
  const recentJoinsSummary = useMemo(() => {
    const summary = statsRaw?.recentJoins?.summary || {};
    return {
      today: Number(summary?.today || 0),
      last7Days: Number(summary?.last7Days || 0),
      last30Days: Number(summary?.last30Days || 0),
      byAccountType: summary?.byAccountType || {},
    };
  }, [statsRaw]);

  const recentJoinsRows = useMemo<RecentJoinRow[]>(() => {
    const rows = Array.isArray(statsRaw?.recentJoins?.rows)
      ? (statsRaw.recentJoins.rows as RecentJoinRow[])
      : [];
    return [...rows].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [statsRaw]);

  const recentJoinWindowDays = Number(statsRaw?.recentJoins?.windowDays || 30);

  const recentJoinsByDay = useMemo(() => {
    const apiBuckets = Array.isArray(statsRaw?.recentJoins?.dailyBuckets)
      ? statsRaw.recentJoins.dailyBuckets
      : null;

    if (apiBuckets && apiBuckets.length) {
      return [...apiBuckets].sort((a: any, b: any) => {
        if (a.day === "unknown") return 1;
        if (b.day === "unknown") return -1;
        return String(b.day).localeCompare(String(a.day));
      });
    }

    const map = new Map<string, RecentJoinRow[]>();
    for (const row of recentJoinsRows) {
      const key = row.createdAt
        ? new Date(row.createdAt).toISOString().slice(0, 10)
        : "unknown";
      const arr = map.get(key) || [];
      arr.push(row);
      map.set(key, arr);
    }

    return Array.from(map.entries())
      .sort((a, b) => {
        if (a[0] === "unknown") return 1;
        if (b[0] === "unknown") return -1;
        return b[0].localeCompare(a[0]);
      })
      .map(([day, rows]) => ({
        day,
        total: rows.length,
        byAccountType: rows.reduce((acc: Record<string, number>, row) => {
          acc[row.accountType] = (acc[row.accountType] || 0) + 1;
          return acc;
        }, {}),
        rows,
      }));
  }, [recentJoinsRows, statsRaw]);

  const router = useRouter();

  const [expandedJoinDays, setExpandedJoinDays] = useState<
    Record<string, boolean>
  >({});
  const [joinRowsVisibleByDay, setJoinRowsVisibleByDay] = useState<
    Record<string, number>
  >({});
  const [joinAccountTypeFilter, setJoinAccountTypeFilter] = useState<string>(
    initialRecentJoinAccountType || "all",
  );
  const [hideTestJoinAccounts, setHideTestJoinAccounts] = useState<boolean>(
    initialRecentJoinHideTests,
  );

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const nextExpanded: Record<string, boolean> = {};
    const nextVisible: Record<string, number> = {};
    const hasTodayBucket = recentJoinsByDay.some(
      (b: any) => String(b.day || "") === todayKey,
    );

    recentJoinsByDay.forEach((bucket: any, idx: number) => {
      const k = String(bucket.day || "unknown");
      nextExpanded[k] = hasTodayBucket ? k === todayKey : idx === 0;
      nextVisible[k] = 50;
    });

    setExpandedJoinDays(nextExpanded);
    setJoinRowsVisibleByDay(nextVisible);
  }, [recentJoinsByDay]);

  const joinAccountTypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const bucket of recentJoinsByDay) {
      for (const row of bucket.rows || []) {
        if (row.accountType) set.add(row.accountType);
      }
    }
    return Array.from(set).sort();
  }, [recentJoinsByDay]);

  useEffect(() => {
    if (!router.isReady) return;

    const nextQuery: Record<string, string> = {};
    Object.entries(router.query || {}).forEach(([k, v]) => {
      if (k === "joinType" || k === "hideTests") return;
      if (typeof v === "string") nextQuery[k] = v;
    });

    if (joinAccountTypeFilter !== "all") {
      nextQuery.joinType = joinAccountTypeFilter;
    }

    nextQuery.hideTests = hideTestJoinAccounts ? "1" : "0";

    const currentJoinType =
      typeof router.query.joinType === "string" ? router.query.joinType : "";
    const currentHideTests =
      typeof router.query.hideTests === "string" ? router.query.hideTests : "";

    if (
      currentJoinType === (nextQuery.joinType || "") &&
      currentHideTests === nextQuery.hideTests
    ) {
      return;
    }

    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true },
    );
  }, [hideTestJoinAccounts, joinAccountTypeFilter, router]);

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

    if (filters.status && filters.status !== "all") {
      out = out.filter(
        (item) => String(item.status || "pending") === filters.status,
      );
    }

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
  }, [consulting, filters.range, filters.search, filters.sort, filters.status]);

  const isObviousQaRecord = (item: ConsultingInterest) => {
    const hay =
      `${item.name || ""} ${item.email || ""} ${item.message || ""} ${item.company || ""}`.toLowerCase();
    const qaTerms = [
      "smoke qa",
      "critical path qa",
      "consult proof",
      "ops flow",
      "launch scope qa",
      "flow check",
      "queue test",
      "qa candidate",
      "qa",
      "test",
      "example.com",
    ];
    return qaTerms.some((t) => hay.includes(t));
  };

  const visibleConsultingRows = useMemo(() => {
    if (!hideQaTestLikeConsulting) return filteredConsulting;
    return filteredConsulting.filter((item) => !isObviousQaRecord(item));
  }, [filteredConsulting, hideQaTestLikeConsulting]);

  async function updateConsultingItem(
    item: ConsultingInterest,
    status:
      | "approved"
      | "rejected"
      | "flagged"
      | "spam"
      | "pending"
      | "deleted",
  ) {
    if (!item._id || !item.collection) {
      setConsultingErr("Missing consulting row id/collection.");
      return;
    }
    setConsultingSavingId(item._id);
    setConsultingErr("");
    try {
      const res = await fetch("/api/admin/consulting-interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: item._id,
          collection: item.collection,
          status,
          stage:
            status === "approved"
              ? "approved"
              : status === "rejected" ||
                  status === "spam" ||
                  status === "deleted"
                ? "closed_lost"
                : "triaged",
          nextAction: "",
          adminNote: consultingNotes[item._id] ?? item.adminNote ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || "Failed to update waitlist record");
      await fetchConsulting();
    } catch (err: any) {
      setConsultingErr(err?.message || "Failed to update waitlist record.");
    } finally {
      setConsultingSavingId("");
    }
  }

  async function deleteConsultingItem(item: ConsultingInterest) {
    if (!item._id || !item.collection) {
      setConsultingErr("Missing consulting row id/collection.");
      return;
    }
    if (!confirm("Delete/remove this consulting waitlist submission?")) return;
    setConsultingSavingId(item._id);
    setConsultingErr("");
    try {
      const res = await fetch("/api/admin/consulting-interests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: item._id,
          collection: item.collection,
          reason:
            consultingNotes[item._id] || "Removed from consulting waitlist",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete waitlist record");
      await fetchConsulting();
    } catch (err: any) {
      setConsultingErr(err?.message || "Failed to delete waitlist record.");
    } finally {
      setConsultingSavingId("");
    }
  }

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
              href="/admin/directory-duplicates"
              className="rounded border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/20"
            >
              Duplicates Queue
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
              <StatCard
                title="Businesses (Total)"
                value={stats.totalBusinesses}
              />
              <StatCard
                title="Organizations (Total)"
                value={stats.totalOrganizations}
              />

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
                <Link href="/admin/organizations" className="block">
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

              {/* Businesses summary */}
              <div className="bg-gray-800 rounded p-4 border border-gray-700 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg text-gold">Businesses Snapshot</h3>
                  <div className="text-xs text-gray-400">
                    Total:{" "}
                    <span className="text-gray-200 font-semibold">
                      {stats.totalBusinesses}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <MiniStat label="Approved" value={stats.approvedBusinesses} />
                  <MiniStat label="Rejected" value={stats.rejectedBusinesses} />
                  <MiniStat
                    label="Pending"
                    value={stats.pendingBusinesses}
                    tone={stats.pendingBusinesses > 0 ? "warn" : "ok"}
                  />
                </div>

                <div className="mt-3">
                  <Link
                    href="/admin/business-approvals"
                    className="inline-flex items-center rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs hover:bg-gray-700"
                  >
                    Manage Business Approvals →
                  </Link>
                </div>
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
                    href="/admin/organizations"
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

      {/* New Signups / Recent Joins */}
      <SectionTitle>New Signups / Recent Joins</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard title="Joined Today" value={recentJoinsSummary.today} />
        <StatCard
          title="Joined Last 7 Days"
          value={recentJoinsSummary.last7Days}
        />
        <StatCard
          title="Joined Last 30 Days"
          value={recentJoinsSummary.last30Days}
        />
      </div>

      <div className="bg-gray-800 rounded p-4 border border-gray-700 mb-4">
        <h3 className="text-lg text-gold mb-2">By Account Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          {Object.entries(recentJoinsSummary.byAccountType || {}).map(
            ([type, counts]: any) => (
              <div
                key={type}
                className="rounded border border-gray-700 bg-gray-900 px-3 py-2"
              >
                <div className="font-semibold text-gray-100 capitalize">
                  {type}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Today: {counts?.today ?? 0}
                </div>
                <div className="text-xs text-gray-400">
                  7d: {counts?.last7Days ?? 0}
                </div>
                <div className="text-xs text-gray-400">
                  30d: {counts?.last30Days ?? 0}
                </div>
              </div>
            ),
          )}
          {Object.keys(recentJoinsSummary.byAccountType || {}).length === 0 ? (
            <div className="text-sm text-gray-400">No join data yet.</div>
          ) : null}
        </div>
      </div>

      <div className="bg-gray-800 rounded p-4 border border-gray-700 mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <h3 className="text-lg text-gold">
            Recent Join Activity ({recentJoinWindowDays}-day window)
          </h3>
          <div className="text-xs text-gray-400">
            Grouped by day • Today expanded by default
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <label className="text-gray-300">Account type:</label>
          <select
            className="rounded border border-gray-700 bg-gray-900 px-2 py-1"
            value={joinAccountTypeFilter}
            onChange={(e) => setJoinAccountTypeFilter(e.target.value)}
          >
            <option value="all">all</option>
            {joinAccountTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label className="ml-2 inline-flex items-center gap-1 text-gray-300">
            <input
              type="checkbox"
              checked={hideTestJoinAccounts}
              onChange={(e) => setHideTestJoinAccounts(e.target.checked)}
            />
            Hide test accounts
          </label>
        </div>

        {recentJoinsByDay.length === 0 ? (
          <div className="py-3 text-gray-400 text-sm">
            No recent joins found in the last {recentJoinWindowDays} days.
          </div>
        ) : (
          <div className="space-y-3">
            {recentJoinsByDay.map(
              ({ day, rows, total, byAccountType }: any) => {
                const filteredRows = (rows as RecentJoinRow[]).filter((row) => {
                  if (hideTestJoinAccounts && row.isTest) return false;
                  if (
                    joinAccountTypeFilter !== "all" &&
                    row.accountType !== joinAccountTypeFilter
                  ) {
                    return false;
                  }
                  return true;
                });

                if (filteredRows.length === 0) return null;

                const expanded = Boolean(expandedJoinDays[day]);
                const visibleLimit = joinRowsVisibleByDay[day] || 50;
                const visibleRows = expanded
                  ? filteredRows.slice(0, visibleLimit)
                  : [];
                const hiddenCount = Math.max(
                  0,
                  filteredRows.length - visibleRows.length,
                );

                return (
                  <div
                    key={day}
                    className="rounded border border-gray-700 bg-gray-900"
                  >
                    <button
                      className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-800"
                      onClick={() =>
                        setExpandedJoinDays((prev) => ({
                          ...prev,
                          [day]: !expanded,
                        }))
                      }
                    >
                      <div>
                        <span className="font-semibold text-gray-100">
                          {day === "unknown"
                            ? "Unknown date"
                            : new Date(`${day}T00:00:00Z`).toLocaleDateString()}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {filteredRows.length} shown / {total ?? rows.length}{" "}
                          total
                        </span>
                        <span className="ml-2 text-[11px] text-gray-500">
                          {Object.entries(byAccountType || {})
                            .map(([k, v]) => `${k}:${v}`)
                            .join(" • ")}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {expanded ? "Hide" : "Show"}
                      </span>
                    </button>

                    {expanded ? (
                      <div className="overflow-x-auto border-t border-gray-700">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-700 text-gold">
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Email</th>
                              <th className="py-2 px-3">Account Type</th>
                              <th className="py-2 px-3">Source</th>
                              <th className="py-2 px-3">Created</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Signals</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleRows.map((row) => (
                              <tr
                                key={`${row.sourceCollection}-${row._id}`}
                                className="border-b border-gray-700/50"
                              >
                                <td className="py-2 px-3">{row.name || "—"}</td>
                                <td className="py-2 px-3">
                                  {row.email || "—"}
                                </td>
                                <td className="py-2 px-3 capitalize">
                                  {row.accountType}
                                </td>
                                <td className="py-2 px-3 text-gray-400">
                                  {row.sourceCollection}
                                </td>
                                <td className="py-2 px-3">
                                  {row.createdAt
                                    ? new Date(row.createdAt).toLocaleString()
                                    : "—"}
                                </td>
                                <td className="py-2 px-3">
                                  {row.status ||
                                    (row.isActive ? "active" : "inactive")}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex flex-wrap gap-1 text-[11px]">
                                    {row.isVerified ? (
                                      <span className="rounded bg-emerald-600/30 border border-emerald-400/50 px-2 py-0.5">
                                        verified
                                      </span>
                                    ) : (
                                      <span className="rounded bg-gray-700 px-2 py-0.5">
                                        unverified
                                      </span>
                                    )}
                                    {row.isAdmin ? (
                                      <span className="rounded bg-purple-600/30 border border-purple-400/50 px-2 py-0.5">
                                        admin
                                      </span>
                                    ) : null}
                                    {row.isTest ? (
                                      <span className="rounded bg-yellow-600/30 border border-yellow-400/50 px-2 py-0.5">
                                        test
                                      </span>
                                    ) : null}
                                    {!row.isActive ? (
                                      <span className="rounded bg-red-600/30 border border-red-400/50 px-2 py-0.5">
                                        inactive
                                      </span>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {hiddenCount > 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
                            <span>{hiddenCount} more hidden for this day.</span>
                            <button
                              className="rounded border border-gray-700 bg-gray-800 px-2 py-1 hover:bg-gray-700"
                              onClick={() =>
                                setJoinRowsVisibleByDay((prev) => ({
                                  ...prev,
                                  [day]: (prev[day] || 50) + 50,
                                }))
                              }
                            >
                              Show more
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              },
            )}
          </div>
        )}
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
            <Link href="/admin/directory-approvals" className="block">
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
        <AdminLink
          href="/admin/organizations"
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
        <AdminLink
          href="/admin/affiliate-attribution"
          label="Review Affiliate Attribution"
        />
        <AdminLink
          href="/admin/consulting-leads"
          label="Review Consulting Leads"
        />
        <AdminLink
          href="/admin/advertising-requests"
          label="Review Advertising Requests"
        />
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
          href="/admin/phase1-scoreboard"
          label="Phase 1 Operating Scoreboard"
        />
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
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
          <button
            className={`rounded border px-3 py-1 ${
              hideQaTestLikeConsulting
                ? "border-yellow-400 bg-yellow-500/20 text-yellow-200"
                : "border-gray-700 bg-gray-900"
            }`}
            onClick={() => setHideQaTestLikeConsulting((v) => !v)}
          >
            {hideQaTestLikeConsulting
              ? "Showing only likely real/manual"
              : "Hide QA/test-like"}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded p-4 mt-4 mb-20 border border-gray-700">
        {consultingLoading ? (
          <p>Loading waitlist...</p>
        ) : consultingErr ? (
          <div className="p-2 bg-red-600 rounded text-center text-sm">
            {consultingErr}
          </div>
        ) : visibleConsultingRows.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No one has signed up for notifications yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left mt-2 text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-gold font-semibold py-2 px-3">Name</th>
                  <th className="text-gold font-semibold py-2 px-3">Email</th>
                  <th className="text-gold font-semibold py-2 px-3">Company</th>
                  <th className="text-gold font-semibold py-2 px-3">Message</th>
                  <th className="text-gold font-semibold py-2 px-3">Meta</th>
                  <th className="text-gold font-semibold py-2 px-3">Status</th>
                  <th className="text-gold font-semibold py-2 px-3">Actions</th>
                  <th className="text-gold font-semibold py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {visibleConsultingRows.map((item) => {
                  const qa = isObviousQaRecord(item);
                  const noteVal =
                    consultingNotes[item._id] ?? item.adminNote ?? "";
                  return (
                    <tr
                      key={item._id}
                      className={`border-b border-gray-700 ${qa ? "bg-yellow-500/10" : ""}`}
                    >
                      <td className="py-2 px-3">
                        <div>{item.name}</div>
                        {qa ? (
                          <div className="text-[11px] text-yellow-300">
                            QA/test-like submission
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2 px-3">{item.email}</td>
                      <td className="py-2 px-3">
                        {item.company || item.businessName || "--"}
                      </td>
                      <td
                        className="py-2 px-3 max-w-[280px] truncate"
                        title={item.message || ""}
                      >
                        {item.message || "--"}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-300">
                        <div>collection: {item.collection || "--"}</div>
                        <div>source: {item.source || "--"}</div>
                        <div>IP: {item.ip || "--"}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="capitalize">
                          {item.status || "pending"}
                        </div>
                        <textarea
                          className="mt-1 w-full rounded border border-gray-700 bg-gray-900 p-1 text-[11px]"
                          rows={2}
                          placeholder="Admin note"
                          value={noteVal}
                          onChange={(e) =>
                            setConsultingNotes((prev) => ({
                              ...prev,
                              [item._id]: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          <button
                            className="rounded bg-emerald-600/80 px-2 py-1 font-semibold"
                            disabled={consultingSavingId === item._id}
                            onClick={() =>
                              updateConsultingItem(item, "approved")
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="rounded bg-orange-600/80 px-2 py-1 font-semibold"
                            disabled={consultingSavingId === item._id}
                            onClick={() =>
                              updateConsultingItem(item, "rejected")
                            }
                          >
                            Reject
                          </button>
                          <button
                            className="rounded bg-rose-700/80 px-2 py-1 font-semibold"
                            disabled={consultingSavingId === item._id}
                            onClick={() => updateConsultingItem(item, "spam")}
                          >
                            Spam/Flag
                          </button>
                          <button
                            className="rounded bg-red-700/80 px-2 py-1 font-semibold"
                            disabled={consultingSavingId === item._id}
                            onClick={() => deleteConsultingItem(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/admin/dashboard",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      isAdmin?: boolean;
    };
    if (!(payload.isAdmin === true || payload.accountType === "admin")) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/dashboard",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/dashboard",
        permanent: false,
      },
    };
  }

  const initialRecentJoinAccountType =
    typeof query.joinType === "string" && query.joinType.trim()
      ? query.joinType.trim().toLowerCase()
      : "all";
  const initialRecentJoinHideTests =
    String(query.hideTests ?? "1").toLowerCase() !== "0";

  return {
    props: {
      initialRecentJoinAccountType,
      initialRecentJoinHideTests,
    },
  };
};
