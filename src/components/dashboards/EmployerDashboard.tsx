// src/components/dashboards/EmployerDashboard.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  jobsPosted: number;
  totalApplicants: number;
  messages: number;
}

interface Job {
  _id: string;
  title: string;
  location: string;
  type: string;
  description: string;
  // add any other fields your API returns here
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState<Stats>({
    jobsPosted: 0,
    totalApplicants: 0,
    messages: 0,
  });
  const [jobList, setJobList] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const verifyAndLoadData = async () => {
      try {
        // Verify the session
        const sessionRes = await fetch("/api/auth/me", { cache: "no-store" });
        const sessionData = await sessionRes.json();

        if (sessionData?.user?.accountType !== "employer") {
          setAccessDenied(true);
          return;
        }

        // Load employer stats
        const statsRes = await fetch("/api/employer/stats", { cache: "no-store" });
        const statsData = await statsRes.json();
        setStats({
          jobsPosted: statsData.jobsPosted || 0,
          totalApplicants: statsData.totalApplicants || 0,
          messages: statsData.messages || 0,
        });

        // Load recent job postings for overview
        const jobsRes = await fetch("/api/employer/jobs", { cache: "no-store" });
        const jobsData: { jobs: Job[] } = await jobsRes.json();
        setJobList(jobsData.jobs || []);
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
      {/* Header */}
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Employer Dashboard</h1>
          <nav className="space-x-4">
            <Link href="/dashboard">
              <a className="hover:underline">Dashboard Home</a>
            </Link>
            <Link href="/profile">
              <a className="hover:underline">Profile</a>
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-gray-800 text-white p-4">
          <nav>
            <ul className="space-y-4">
              <li>
                <Link href="/dashboard/employer/overview">
                  <a className="hover:underline">Overview</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/employer/jobs">
                  <a className="hover:underline">Job Postings</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/employer/applicants">
                  <a className="hover:underline">Applicants</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/employer/tools">
                  <a className="hover:underline">Employer Tools</a>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-gray-900 text-white">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard label="Jobs Posted" value={stats.jobsPosted} />
            <StatCard label="Total Applicants" value={stats.totalApplicants} />
            <StatCard label="Messages" value={stats.messages} />
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              title="💬 Employer Tools"
              description="Access resources like resume downloads and interview templates."
              href="/dashboard/employer/tools"
              color="bg-yellow-600 text-black"
            />
          </div>

          {/* Integrated Job Postings Section */}
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
                <Link href="/post-job">
                  <a className="underline">Post a new job</a>
                </Link>
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-center">
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
      <a
        className={`block p-5 rounded-lg shadow hover:shadow-xl transition ${color}`}
      >
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm">{description}</p>
      </a>
    </Link>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold">{job.title}</h3>
      <p className="text-sm text-gray-300">
        {job.location} &bull; {job.type}
      </p>
      <p className="text-sm mt-2">
        {job.description.length > 100
          ? job.description.substring(0, 100) + "..."
          : job.description}
      </p>
      <Link href={`/dashboard/employer/jobs/${job._id}`}>
        <a className="underline mt-2 inline-block">View Details</a>
      </Link>
    </div>
  );
}
