"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DashboardData = {
  businessName?: string;
  jobCount?: number;
  applicants?: number;
  messages?: number;
};

export default function EmployerDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<{ email: string; accountType: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();

        if (!userData.user) {
          router.push("/login");
          return;
        }

        setUser(userData.user);

        const res = await axios.get("/api/dashboard/employer", {
          params: { email: userData.user.email },
        });

        setDashboardData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]); // ✅ Included `router` to fix ESLint warning

  if (loading || !user || !dashboardData) {
    return <div className="text-white text-center py-20">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Dashboard Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold mb-2">
            Welcome, {dashboardData.businessName || "Employer"}
          </h1>
          <p className="text-gray-300 text-lg">
            Manage your job listings, view applicants, and connect with top Black talent.
          </p>
        </header>

        {/* Stats Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard label="Total Jobs" value={dashboardData.jobCount || 0} />
          <StatCard label="Applicants" value={dashboardData.applicants || 0} />
          <StatCard label="Messages" value={dashboardData.messages || 0} />
        </section>

        {/* Analytics Chart */}
        <section className="bg-gray-700 p-4 rounded-lg mb-12">
          <h2 className="text-xl font-semibold text-gold mb-4">Job Postings Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getSampleJobChartData()}>
              <XAxis dataKey="month" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Bar dataKey="jobs" fill="#FFD700" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Quick Access Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Post a Job"
            description="Create a new job listing to attract qualified candidates."
            href="/post-job"
            color="bg-gold"
          />
          <DashboardCard
            title="View Listings"
            description="Manage and edit all the jobs you’ve posted on the platform."
            href="/employer/jobs"
            color="bg-blue-600"
          />
          <DashboardCard
            title="Applicants"
            description="View and organize applicants for each of your job listings."
            href="/employer/applicants"
            color="bg-green-600"
          />
          <DashboardCard
            title="Manage Company Profile"
            description="Update your business details, logo, and contact info."
            href="/business/profile"
            color="bg-purple-600"
          />
          <DashboardCard
            title="Promote a Job"
            description="Feature your job on the homepage or newsletter for more visibility."
            href="/advertise-with-us"
            color="bg-red-600"
          />
          <DashboardCard
            title="Upgrade to Premium"
            description="Access hiring tools, analytics, and boosted visibility."
            href="/pricing"
            color="bg-yellow-500 text-black"
          />
        </section>

        {/* Resources Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gold mb-4">Hiring Resources</h2>
          <p className="text-gray-300 mb-6">
            Improve your recruitment process with tips, templates, and hiring guides.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <ResourceCard
              title="Diversity Hiring Tips"
              href="/resources/diversity-hiring"
              description="Learn how to build a more inclusive hiring pipeline."
            />
            <ResourceCard
              title="Job Description Templates"
              href="/resources/job-templates"
              description="Use proven templates to craft clear, attractive job listings."
            />
            <ResourceCard
              title="Interview Best Practices"
              href="/resources/interviewing"
              description="Conduct equitable and insightful interviews."
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Need help or custom hiring support?{" "}
            <Link href="/contact" className="text-blue-400 underline hover:text-blue-300">
              Contact our support team
            </Link>.
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
      <div className={`p-6 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer ${color}`}>
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

function getSampleJobChartData() {
  return [
    { month: "Jan", jobs: 2 },
    { month: "Feb", jobs: 4 },
    { month: "Mar", jobs: 3 },
    { month: "Apr", jobs: 6 },
    { month: "May", jobs: 5 },
    { month: "Jun", jobs: 4 },
  ];
}
