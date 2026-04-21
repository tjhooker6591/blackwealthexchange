// pages/job/[id]/index.tsx
"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";

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
  appliedCount?: number;
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

function freshness(iso?: string) {
  if (!iso) return "Recently posted";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently posted";
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return "Fresh listing";
  if (days <= 7) return "Posted this week";
  return "Earlier listing";
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

  const trackJobEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/job/[id]",
      section: "job_detail",
      jobId: jobId || null,
      entityId: jobId || null,
      entityType: "job",
      destination: jobId ? `/job/${jobId}/apply` : "/job/[id]/apply",
      ...extras,
    });
  };

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
        if (!cancelled) {
          setJob(j || null);
          trackJobEvent("job_detail_viewed", {
            ctaId: "job_detail_view",
            ctaLabel: "Job Detail Viewed",
          });
        }
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

  const responsibilities = (job.description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
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
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gold">
                {job.title}
              </h1>
              <p className="text-gray-200 mt-2 text-lg">
                <span className="font-semibold">{job.company}</span>
              </p>
              <p className="text-gray-300 mt-1">
                {job.location} • <em>{job.type}</em>
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded border border-blue-400/30 bg-blue-500/10 text-blue-200">
                  {freshness(job.createdAt)}
                </span>
                {job.createdAt ? (
                  <span className="px-2 py-1 rounded border border-gray-600 text-gray-300">
                    Posted {formatDate(job.createdAt)}
                  </span>
                ) : null}
                {typeof job.appliedCount === "number" ? (
                  <span className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                    {job.appliedCount} applicant{job.appliedCount === 1 ? "" : "s"}
                  </span>
                ) : null}
                {job.isFeatured ? (
                  <span className="px-2 py-1 rounded bg-yellow-500/15 border border-yellow-500/25 text-yellow-300">
                    Featured Role
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[220px]">
              <Link
                href={`/job/${job._id}/apply`}
                onClick={() =>
                  trackJobEvent("job_apply_started", {
                    ctaId: "job_detail_apply_primary",
                    ctaLabel: "Apply Now",
                  })
                }
              >
                <button className="w-full px-5 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                  Apply for This Role
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

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-white">Role Overview</h2>
              <p className="mt-2 whitespace-pre-line text-gray-200 leading-relaxed">
                {job.description}
              </p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-black/20 p-4">
              <h3 className="text-sm font-semibold text-yellow-300 uppercase tracking-wide">
                Job Snapshot
              </h3>
              <div className="mt-3 space-y-2 text-sm text-gray-300">
                <p><span className="text-gray-400">Role:</span> {job.title}</p>
                <p><span className="text-gray-400">Company:</span> {job.company}</p>
                <p><span className="text-gray-400">Location:</span> {job.location}</p>
                <p><span className="text-gray-400">Type:</span> {job.type}</p>
                <p>
                  <span className="text-gray-400">Compensation:</span>{" "}
                  {job.salary || "Salary not listed"}
                </p>
              </div>
            </div>
          </div>

          {responsibilities.length > 1 ? (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-white">Responsibilities</h2>
              <ul className="mt-2 list-disc pl-6 text-gray-200 space-y-1">
                {responsibilities.map((line, idx) => (
                  <li key={`${idx}-${line.slice(0, 12)}`}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/job/${job._id}/apply`}
              onClick={() =>
                trackJobEvent("job_apply_started", {
                  ctaId: "job_detail_apply_bottom",
                  ctaLabel: "Apply for This Role",
                })
              }
            >
              <button className="px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                Apply for This Role
              </button>
            </Link>

            <Link href="/job-listings">
              <button className="px-6 py-3 border border-gray-600 rounded hover:bg-gray-800 transition">
                View More Jobs
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
