// src/pages/affiliate/signup.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

function _cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type FormState = {
  name: string;
  website: string;
  audienceSize: string;
  notes: string;
  company: string; // honeypot
};

export default function AffiliateSignup() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    website: "",
    audienceSize: "",
    notes: "",
    company: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [authState, setAuthState] = useState<
    "loading" | "loggedIn" | "loggedOut"
  >("loading");

  const [errorMsg, setErrorMsg] = useState<string>("");

  // prevent duplicate session checks in dev/StrictMode
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          setAuthState("loggedOut");
          return;
        }

        const data = await res.json();
        if (!data?.user) {
          setAuthState("loggedOut");
          return;
        }

        setAuthState("loggedIn");
      } catch {
        setAuthState("loggedOut");
      }
    };

    checkSession();
  }, [router.isReady]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setErrorMsg("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    // honeypot check (bots)
    if (form.company.trim().length > 0) {
      setErrorMsg("Submission blocked.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        return;
      }

      setErrorMsg(data?.message || "Something went wrong. Please try again.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Affiliate Signup | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Apply to join the Black Wealth Exchange Affiliate Program and earn commissions by promoting Black-owned brands and curated offers."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Soft gold glow like index */}
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
          <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="absolute left-20 bottom-20 h-[420px] w-[420px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 py-10">
          {/* Logged out gate (no redirect loops) */}
          {authState === "loading" ? (
            <div className="min-h-[70vh] flex items-center justify-center text-white/70">
              Loading…
            </div>
          ) : authState === "loggedOut" ? (
            <div className="min-h-[70vh] flex items-center justify-center">
              <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gold">
                  Please Log In
                </h1>
                <p className="mt-2 text-sm md:text-base text-white/70">
                  You must be logged in to apply for the Affiliate Program.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/login?redirect=/affiliate/signup"
                    className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-bold text-black hover:bg-yellow-400 transition"
                  >
                    Go to Login
                  </Link>

                  <Link
                    href="/affiliate"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
                  >
                    Back to Affiliate Home
                  </Link>
                </div>
              </div>
            </div>
          ) : success ? (
            <div className="min-h-[70vh] flex items-center justify-center">
              <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gold">
                  Application Received!
                </h1>
                <p className="mt-2 text-sm md:text-base text-white/70">
                  We’ll review it and email you within{" "}
                  <span className="text-white font-semibold">
                    3 business days
                  </span>
                  .
                </p>

                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/affiliate"
                    className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-bold text-black hover:bg-yellow-400 transition"
                  >
                    Back to Affiliate Home
                  </Link>
                  <Link
                    href="/affiliate/recommendation"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
                  >
                    Get Your Links
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left: program info (substance) */}
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gold">
                  Affiliate Application
                </h1>
                <p className="mt-2 text-sm md:text-base text-white/70">
                  Apply to earn commissions by promoting Black-owned brands,
                  curated offers, and key BWE products.
                </p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-semibold text-white">
                      Commission
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      5–25% CPA (offer-based)
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-semibold text-white">
                      Cookie window
                    </p>
                    <p className="mt-1 text-sm text-white/70">30 days</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-semibold text-white">
                      Review time
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      Up to 3 business days
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-sm font-semibold text-white">
                    What we look for
                  </p>
                  <ul className="mt-2 text-sm text-white/70 list-disc pl-5 space-y-1">
                    <li>
                      Clear audience niche (business, finance, culture, tech,
                      lifestyle)
                    </li>
                    <li>Consistent content and real engagement</li>
                    <li>Alignment with the mission and community standards</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <Link
                    href="/affiliate"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Back to Affiliate Home →
                  </Link>
                </div>
              </section>

              {/* Right: application form */}
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Full name
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Website / Profile link
                    </label>
                    <input
                      name="website"
                      type="text"
                      value={form.website}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      placeholder="Instagram, YouTube, website, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Audience size / reach
                    </label>
                    <input
                      name="audienceSize"
                      type="text"
                      value={form.audienceSize}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      placeholder="Example: 12k IG, 3k email list, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/60 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={5}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                      placeholder="Tell us about your niche, audience, and how you plan to promote BWE…"
                    />
                  </div>

                  {/* Honeypot (hidden) */}
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  {errorMsg && (
                    <p className="text-sm text-red-400">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50 transition"
                  >
                    {submitting ? "Submitting…" : "Apply Now"}
                  </button>

                  <p className="text-xs text-white/60 text-center">
                    By submitting, you agree to follow BWE community standards
                    and promotional guidelines.
                  </p>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
