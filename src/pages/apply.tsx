"use client";

import React, { useState } from "react";
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

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

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

  const update = (key: keyof FormState, value: string) => {
    setSuccess(null);
    setError(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Honeypot: if filled, silently pretend success (stops bots)
    if (form.company.trim()) {
      setSuccess(
        "✅ Application submitted successfully. We’ll review it and follow up by email.",
      );
      setForm({
        fullName: "",
        email: "",
        role: "",
        skills: "",
        links: "",
        why: "",
        company: "",
      });
      return;
    }

    // Basic front-end validation
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const role = form.role.trim();
    const why = form.why.trim();

    if (!fullName || !email || !role || !why) {
      setError(
        "Please complete: Full Name, Email, Role, and Why you want to join.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload: FormState = {
        ...form,
        fullName,
        email,
        role,
        why,
        company: "", // always blank
      };

      // ✅ Submit to MongoDB via API
      const res = await fetch("/api/interns/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

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

      <main className="min-h-screen bg-black text-white px-6 py-14 relative">
        <GlowBackground />

        <div className="relative max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href="/join-the-mission"
              className="text-yellow-400 hover:underline"
            >
              ← Back to Join the Mission
            </Link>
          </div>

          <div className="rounded-2xl border border-yellow-500/15 bg-gray-900/50 p-6 md:p-8 shadow-xl">
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300">
              Apply to Join the Mission
            </h1>

            <p className="mt-3 text-white/85 leading-relaxed">
              Help build Black Wealth Exchange. Tell us what role you want, what
              you can do, and why you’re aligned with the mission.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {/* Honeypot (hidden) */}
              <div className="hidden" aria-hidden="true">
                <label className="block text-sm font-semibold text-white/90">
                  Company
                </label>
                <input
                  name="company"
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white"
                  placeholder="Leave blank"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Full Name <span className="text-yellow-400">*</span>
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="Your name"
                  required
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Email <span className="text-yellow-400">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="you@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Role You Want <span className="text-yellow-400">*</span>
                </label>

                <select
                  name="roleSelect"
                  value={
                    [
                      "Frontend",
                      "Backend",
                      "AI & Data",
                      "Community & Content",
                      "Research & Partnerships",
                      "QA / Testing",
                      "Other",
                    ].includes(form.role)
                      ? form.role
                      : "Other"
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    update("role", v === "Other" ? "" : v);
                  }}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                >
                  <option value="" disabled>
                    Select a role…
                  </option>
                  <option>Frontend</option>
                  <option>Backend</option>
                  <option>AI & Data</option>
                  <option>QA / Testing</option>
                  <option>Community & Content</option>
                  <option>Research & Partnerships</option>
                  <option>Other</option>
                </select>

                <input
                  name="role"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="If Other, type it here (e.g., UX/UI, Marketing, DevOps)…"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90">
                  Skills (comma-separated)
                </label>
                <input
                  name="skills"
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
                  name="links"
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
                  name="why"
                  value={form.why}
                  onChange={(e) => update("why", e.target.value)}
                  className="mt-2 w-full min-h-[140px] rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-yellow-500"
                  placeholder="Tell us why you care about the mission and how you want to help…"
                  required
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
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Application"}
                </button>

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
