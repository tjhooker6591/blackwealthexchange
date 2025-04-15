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
  const [authorized, setAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const fetchUserAndDashboard = async () => {
      try {
        const userRes = await fetch("/api/auth/me", { cache: "no-store" });
        const userData = await userRes.json();

        // Mark access denied if not a normal user
        if (userData?.user?.accountType !== "user") {
          setAccessDenied(true);
          return;
        }

        setUser(userData.user);
        setAuthorized(true);

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

  if (loading || !user || !dashboardData) {
    return (
      <div className="text-white text-center py-20 bg-black min-h-screen">
        Loading dashboard...
      </div>
    );
  }

  if (accessDenied || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Access Denied. You do not have permission to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Dashboard Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold mb-2">
            Welcome, {dashboardData.fullName || user.email}
          </h1>
          <p className="text-gray-300 text-lg">
            Your central hub for discovering opportunities, managing your career,
            and building a successful future.
          </p>
        </header>

        {/* Stats Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            label="Applications"
            value={dashboardData.applications || 0}
          />
          <StatCard
            label="Saved Jobs"
            value={dashboardData.savedJobs || 0}
          />
          <StatCard label="Messages" value={dashboardData.messages || 0} />
        </section>

        {/* Chart Overview */}
        <section className="bg-gray-700 p-4 rounded-lg mb-12">
          <h2 className="text-xl font-semibold text-gold mb-4">
            Applications Overview
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Bar dataKey="applications" fill="#FFD700" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Quick Access Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Find a Job"
            description="Browse current job openings tailored for your skills and interests."
            href="/job-listings"
            color="bg-gold"
          />
          <DashboardCard
            title="Saved Jobs"
            description="View and manage jobs you've saved for future applications."
            href="/saved-jobs"
            color="bg-blue-600"
          />
          <DashboardCard
            title="Application Tracker"
            description="Keep tabs on the jobs you've applied for and their status."
            href="/applications"
            color="bg-green-600"
          />
          <DashboardCard
            title="Resume & Profile"
            description="Create a standout resume and build a career-ready profile."
            href="/profile"
            color="bg-purple-600"
          />
          <DashboardCard
            title="Mentorship"
            description="Connect with experienced professionals who can guide your journey."
            href="/mentorship"
            color="bg-red-600"
          />
          <DashboardCard
            title="Premium Tools"
            description="Get resume reviews, mock interviews, and exclusive listings."
            href="/pricing"
            color="bg-yellow-600 text-black"
          />
        </section>

        {/* Career Resources */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gold mb-4">
            Career Growth Resources
          </h2>
          <p className="text-gray-300 mb-6">
            Tap into educational guides, industry insights, and financial
            wellness content made just for you.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <ResourceCard
              title="Financial Literacy"
              href="/financial-literacy"
              description="Learn how to budget, save, and invest for your future."
            />
            <ResourceCard
              title="Internship Opportunities"
              href="/internships"
              description="Access early career pathways in tech, business, and more."
            />
            <ResourceCard
              title="Freelance Gigs"
              href="/freelance"
              description="Browse flexible work and get paid for your skills."
            />
          </div>
        </section>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Need help or have questions?{" "}
            <Link
              href="/contact"
              className="text-blue-400 underline hover:text-blue-300"
            >
              Contact our support team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-700 rounded-lg p-4 text-center">
      <h4 className="text-xl font-semibold text-gold">{value}</h4>
      <p className="text-sm text-gray-300 mt-1">{label}</p>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`p-6 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer ${color}`}
      >
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm">{description}</p>
      </div>
    </Link>
  );
}

function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-gray-700 p-4 rounded-lg hover:shadow-lg transition">
        <h4 className="text-lg font-semibold text-gold mb-2">{title}</h4>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </Link>
  );
}
