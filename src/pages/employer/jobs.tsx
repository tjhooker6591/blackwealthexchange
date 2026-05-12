// src/pages/employer/jobs.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  datePosted: string;
  applicants: number;
  isFeatured?: boolean;
  viewCount?: number;
  statusCounts?: {
    new: number;
    reviewed: number;
    shortlisted: number;
    contacted: number;
    rejected: number;
  };
}

function freshnessLabel(datePosted: string) {
  const d = new Date(datePosted);
  if (Number.isNaN(d.getTime())) return "Unknown freshness";
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return "Fresh";
  if (days <= 7) return "Active this week";
  return "Older listing";
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Step 1: Get the logged‑in user
        const userRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!userRes.ok) {
          router.push("/login");
          return;
        }
        const userData = await userRes.json();
        if (!userData.user) {
          router.push("/login");
          return;
        }

        const email = userData.user.email;

        // Step 2: Fetch jobs posted by this user
        const res = await fetch(
          `/api/jobs/employer?email=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );
        const data = await res.json();

        if (res.ok) {
          setJobs(data.jobs || []);
        } else {
          console.error("Failed to load jobs:", data.error);
        }
      } catch (err) {
        console.error("Fetch jobs error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((job) => job._id !== id));
      } else {
        console.error("Failed to delete job");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gold">Your Job Listings</h1>
          <Link href="/post-job">
            <button className="bg-gold text-black font-semibold px-4 py-2 rounded hover:bg-yellow-500 transition">
              Post New Job
            </button>
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-400">You haven’t posted any jobs yet.</p>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
              >
                <div className="flex justify-between items-center mb-2 gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gold">{job.title}</h2>
                    {job.isFeatured ? (
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30 text-[11px] text-yellow-200">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-400 block">
                      Posted: {job.datePosted}
                    </span>
                    <span className="text-xs text-blue-300">
                      {freshnessLabel(job.datePosted)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-300">
                  {job.company} • {job.location} • {job.type}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-100 font-semibold">
                    {job.applicants} applicant{job.applicants !== 1 && "s"}
                  </span>
                  <span className="text-gray-300">
                    {job.viewCount || 0} view
                    {(job.viewCount || 0) === 1 ? "" : "s"}
                  </span>
                  {(job.statusCounts?.new || 0) > 0 ? (
                    <span className="px-2 py-0.5 rounded border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 text-xs">
                      {job.statusCounts?.new} new
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded border border-gray-600 text-gray-300">
                    Reviewed: {job.statusCounts?.reviewed || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded border border-gray-600 text-gray-300">
                    Shortlisted: {job.statusCounts?.shortlisted || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded border border-gray-600 text-gray-300">
                    Contacted: {job.statusCounts?.contacted || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded border border-gray-600 text-gray-300">
                    Rejected: {job.statusCounts?.rejected || 0}
                  </span>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link href={`/employer/applicants?jobId=${job._id}`}>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                      Manage Applicants
                    </button>
                  </Link>
                  <Link href={`/employer/edit-job/${job._id}`}>
                    <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
                      Manage Listing
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/employer/jobs",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
    };
    if (payload.accountType !== "employer") {
      return {
        redirect: {
          destination: "/login?redirect=/employer/jobs",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/employer/jobs",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
