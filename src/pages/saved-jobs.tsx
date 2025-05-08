// File: pages/saved-jobs.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  company: string;
}

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/saved-jobs", {
          credentials: "include",
        });
        if (res.status === 401) {
          // Not authenticated or no jobs: show empty state
          setJobs([]);
        } else if (!res.ok) {
          throw new Error("Fetch failed");
        } else {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch (err) {
        console.error(err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <p>Loading saved jobs…</p>
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-300 p-4">
        <p className="mb-4">You haven’t saved any jobs yet.</p>
        <Link href="/job-listings" className="px-4 py-2 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600">
          Find a Job
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Your Saved Jobs</h1>
        <ul className="divide-y divide-neutral-700">
          {jobs.map((job) => (
            <li key={job.id} className="py-4 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">{job.title}</p>
                <p className="text-sm text-gray-400">{job.company}</p>
              </div>
              <Link
                href={`/job/${job.id}`}
                className="text-yellow-400 hover:underline"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
