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
  AlertTriangle,
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
  recentApplications?: Array<{
    title: string;
    company?: string;
    date?: string;
    href?: string;
  }>;
  recentSavedJobs?: Array<{
    title: string;
    company?: string;
    date?: string;
    href?: string;
  }>;
  profileCompletion?: number;
}

interface ChartData {
  month: string;
  applications: number;
}

export default function UserDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const [accessDenied, setAccessDenied] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setAccessDenied(false);
        setDataError(null);

        const userRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!userRes.ok) {
          setAccessDenied(true);
          return;
        }

        const { user: u } = await userRes.json();

        if (!u || u.accountType !== "user") {
          setAccessDenied(true);
          return;
        }

        setUser(u);

        setDashboardData({});
        setChartData([]);

        const [dashRes, chartRes] = await Promise.allSettled([
          fetch(
            `/api/user/get-dashboard?email=${encodeURIComponent(u.email)}`,
            {
              cache: "no-store",
              credentials: "include",
              signal: controller.signal,
            },
          ),
          fetch(
            `/api/user/applications-overview?email=${encodeURIComponent(u.email)}`,
            {
              cache: "no-store",
              credentials: "include",
              signal: controller.signal,
            },
          ),
        ]);

        let hadDataIssue = false;

        if (dashRes.status === "fulfilled") {
          if (dashRes.value.ok) {
            const dashJson = await dashRes.value.json();
            setDashboardData(dashJson || {});
          } else {
            hadDataIssue = true;
          }
        } else {
          hadDataIssue = true;
        }

        if (chartRes.status === "fulfilled") {
          if (chartRes.value.ok) {
            const chartJson = await chartRes.value.json();
            setChartData(
              Array.isArray(chartJson) ? chartJson : chartJson?.data || [],
            );
          } else {
            hadDataIssue = true;
          }
        } else {
          hadDataIssue = true;
        }

        if (hadDataIssue) {
          setDataError(
            "Some dashboard data could not be loaded right now. Your account is still active.",
          );
        }

        setLastUpdated(Date.now());
      } catch (err: any) {
        if (err?.name === "AbortError") return;

        console.error(err);
        setAccessDenied((prev) => prev || !user);
        setDataError(
          "We had trouble loading your dashboard. Please refresh and try again.",
        );
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = useMemo(() => {
    return dashboardData?.fullName || user?.email || "Member";
  }, [dashboardData?.fullName, user?.email]);

  if (loading) return <DashboardSkeleton />;

  if (accessDenied) {
    return (
      <div className="relative min-h-[70vh] bg-black text-white">
        <GlowBackground />
        <div className="relative mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-3 py-5 sm:px-4 sm:py-8">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-xl sm:p-6">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 sm:h-12 sm:w-12">
              <Lock className="h-5 w-5 text-yellow-300" />
            </div>
            <h2 className="text-xl font-bold text-gold sm:text-2xl">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Please log in with a user account to view your dashboard.
            </p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-xl bg-gold px-5 py-2.5 font-semibold text-black transition hover:bg-yellow-500 sm:w-auto"
              >
                Log In
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 transition hover:bg-white/10 sm:w-auto"
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
  const completion =
    typeof dashboardData.profileCompletion === "number"
      ? dashboardData.profileCompletion
      : null;

  return (
    <div className="relative min-h-screen bg-black text-white">
      <GlowBackground />

      <div className="relative mx-auto max-w-6xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold leading-tight tracking-tight text-gold sm:text-2xl md:text-4xl">
              Welcome, <span className="break-all">{displayName}</span>!
            </h1>
            <p className="mt-1 text-xs text-gray-300 sm:text-sm md:text-base">
              Track your applications, manage saved jobs, and keep your profile
              ready.
            </p>
            {lastUpdated ? (
              <p className="mt-2 text-xs text-gray-500">
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            <Link
              href="/job-listings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-yellow-500 sm:px-5"
            >
              <Briefcase className="h-4 w-4" />
              Find Jobs
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm transition hover:bg-white/10 sm:px-5"
            >
              <UserIcon className="h-4 w-4 text-yellow-300" />
              Update Profile
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5 text-center text-sm transition hover:bg-yellow-500/15 sm:px-5"
            >
              <Crown className="h-4 w-4 text-yellow-300" />
              Premium Tools
            </Link>
          </div>
        </div>

        {/* Data warning */}
        {dataError ? (
          <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-black/30">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gold sm:text-base">
                  Dashboard data is partially unavailable
                </h3>
                <p className="mt-1 text-sm text-gray-300">{dataError}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
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
          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl lg:col-span-1 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Profile Readiness</div>
              <Link
                href="/profile"
                className="text-sm text-gold hover:underline"
              >
                Improve
              </Link>
            </div>

            <div className="mt-3 sm:mt-4">
              <div className="text-2xl font-extrabold text-white sm:text-3xl">
                {completion === null ? "—" : `${completion}%`}
              </div>
              <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                {completion === null
                  ? "Add resume + skills to get stronger matches."
                  : completion >= 80
                    ? "Strong profile. You’re ready to apply."
                    : "Complete your profile to increase responses."}
              </p>

              <div className="mt-4 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
                <div
                  className="h-full bg-yellow-400"
                  style={{
                    width: `${completion === null ? 40 : Math.max(0, Math.min(100, completion))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gold sm:text-xl">
                Applications Overview
              </h3>
              <p className="text-sm text-gray-400">
                A quick view of your application activity.
              </p>
            </div>
          </div>

          {chartData.length ? (
            <div className="h-[260px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" stroke="#ffffff" />
                  <YAxis stroke="#ffffff" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
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
            <div className="rounded-xl border border-white/10 bg-black/30 p-5 text-center sm:p-6">
              <p className="font-semibold text-gray-300">
                No application data yet
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Save jobs and submit applications—your activity will show here
                automatically.
              </p>
              <div className="mt-4">
                <Link
                  href="/job-listings"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-semibold text-black transition hover:bg-yellow-500"
                >
                  Browse Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-gray-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 sm:h-10 sm:w-10">
            {icon}
          </div>
          <div className="truncate font-semibold">{title}</div>
        </div>
        <Link
          href={href}
          className="shrink-0 text-xs text-gold hover:underline sm:text-sm"
        >
          View all
        </Link>
      </div>

      <div className="mt-3 text-2xl font-extrabold text-white sm:mt-4 sm:text-4xl">
        {value}
      </div>
      <p className="mt-2 text-xs text-gray-400 sm:text-sm">{hint}</p>
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
  items: Array<{
    title: string;
    company?: string;
    date?: string;
    href?: string;
  }>;
  emptyText: string;
  viewAllHref: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gold sm:text-xl">{title}</h3>
          <p className="text-sm text-gray-400">
            Quick preview of your latest activity.
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm text-gold hover:underline"
        >
          View all
        </Link>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.slice(0, 5).map((it, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-black/30 p-3 transition hover:bg-black/40 sm:p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-white">{it.title}</div>
                  <div className="text-sm text-gray-400">
                    {it.company ? it.company : "—"}{" "}
                    {it.date ? `• ${it.date}` : ""}
                  </div>
                </div>
                {it.href ? (
                  <Link
                    href={it.href}
                    className="shrink-0 text-sm text-gold hover:underline"
                  >
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-gray-300 sm:p-5">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <GlowBackground />
      <div className="relative mx-auto max-w-6xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-4 sm:py-8">
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/10 sm:h-10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10 sm:h-5" />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6"
            >
              <div className="h-6 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-8 w-1/3 animate-pulse rounded bg-white/10 sm:h-10" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="h-6 w-1/3 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-[220px] animate-pulse rounded bg-white/10 sm:h-[260px]" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6"
            >
              <div className="h-6 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-24 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
