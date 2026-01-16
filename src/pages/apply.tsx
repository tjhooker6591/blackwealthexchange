"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

type FormState = {
  fullName: string;
  email: string;
  role: string;
  skills: string;
  links: string;
  why: string;
  company: string; // honeypot
};

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    role: "",
    skills: "",
    links: "",
    why: "",
    company: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clear messages when user types
  useEffect(() => {
    if (success || error) {
      // don’t spam state, just clear on next keystroke via handlers
    }
  }, [success, error]);

  const update = (key: keyof FormState, value: string) => {
    setSuccess(null);
    setError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic front-end validation
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.role.trim() ||
      !form.why.trim()
    ) {
      setError(
        "Please complete: Full Name, Email, Role, and Why you want to join.",
      );
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Submit to MongoDB via API
      const res = await fetch("/api/interns/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Submission failed. Please try again.");
        return;
      }

      setSuccess(
        "✅ Application submitted successfully. We’ll review it and follow up by email.",
      );

      // Clear form
      setForm({
        fullName: "",
        email: "",
        role: "",
        skills: "",
        links: "",
        why: "",
        company: "",
      });
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Apply | Black Wealth Exchange</title>
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href="/join-the-mission"
              className="text-yellow-400 hover:underline"
            >
              ← Back to Join the Mission
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow">
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400">
              Apply to Join the Mission
            </h1>

            <p className="mt-3 text-white/85 leading-relaxed">
              Help build Black Wealth Exchange. Tell us what role you want, what
              you can do, and why you’re aligned with the mission.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {/* Honeypot (hidden) */}
              <div className="hidden">
                <label className="block text-sm font-semibold text-white/90">
                  Company
                </label>
                <input
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white"
                  placeholder="Leave blank"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Full Name <span className="text-yellow-400">*</span>
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Email <span className="text-yellow-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Role You Want <span className="text-yellow-400">*</span>
                </label>
                <input
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="Frontend, Backend, QA, UX/UI, Marketing, Content, Partnerships…"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Skills (comma-separated)
                </label>
                <input
                  value={form.skills}
                  onChange={(e) => update("skills", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="Next.js, MongoDB, React, Stripe, Figma, QA, SEO…"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Links (GitHub/Portfolio/LinkedIn)
                </label>
                <input
                  value={form.links}
                  onChange={(e) => update("links", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="https://github.com/...  https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Why do you want to join?{" "}
                  <span className="text-yellow-400">*</span>
                </label>
                <textarea
                  value={form.why}
                  onChange={(e) => update("why", e.target.value)}
                  className="mt-2 w-full min-h-[140px] rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="Tell us why you care about the mission and how you want to help…"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-green-200">
                  {success}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* ✅ Submit to MongoDB */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Application"}
                </button>

                {/* ✅ Email fallback */}
                <a
                  href="mailto:blackwealth24@gmail.com?subject=Intern%20Application%20-%20Black%20Wealth%20Exchange"
                  className="inline-flex justify-center rounded-xl border border-yellow-500 px-6 py-3 font-bold text-yellow-400 hover:bg-yellow-500/10 transition"
                >
                  Email Us Instead
                </a>
              </div>

              <p className="text-sm text-white/60 pt-2">
                Tip: Include links to your GitHub, portfolio, LinkedIn, or
                sample work.
              </p>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
