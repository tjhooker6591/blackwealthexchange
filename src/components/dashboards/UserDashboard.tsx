// File: src/components/dashboards/UserDashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Briefcase,
  Bookmark,
  Crown,
  User as UserIcon,
  ArrowRight,
  Lock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function _cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Types
interface UserType {
  email: string;
  accountType: string;
  userId?: string;
  _id?: string;
}

interface DashboardData {
  fullName?: string;
  applications?: number;
  savedJobs?: number;

  // Optional future-friendly fields (won’t break if API doesn’t return them)
  recentApplications?: Array<{ title: string; company?: string; date?: string; href?: string }>;
  recentSavedJobs?: Array<{ title: string; company?: string; date?: string; href?: string }>;
  profileCompletion?: number; // 0-100
}

interface ChartData {
  month: string;
  applications: number;
}

export default function UserDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const userRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!userRes.ok) throw new Error("Not logged in");
        const { user: u } = await userRes.json();

        if (!u || u.accountType !== "user") throw new Error("Wrong role");
        setUser(u);

        const [dashRes, chartRes] = await Promise.all([
          fetch(`/api/user/get-dashboard?email=${encodeURIComponent(u.email)}`, {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          }),
          fetch(
            `/api/user/applications-overview?email=${encodeURIComponent(u.email)}`,
            { cache: "no-store", credentials: "include", signal: controller.signal },
          ),
        ]);

        if (!dashRes.ok || !chartRes.ok) throw new Error("Data fetch failed");

        const dashJson = await dashRes.json();
        const chartJson = await chartRes.json();

        setDashboardData(dashJson || {});
        setChartData(Array.isArray(chartJson) ? chartJson : chartJson?.data || []);
        setLastUpdated(Date.now());
      } catch (err) {
        console.error(err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const displayName = useMemo(() => {
    return dashboardData?.fullName || user?.email || "Member";
  }, [dashboardData?.fullName, user?.email]);

  if (loading) return <DashboardSkeleton />;

  if (accessDenied || !dashboardData) {
    return (
      <div className="min-h-[70vh] bg-black text-white relative">
        <GlowBackground />
        <div className="relative max-w-3xl mx-auto p-6 flex items-center justify-center min-h-[70vh]">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full border border-white/10 bg-black/30 flex items-center justify-center">
              <Lock className="h-5 w-5 text-yellow-300" />
            </div>
            <h2 className="text-2xl font-bold text-gold">Access Denied</h2>
            <p className="text-gray-300 mt-2">
              Please log in with a user account to view your dashboard.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
              >
                Log In
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const savedJobs = dashboardData.savedJobs || 0;
  const applications = dashboardData.applications || 0;
  const completion = typeof dashboardData.profileCompletion === "number" ? dashboardData.profileCompletion : null;

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />

      <div className="relative max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gold tracking-tight">
              Welcome, {displayName}!
            </h1>
            <p className="text-gray-300 mt-1">
              Track your applications, manage saved jobs, and keep your profile ready.
            </p>
            {lastUpdated ? (
              <p className="text-xs text-gray-500 mt-2">
                Last updated:{" "}
                {new Date(lastUpdated).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
          </div>

          {/* Quick actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/job-listings"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
            >
              <Briefcase className="h-4 w-4" />
              Find Jobs
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <UserIcon className="h-4 w-4 text-yellow-300" />
              Update Profile
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/15 transition"
            >
              <Crown className="h-4 w-4 text-yellow-300" />
              Premium Tools
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            icon={<Bookmark className="h-5 w-5 text-yellow-300" />}
            title="Saved Jobs"
            value={savedJobs}
            href="/saved-jobs"
            hint="Keep a shortlist and apply faster."
          />
          <StatCard
            icon={<Briefcase className="h-5 w-5 text-yellow-300" />}
            title="Applications"
            value={applications}
            href="/applications"
            hint="Track status and follow-ups."
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Profile Readiness</div>
              <Link href="/profile" className="text-sm text-gold hover:underline">
                Improve
              </Link>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold text-white">
                {completion === null ? "—" : `${completion}%`}
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {completion === null
                  ? "Add resume + skills to get stronger matches."
                  : completion >= 80
                    ? "Strong profile. You’re ready to apply."
                    : "Complete your profile to increase responses."}
              </p>

              <div className="mt-4 h-2 w-full rounded-full bg-black/40 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${completion === null ? 40 : Math.max(0, Math.min(100, completion))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-gold">Applications Overview</h3>
              <p className="text-sm text-gray-400">A quick view of your application activity.</p>
            </div>
          </div>

          {chartData.length ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" stroke="#ffffff" />
                  <YAxis stroke="#ffffff" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
                    labelStyle={{ color: "#fff", fontSize: 12 }}
                    itemStyle={{ color: "#FFD700" }}
                    formatter={(v: number) => [`${v}`, "Applications"]}
                  />
                  <Bar
                    dataKey="applications"
                    fill="#FFD700"
                    radius={[10, 10, 0, 0]}
                    label={{ position: "top", fill: "#fff", fontSize: 12 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/30 p-6 text-center">
              <p className="text-gray-300 font-semibold">No application data yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Save jobs and submit applications—your activity will show here automatically.
              </p>
              <div className="mt-4">
                <Link
                  href="/job-listings"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
                >
                  Browse Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent activity (professional “complete” feel) */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ListCard
            title="Recent Applications"
            emptyText="No applications yet."
            viewAllHref="/applications"
            items={dashboardData.recentApplications || []}
          />
          <ListCard
            title="Saved Jobs Preview"
            emptyText="No saved jobs yet."
            viewAllHref="/saved-jobs"
            items={dashboardData.recentSavedJobs || []}
          />
        </div>
      </div>
    </div>
  );
}

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  href,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  href: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-200">
          <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
            {icon}
          </div>
          <div className="font-semibold">{title}</div>
        </div>
        <Link href={href} className="text-sm text-gold hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-4 text-4xl font-extrabold text-white">{value}</div>
      <p className="mt-2 text-sm text-gray-400">{hint}</p>
    </div>
  );
}

function ListCard({
  title,
  items,
  emptyText,
  viewAllHref,
}: {
  title: string;
  items: Array<{ title: string; company?: string; date?: string; href?: string }>;
  emptyText: string;
  viewAllHref: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-gold">{title}</h3>
          <p className="text-sm text-gray-400">Quick preview of your latest activity.</p>
        </div>
        <Link href={viewAllHref} className="text-sm text-gold hover:underline">
          View all
        </Link>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.slice(0, 5).map((it, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-black/40 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{it.title}</div>
                  <div className="text-sm text-gray-400">
                    {it.company ? it.company : "—"} {it.date ? `• ${it.date}` : ""}
                  </div>
                </div>
                {it.href ? (
                  <Link href={it.href} className="text-sm text-gold hover:underline">
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/30 p-5 text-gray-300">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />
      <div className="relative max-w-6xl mx-auto p-6 space-y-6">
        <div className="h-10 w-2/3 bg-white/10 rounded animate-pulse" />
        <div className="h-5 w-1/2 bg-white/10 rounded animate-pulse" />

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <div className="h-6 w-1/2 bg-white/10 rounded animate-pulse" />
              <div className="mt-4 h-10 w-1/3 bg-white/10 rounded animate-pulse" />
              <div className="mt-3 h-4 w-3/4 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="h-6 w-1/3 bg-white/10 rounded animate-pulse" />
          <div className="mt-4 h-[260px] bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
