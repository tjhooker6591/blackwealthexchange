// File: src/components/dashboards/UserDashboard.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Types
interface UserType { email: string; userId: string; accountType: string; }
interface DashboardData { fullName?: string; applications?: number; savedJobs?: number; }
interface ChartData { month: string; applications: number; }

// Main dashboard component
export default function UserDashboard() {
  const [user, setUser] = useState<UserType | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Fetch user
        const userRes = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (!userRes.ok) throw new Error();
        const { user: u } = await userRes.json();
        if (u.accountType !== "user") throw new Error();
        setUser(u);

        // Fetch dashboard data and chart
        const [dashRes, chartRes] = await Promise.all([
          fetch(`/api/user/get-dashboard?email=${encodeURIComponent(u.email)}`, { cache: "no-store", credentials: "include" }),
          fetch(`/api/user/applications-overview?email=${encodeURIComponent(u.email)}`, { cache: "no-store", credentials: "include" }),
        ]);
        if (!dashRes.ok || !chartRes.ok) throw new Error();

        const dashJson = await dashRes.json();
        const chartJson = await chartRes.json();
        setDashboardData(dashJson);
        setChartData(chartJson);
      } catch (err) {
        console.error(err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader />;
  if (accessDenied || !dashboardData) return <AccessDenied />;

  return (
    <section className="space-y-8">
      {/* Welcome */}
      <div className="bg-neutral-900 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-yellow-400 mb-2">
          Welcome, {dashboardData.fullName || user?.email}!
        </h2>
        <p className="text-gray-300">
          Manage your saved jobs and track your applications.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <InfoCard title="Saved Jobs" count={dashboardData.savedJobs || 0} href="/saved-jobs" />
        <InfoCard title="Applications" count={dashboardData.applications || 0} href="/applications" />
      </div>

      {/* Chart */}
      <div className="bg-neutral-900 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">Applications Overview</h3>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#fff', fontSize: 12 }}
                itemStyle={{ color: '#FFD700' }}
                formatter={(v: number) => [`${v}`, 'Applications']}
              />
              <Bar dataKey="applications" fill="#FFD700" label={{ position: 'top', fill: '#fff', fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400">No application data available.</p>
        )}
      </div>

      {/* Quick Links (streamlined) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink title="Find a Job" href="/job-listings" />
        <QuickLink title="Resume & Profile" href="/profile" />
        <QuickLink title="Premium Tools" href="/pricing" />
      </div>
    </section>
  );
}

// Helper components
function Loader() {
  return <div className="min-h-[60vh] flex items-center justify-center text-white">Loading dashboard…</div>;
}
function AccessDenied() {
  return <div className="min-h-[60vh] flex items-center justify-center text-red-400">Access Denied</div>;
}
function InfoCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <div className="bg-neutral-900 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <Link href={href} className="text-yellow-400 hover:underline">View all ({count})</Link>
      </div>
      <p className="text-gray-400">{count} total</p>
    </div>
  );
}
function QuickLink({ title, href }: { title: string; href: string }) {
  return (
    <Link href={href} className="block bg-neutral-900 p-6 rounded-lg hover:shadow-lg transition">
      <h4 className="text-lg font-bold text-yellow-400 mb-2">{title}</h4>
    </Link>
  );
}

