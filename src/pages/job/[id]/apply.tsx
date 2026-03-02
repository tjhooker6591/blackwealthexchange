// pages/job/[id]/apply.tsx
"use client";

import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

interface Form {
  name: string;
  email: string;
  resume: string; // URL or text for now
  coverLetter?: string;
}

type JobLite = {
  _id: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
};

export default function JobApply() {
  const router = useRouter();
  const isReady = router.isReady;

  const jobId = useMemo(() => {
    const raw = router.query.id;
    return typeof raw === "string" ? raw : "";
  }, [router.query.id]);

  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    resume: "",
    coverLetter: "",
  });

  const [job, setJob] = useState<JobLite | null>(null);
  const [loadingJob, setLoadingJob] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Prefill user info if logged in
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);

        const name = data?.user?.name || data?.user?.fullName || "";
        const email = data?.user?.email || "";

        setForm((f) => ({
          ...f,
          name: f.name || name,
          email: f.email || email,
        }));
      } catch {
        // ignore
      }
    })();
  }, []);

  // OPTIONAL: Fetch job details for context (only if you have an endpoint)
  useEffect(() => {
    if (!isReady || !jobId) return;

    (async () => {
      try {
        setLoadingJob(true);
        // If you don't have this endpoint, delete this block.
        const res = await fetch(`/api/jobs/${jobId}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);

        // Accept either { job } or direct job shape
        const j = data?.job || data;
        if (j?._id) setJob(j);
      } catch {
        // ignore
      } finally {
        setLoadingJob(false);
      }
    })();
  }, [isReady, jobId]);

  const update = (key: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Please enter a valid email address.";
    // resume optional by design
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isReady || !jobId) {
      setErrorMsg("Job ID not found. Please close and try again.");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          resume: form.resume.trim(),
          coverLetter: (form.coverLetter || "").trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to submit application.",
        );
      }

      setSuccessMsg("✅ Application sent successfully!");
      // slight delay so they see success
      setTimeout(() => {
        router.back();
      }, 800);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to submit application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="relative bg-gray-800 text-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Close button */}
        <button
          onClick={() => router.back()}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl"
          aria-label="Close"
        >
          &times;
        </button>

        <h1 className="text-2xl font-bold text-gold mb-2">
          Apply for this Job
        </h1>

        {/* Job context (optional) */}
        <div className="mb-4">
          {loadingJob ? (
            <p className="text-sm text-gray-400">Loading job details…</p>
          ) : job ? (
            <div className="rounded bg-black/30 border border-gray-700 p-3">
              <p className="text-sm text-gray-200 font-semibold">{job.title}</p>
              <p className="text-xs text-gray-400">
                {job.company}
                {job.location ? ` • ${job.location}` : ""}
                {job.type ? ` • ${job.type}` : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Complete the form below to apply.
            </p>
          )}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <label className="block">
            <span className="text-gray-300">
              Full Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>

          {/* Email */}
          <label className="block">
            <span className="text-gray-300">
              Email Address <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </label>

          {/* Resume (optional) */}
          <label className="block">
            <span className="text-gray-300">Resume (URL or Text)</span>
            <textarea
              value={form.resume}
              onChange={(e) => update("resume", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gold"
              rows={4}
              placeholder="Paste a link to your resume (Google Drive / Dropbox / website) or paste text…"
            />
          </label>

          {/* Cover letter (optional, but helpful) */}
          <label className="block">
            <span className="text-gray-300">Cover Letter (optional)</span>
            <textarea
              value={form.coverLetter || ""}
              onChange={(e) => update("coverLetter", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gold"
              rows={4}
              placeholder="A short message to the employer…"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full px-4 py-2 font-semibold rounded transition ${
              submitting
                ? "bg-gray-500 text-gray-200 cursor-not-allowed"
                : "bg-gold text-black hover:bg-yellow-500"
            }`}
          >
            {submitting ? "Sending..." : "Send Application"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
