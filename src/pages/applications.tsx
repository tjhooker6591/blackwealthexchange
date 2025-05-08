// File: pages/applications.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/applications", {
          credentials: "include",
        });
        if (res.status === 401) {
          // Not authenticated or no applications: show empty state
          setApplications([]);
        } else if (!res.ok) {
          throw new Error("Fetch failed");
        } else {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (err) {
        console.error(err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <p>Loading applications…</p>
      </div>
    );
  }

  if (!applications.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-300 p-4">
        <p className="mb-4">You haven’t applied to any jobs yet.</p>
        <Link href="/job-listings" className="px-4 py-2 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600">
          Find Opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Your Applications</h1>
        <ul className="divide-y divide-neutral-700">
          {applications.map((app) => (
            <li key={app.id} className="py-4 flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">{app.jobTitle}</p>
                <p className="text-sm text-gray-400">{app.company}</p>
                <p className="text-sm text-yellow-400">Status: {app.status}</p>
              </div>
              <Link
                href={`/applications/${app.id}`}
                className="text-yellow-400 hover:underline"
              >
                Details
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}