"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function EmployerConsultingInterestPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const user = data?.user;
        if (user?.name) setName(String(user.name));
        if (user?.email) setEmail(String(user.email));
      } catch {
        // no-op
      }
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim()) {
      setError("Please provide your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/consulting-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to submit support request.");
      }

      setSuccess(
        "Request submitted. Our team will review and follow up with managed support options.",
      );
    } catch (err: any) {
      setError(err?.message || "Failed to submit support request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="text-2xl font-extrabold text-yellow-300">
          Request Managed Recruiting Support
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          Submit this form to enter the managed support queue. This is for
          hands-on recruiting help beyond self-serve job posting.
        </p>

        <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          What happens next: your request is logged, triaged, and routed for
          follow-up by the recruiting team.
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-900/20 p-3 text-red-200">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 p-3 text-emerald-200">
            {success}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black/40 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-black/40 px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-yellow-400 px-4 py-2.5 font-semibold text-black hover:bg-yellow-500 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Managed Support Request"}
          </button>
        </form>

        <div className="mt-6 flex gap-3">
          <Link href="/employer" className="text-sm text-yellow-200 underline">
            Back to Employer Dashboard
          </Link>
          <Link
            href="/dashboard/employer/consultants"
            className="text-sm text-yellow-200 underline"
          >
            Browse Consultants
          </Link>
        </div>
      </div>
    </div>
  );
}
