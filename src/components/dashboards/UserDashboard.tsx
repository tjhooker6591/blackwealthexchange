// src/components/dashboards/UserDashboard.tsx
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

type UserType = {
  email: string;
  userId: string;
  accountType: string;
};

type DashboardData = {
  fullName?: string;
  applications?: number;
  savedJobs?: number;
  messages?: number;
};

type ChartData = {
  month: string;
  applications: number;
}[];

export default function UserDashboard() {
  const [user, setUser] = useState<UserType | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [chartData, setChartData] = useState<ChartData>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  /* ─ fetch dashboard + chart data ─ */
  useEffect(() => {
    (async () => {
      try {
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        const userData = await userRes.json();

        if (userData?.user?.accountType !== "user") {
          setAccessDenied(true);
          return;
        }
        setUser(userData.user);

        const [dashboardRes, chartRes] = await Promise.all([
          fetch(`/api/user/get-dashboard?email=${userData.user.email}`, {
            cache: "no-store",
          }),
          fetch(
            `/api/user/applications-overview?email=${userData.user.email}`,
            {
              cache: "no-store",
            },
          ),
        ]);

        setDashboardData(await dashboardRes.json());
        setChartData(await chartRes.json());
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ─ loading & guard screens ─ */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        Loading dashboard…
      </div>
    );
  }
  if (accessDenied || !dashboardData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-red-400">
        Access Denied. You do not have permission to view this dashboard.
      </div>
    );
  }

  /* ───────────────────────── UI (no extra sidebar) ───────────────────────── */
  return (
    <section className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-neutral-900 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-yellow-400 mb-2">
          Welcome, {dashboardData.fullName || user?.email}!
        </h2>
        <p className="text-gray-300">
          Take the next step in your career.{" "}
          <strong>Manage your saved jobs</strong>, track applications, and
          access career tools to help you grow.
        </p>
      </div>

      {/* Saved Jobs & Applications panels */}
      <div className="grid gap-6 sm:grid-cols-2">
        <InfoCard
          title="Saved Jobs"
          count={dashboardData.savedJobs}
          href="/saved-jobs"
        />
        <InfoCard
          title="Applications"
          count={dashboardData.applications}
          href="/applications"
        />
      </div>

      {/* Chart */}
      <div className="bg-neutral-900 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">
          Applications Overview
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Bar dataKey="applications" fill="#FFD700" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Links */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink title="Find a Job" href="/job-listings" />
        <QuickLink title="Saved Jobs" href="/saved-jobs" />
        <QuickLink title="Application Tracker" href="/applications" />
        <QuickLink title="Resume & Profile" href="/profile" />
        <QuickLink title="Mentorship" href="/mentorship" />
        <QuickLink title="Premium Tools" href="/pricing" />
      </div>
    </section>
  );
}

/* ─ helpers ─ */
function InfoCard({
  title,
  count = 0,
  href,
}: {
  title: string;
  count?: number;
  href: string;
}) {
  return (
    <div className="bg-neutral-900 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Link href={href} className="text-yellow-400 hover:underline">
          View all ({count})
        </Link>
      </div>
      <p className="text-gray-400">{count} total</p>
    </div>
  );
}

function QuickLink({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="block bg-neutral-900 p-6 rounded-lg hover:shadow-lg transition"
    >
      <h4 className="text-lg font-bold text-yellow-400 mb-2">{title}</h4>
    </Link>
  );
}