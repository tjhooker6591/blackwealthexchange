// src/components/dashboards/EmployerDashboard.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  jobsPosted: number;
  totalApplicants: number;
  messages: number;
  profileCompletion: number;
}

interface Job {
  _id: string;
  title: string;
  location: string;
  type: string;
  description: string;
}

interface Applicant {
  _id: string;
  name: string;
  jobTitle: string;
  appliedAt: string;
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState<Stats>({
    jobsPosted: 0,
    totalApplicants: 0,
    messages: 0,
    profileCompletion: 0,
  });
  const [jobList, setJobList] = useState<Job[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const verifyAndLoadData = async () => {
      try {
        const sessionRes = await fetch("/api/auth/me", { cache: "no-store" });
        const sessionData = await sessionRes.json();

        if (sessionData?.user?.accountType !== "employer") {
          setAccessDenied(true);
          return;
        }

        const statsRes = await fetch("/api/employer/stats", {
          cache: "no-store",
        });
        const statsData = await statsRes.json();
        setStats({
          jobsPosted: statsData.jobsPosted || 0,
          totalApplicants: statsData.totalApplicants || 0,
          messages: statsData.messages || 0,
          profileCompletion: statsData.profileCompletion || 0,
        });

        const jobsRes = await fetch("/api/employer/jobs?limit=5", {
          cache: "no-store",
        });
        const jobsData: { jobs: Job[] } = await jobsRes.json();
        setJobList(jobsData.jobs || []);

        const appRes = await fetch("/api/employer/applicants?limit=5", {
          cache: "no-store",
        });
        const appData: { applicants: Applicant[] } = await appRes.json();
        setRecentApplicants(appData.applicants || []);
      } catch (err) {
        console.error("Failed to load employer data:", err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };
    verifyAndLoadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Loading Employer Dashboard...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <p>Access Denied. You do not have permission to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Employer Dashboard</h1>
          <nav className="space-x-4">
            <Link href="/dashboard" className="hover:underline">
              Dashboard Home
            </Link>
            <Link href="/profile" className="hover:underline">
              Profile
            </Link>
            <Link
              href="/dashboard/employer/billing"
              className="hover:underline"
            >
              Billing
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-gray-800 text-white p-4">
          <nav>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/dashboard/employer/overview"
                  className="hover:underline"
                >
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/employer/jobs"
                  className="hover:underline"
                >
                  Job Postings
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/employer/applicants"
                  className="hover:underline"
                >
                  Applicants
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/employer/tools"
                  className="hover:underline"
                >
                  Employer Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/employer/analytics"
                  className="hover:underline"
                >
                  Analytics
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-6 bg-gray-900 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard label="Jobs Posted" value={stats.jobsPosted} />
            <StatCard label="Total Applicants" value={stats.totalApplicants} />
            <StatCard label="Messages" value={stats.messages} />
            <StatCard
              label="Profile Completion"
              value={stats.profileCompletion}
              suffix="%"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <DashboardCard
              title="📄 Post a New Job"
              description="Create a job listing and reach top talent."
              href="/post-job"
              color="bg-blue-700"
            />
            <DashboardCard
              title="👥 View Applicants"
              description="Review applications and contact qualified candidates."
              href="/dashboard/employer/applicants"
              color="bg-purple-700"
            />
            <DashboardCard
              title="💬 Messages"
              description="Check and respond to candidate messages."
              href="/dashboard/employer/messages"
              color="bg-green-600"
            />
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recent Applicants</h2>
            {recentApplicants.length > 0 ? (
              <div className="space-y-4">
                {recentApplicants.map((app) => (
                  <div key={app._id} className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-lg font-semibold">{app.name}</h3>
                    <p className="text-sm text-gray-300">
                      Applied for: {app.jobTitle} on{" "}
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                    <Link
                      href={`/dashboard/employer/applicants/${app._id}`}
                      className="underline mt-2 inline-block"
                    >
                      View Application
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                No recent applicants.{" "}
                <Link
                  href="/dashboard/employer/applicants"
                  className="underline"
                >
                  View all
                </Link>
              </p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Recent Job Postings</h2>
            {jobList.length > 0 ? (
              <div className="space-y-4">
                {jobList.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            ) : (
              <p>
                No job postings found.{" "}
                <Link href="/post-job" className="underline">
                  Post a new job
                </Link>
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-center">
      <h4 className="text-2xl font-semibold text-gold">
        {value}
        {suffix}
      </h4>
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
    <Link
      href={href}
      className={`block p-5 rounded-lg shadow hover:shadow-xl transition ${color}`}
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm">{description}</p>
    </Link>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold">{job.title}</h3>
      <p className="text-sm text-gray-300">
        {job.location} • {job.type}
      </p>
      <p className="text-sm mt-2">
        {job.description.length > 100
          ? job.description.substring(0, 100) + "..."
          : job.description}
      </p>
      <Link
        href={`/dashboard/employer/jobs/${job._id}`}
        className="underline mt-2 inline-block"
      >
        View Details
      </Link>
    </div>
  );
}
