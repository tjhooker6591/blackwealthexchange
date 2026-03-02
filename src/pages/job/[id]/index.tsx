// pages/job/[id]/index.tsx
"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary?: string;
  createdAt?: string;
  isFeatured?: boolean;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function JobDetail() {
  const router = useRouter();

  const jobId = useMemo(() => {
    const raw = router.query.id;
    return typeof raw === "string" ? raw : "";
  }, [router.query.id]);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // Fetch job
  useEffect(() => {
    if (!router.isReady || !jobId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrMsg("");

        const res = await fetch(`/api/jobs/${jobId}`, {
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.error || data?.message || "Failed to load job.",
          );
        }

        const j = data?.job || data; // supports either {job} or direct
        if (!cancelled) setJob(j || null);
      } catch (e: unknown) {
        if (!cancelled) {
          setJob(null);
          setErrMsg(e instanceof Error ? e.message : "Failed to load job.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, jobId]);

  const saveJob = async () => {
    if (!job?._id) return;
    try {
      const res = await fetch("/api/user/save-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId: job._id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // If your API returns 401 when not logged in, route them to login
        if (res.status === 401) {
          router.push(`/login?redirect=/job/${job._id}`);
          return;
        }
        throw new Error(data?.error || data?.message || "Failed to save job.");
      }

      alert("💾 Job saved!");
    } catch (e: unknown) {
      alert(e instanceof Error ? `❌ ${e.message}` : "❌ Failed to save job.");
    }
  };

  const copyLink = async () => {
    try {
      if (typeof window === "undefined") return;
      await navigator.clipboard.writeText(window.location.href);
      alert("🔗 Link copied!");
    } catch {
      alert("❌ Could not copy link.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (errMsg) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-3xl mx-auto bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gold mb-2">
            Job Not Available
          </h1>
          <p className="text-gray-300 mb-6">{errMsg}</p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition"
            >
              ← Back
            </button>

            <Link href="/job-listings">
              <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                Browse Jobs
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-400">No job found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        {/* Top actions */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link href="/job-listings">
            <button className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-800 transition">
              ← Back to Jobs
            </button>
          </Link>

          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-800 transition"
            >
              Copy Link
            </button>
            <button
              onClick={saveJob}
              className="px-4 py-2 border border-gold text-gold rounded hover:bg-gold hover:text-black transition"
            >
              Save Job
            </button>
          </div>
        </div>

        {/* Job card */}
        <div
          className={`bg-gray-800 rounded-lg shadow-lg p-7 border ${
            job.isFeatured ? "border-yellow-400" : "border-gray-700"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gold">
                {job.title}
              </h1>
              <p className="text-gray-300 mt-2">
                <span className="font-semibold">{job.company}</span> —{" "}
                {job.location} — <em>{job.type}</em>
              </p>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-400">
                {job.salary ? (
                  <span>💰 {job.salary}</span>
                ) : (
                  <span>💰 Salary not listed</span>
                )}
                {job.createdAt ? (
                  <span>🗓 Posted {formatDate(job.createdAt)}</span>
                ) : null}
                {job.isFeatured ? (
                  <span className="px-2 py-1 rounded bg-yellow-500/15 border border-yellow-500/25 text-yellow-300">
                    Featured
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[180px]">
              <Link href={`/job/${job._id}/apply`}>
                <button className="w-full px-5 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                  Apply Now
                </button>
              </Link>

              <button
                onClick={saveJob}
                className="w-full px-5 py-3 border border-gold text-gold rounded hover:bg-gold hover:text-black transition"
              >
                Save Job
              </button>
            </div>
          </div>

          <hr className="my-6 border-gray-700" />

          {/* Description */}
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-line text-gray-200">
              {job.description}
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/job/${job._id}/apply`}>
              <button className="px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                Apply Now
              </button>
            </Link>

            <Link href="/signup">
              <button className="px-6 py-3 border border-gray-600 rounded hover:bg-gray-800 transition">
                Create Account (Optional)
              </button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Safety tip: never share sensitive personal info (SSN, bank details).
            Report suspicious listings to support@blackwealthexchange.com.
          </p>
        </div>
      </div>
    </div>
  );
}
