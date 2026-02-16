// pages/job-listings.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary?: string;
  isFeatured?: boolean;
  createdAt?: string;
}

type SortKey = "newest" | "oldest" | "featured";

function formatDate(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function JobListingsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyBusy, setApplyBusy] = useState(false);
  const [saveBusyId, setSaveBusyId] = useState<string | null>(null);

  // UI controls
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");

  // pagination
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);

  // Modal close on ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedJob(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);

    fetch("/api/jobs/list", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Jobs list failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch jobs", err);
        setErrorMsg("Failed to load jobs. Please try again.");
        setLoading(false);
      });
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [q, typeFilter, locationFilter, featuredOnly, sort]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => j.type && set.add(j.type));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [jobs]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => j.location && set.add(j.location));
    // keep it readable if locations explode
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["all", ...arr.slice(0, 60)];
  }, [jobs]);

  const filteredSorted = useMemo(() => {
    const query = q.trim().toLowerCase();

    const arr = jobs.filter((job) => {
      if (featuredOnly && !job.isFeatured) return false;
      if (typeFilter !== "all" && job.type !== typeFilter) return false;
      if (locationFilter !== "all" && job.location !== locationFilter) return false;

      if (!query) return true;

      const hay = `${job.title} ${job.company} ${job.location} ${job.type} ${job.description}`.toLowerCase();
      return hay.includes(query);
    });

    arr.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sort === "featured") {
        const aFeat = a.isFeatured ? 1 : 0;
        const bFeat = b.isFeatured ? 1 : 0;
        if (bFeat !== aFeat) return bFeat - aFeat; // featured first
        return bTime - aTime; // newest next
      }
      if (sort === "newest") return bTime - aTime;
      return aTime - bTime;
    });

    return arr;
  }, [jobs, q, featuredOnly, typeFilter, locationFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filteredSorted.slice(start, start + PAGE_SIZE);
  }, [filteredSorted, pageSafe]);

  const requireLogin = (intent: "apply" | "save") => {
    // Keep it simple and compatible with your current auth flow
    const next = encodeURIComponent("/job-listings");
    router.push(`/login?next=${next}&intent=${intent}`);
  };

  const applyToJob = async (jobId: string) => {
    if (applyBusy) return;
    setApplyBusy(true);
    try {
      const res = await fetch("/api/applicants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });

      if (res.status === 401 || res.status === 403) {
        setSelectedJob(null);
        requireLogin("apply");
        return;
      }
      if (!res.ok) throw new Error(`Apply failed (${res.status})`);

      alert("✅ Application submitted!");
      setSelectedJob(null);
    } catch (err) {
      console.error("Failed to apply", err);
      alert("❌ Failed to apply. Please try again.");
    } finally {
      setApplyBusy(false);
    }
  };

  const saveJob = async (jobId: string) => {
    if (saveBusyId) return;
    setSaveBusyId(jobId);
    try {
      const res = await fetch("/api/user/save-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });

      if (res.status === 401 || res.status === 403) {
        requireLogin("save");
        return;
      }
      if (!res.ok) throw new Error(`Save failed (${res.status})`);

      alert("💾 Job saved!");
    } catch (err) {
      console.error("Failed to save job", err);
      alert("❌ Failed to save job. Please try again.");
    } finally {
      setSaveBusyId(null);
    }
  };

  const overlayRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      {/* subtle gold glow background */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-yellow-500/20" />
        <div className="absolute top-24 right-[-120px] h-[420px] w-[420px] rounded-full blur-3xl bg-yellow-400/10" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Job Listings <span className="text-yellow-400">for Our Community</span>
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Browse opportunities for free. Create an account to save jobs and submit applications.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/">
              <button className="px-4 py-2 rounded border border-gray-700 text-gray-200 hover:bg-gray-900 transition">
                ← Back
              </button>
            </Link>
            <Link href="/post-job">
              <button className="px-4 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition">
                Post a Job
              </button>
            </Link>
          </div>
        </div>

        {/* Tools */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 shadow-lg backdrop-blur">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="text-xs text-gray-400">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Title, company, location, keyword…"
                className="mt-1 w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm outline-none focus:border-yellow-400/60"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-1 w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm outline-none focus:border-yellow-400/60"
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "All" : t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs text-gray-400">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="mt-1 w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm outline-none focus:border-yellow-400/60"
              >
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === "all" ? "All" : loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="mt-1 w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-2 text-sm outline-none focus:border-yellow-400/60"
              >
                <option value="featured">Featured first</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-300 select-none">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="accent-yellow-400"
              />
              Featured only
            </label>

            <div className="text-sm text-gray-400">
              Showing <span className="text-gray-200">{filteredSorted.length}</span> result(s)
            </div>
          </div>
        </div>

        {/* Results */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">Opportunities</h2>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-gray-900/60 border border-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : errorMsg ? (
            <div className="bg-gray-900/70 border border-red-900/40 rounded-xl p-4 text-red-200">
              {errorMsg}
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6 text-gray-300">
              No jobs match your filters right now.
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {paged.map((job) => (
                  <div
                    key={job._id}
                    className={[
                      "p-5 rounded-xl border shadow-lg transition",
                      "bg-gray-900/70 border-gray-800 hover:border-yellow-400/30 hover:shadow-yellow-400/10",
                      job.isFeatured ? "ring-1 ring-yellow-400/40" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-white">
                            {job.title}
                          </h3>
                          {job.isFeatured && (
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-400 text-black">
                              Featured
                            </span>
                          )}
                        </div>

                        <p className="text-gray-300 mt-1">
                          {job.company} <span className="text-gray-500">•</span>{" "}
                          <span className="text-gray-300">{job.location}</span>
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                          Type: {job.type}
                          {job.salary ? ` • 💰 ${job.salary}` : " • Salary not listed"}
                          {job.createdAt ? ` • Posted ${formatDate(job.createdAt)}` : ""}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="px-4 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition"
                        >
                          View
                        </button>

                        <button
                          onClick={() => saveJob(job._id)}
                          disabled={saveBusyId === job._id}
                          className={[
                            "px-4 py-2 rounded border transition",
                            "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black",
                            saveBusyId === job._id ? "opacity-60 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          {saveBusyId === job._id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-300 mt-4 line-clamp-3">{job.description}</p>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-400">
                  Page <span className="text-gray-200">{pageSafe}</span> of{" "}
                  <span className="text-gray-200">{totalPages}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pageSafe <= 1}
                    className="px-4 py-2 rounded border border-gray-800 bg-gray-900/60 hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={pageSafe >= totalPages}
                    className="px-4 py-2 rounded border border-gray-800 bg-gray-900/60 hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* CTA */}
        <section className="mt-10 text-center bg-gray-900/70 border border-gray-800 rounded-xl p-6 shadow-lg backdrop-blur">
          <p className="text-gray-200 mb-2 font-semibold">Want to save jobs and track applications?</p>
          <p className="text-gray-400 mb-5">Create a free account to unlock job saves and one-click applying.</p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/signup">
              <button className="px-6 py-3 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition">
                Create a Free Account
              </button>
            </Link>
            <Link href="/login">
              <button className="px-6 py-3 rounded border border-gray-700 text-gray-200 hover:bg-gray-900 transition">
                Log In
              </button>
            </Link>
          </div>
        </section>
      </div>

      {/* Modal */}
      {selectedJob && (
        <div
          ref={overlayRef}
          onMouseDown={(e) => {
            // click outside modal closes
            if (e.target === overlayRef.current) setSelectedJob(null);
          }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
        >
          <div className="bg-gray-900 text-white rounded-xl border border-gray-800 p-6 max-w-2xl w-full relative shadow-2xl">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                  {selectedJob.title}
                </h2>
                <p className="text-gray-300">
                  {selectedJob.company} — {selectedJob.location} —{" "}
                  <em>{selectedJob.type}</em>
                </p>
                <p className="text-gray-400 mt-1">
                  {selectedJob.salary ? `💰 ${selectedJob.salary}` : "Salary not listed"}
                  {selectedJob.createdAt ? ` • Posted ${formatDate(selectedJob.createdAt)}` : ""}
                </p>
              </div>

              {selectedJob.isFeatured && (
                <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-400 text-black shrink-0">
                  Featured
                </span>
              )}
            </div>

            <div className="mt-5 text-gray-200 leading-relaxed whitespace-pre-line">
              {selectedJob.description}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 transition"
              >
                Close
              </button>
              <button
                onClick={() => applyToJob(selectedJob._id)}
                disabled={applyBusy}
                className={[
                  "px-4 py-2 rounded font-semibold transition",
                  "bg-yellow-400 text-black hover:bg-yellow-300",
                  applyBusy ? "opacity-70 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {applyBusy ? "Applying…" : "Apply Now"}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Note: Browsing is free. Applying and saving may require you to log in.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
