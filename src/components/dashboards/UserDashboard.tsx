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
    null
  );
  const [chartData, setChartData] = useState<ChartData>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchUserAndDashboard = async () => {
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
            { cache: "no-store" }
          ),
        ]);

        const dashboardJson = await dashboardRes.json();
        const chartJson = await chartRes.json();
        setDashboardData(dashboardJson);
        setChartData(chartJson);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading dashboard…
      </div>
    );
  }
  if (accessDenied || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Access Denied. You do not have permission to view this dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-6 space-y-8">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <nav className="space-y-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 hover:text-gold"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center space-x-2 hover:text-gold"
          >
            <span>👤</span>
            <span>Profile</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center space-x-2 hover:text-gold"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 space-y-8">
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500"
          >
            Upgrade to Premium
          </Link>
        </div>

        {/* Welcome banner */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gold mb-2">
            Welcome, {dashboardData.fullName || user?.email}!
          </h2>
          <p className="text-gray-300">
            Take the next step in your career.{" "}
            <strong>Manage your saved jobs</strong>, track applications, and
            access career tools to help you grow.
          </p>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Saved Jobs */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Saved Jobs</h3>
              <Link
                href="/saved-jobs"
                className="text-gold hover:underline"
              >
                View all ({dashboardData.savedJobs || 0})
              </Link>
            </div>
            <p className="text-gray-400">
              {dashboardData.savedJobs || 0} job(s) saved
            </p>
          </div>

          {/* Applications */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Applications</h3>
              <Link
                href="/applications"
                className="text-gold hover:underline"
              >
                View all ({dashboardData.applications || 0})
              </Link>
            </div>
            <p className="text-gray-400">
              {dashboardData.applications || 0} application(s) submitted
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gold mb-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickLink title="Find a Job" href="/job-listings" />
          <QuickLink title="Saved Jobs" href="/saved-jobs" />
          <QuickLink title="Application Tracker" href="/applications" />
          <QuickLink title="Resume & Profile" href="/profile" />
          <QuickLink title="Mentorship" href="/mentorship" />
          <QuickLink title="Premium Tools" href="/pricing" />
        </div>
      </main>
    </div>
  );
}

function QuickLink({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="block bg-gray-800 p-6 rounded-lg hover:shadow-lg transition"
    >
      <h4 className="text-lg font-bold text-gold mb-2">{title}</h4>
    </Link>
  );
}
