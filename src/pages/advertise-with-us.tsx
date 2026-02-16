"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import BuyNowButton from "@/components/BuyNowButton";

type MeUser = {
  _id?: string;
  id?: string;
  email?: string;
  accountType?: string;
};

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

function _cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const AD_OPTIONS = [
  {
    title: "Featured Sponsor",
    description:
      "Highlight your brand to a dedicated, engaged audience on our homepage.",
    href: "/advertise/featured-sponsor",
    tag: "Highest visibility",
  },
  {
    title: "Business Directory",
    description:
      "Get your business featured in our Black-owned business directory.",
    href: "/advertise/business-directory",
    tag: "Directory boost",
  },
  {
    title: "Banner Ads",
    description:
      "Place your ads on high-traffic pages across the platform.",
    href: "/advertise/banner-ads",
    tag: "Site-wide placements",
  },
  {
    title: "Custom Solutions",
    description:
      "Let’s build a tailored advertising plan for your business.",
    href: "/advertise/custom",
    tag: "Custom packages",
  },
] as const;

const BENEFITS = [
  {
    title: "Wide Reach",
    text: "Engage visitors who are actively looking to support Black-owned businesses.",
  },
  {
    title: "Flexible Placements",
    text: "Choose from homepage banners, category highlights, or featured directory listings.",
  },
  {
    title: "Affordable Packages",
    text: "Ad tiers for every budget—from small businesses to major sponsors.",
  },
] as const;

export default function AdvertiseWithUs() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => null);
        const user = (data?.user ?? null) as MeUser | null;
        if (!cancelled) setMe(user);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const userId = useMemo(() => me?._id || me?.id || "", [me]);
  const canBuy = Boolean(userId);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />

      <div className="relative max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          >
            ← Back
          </button>

          <Link
            href="/pricing"
            className="hidden md:inline-flex items-center rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black hover:bg-yellow-300 transition"
          >
            View Pricing
          </Link>
        </div>

        {/* Hero */}
        <section className="rounded-2xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/10 to-transparent p-8 shadow-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-yellow-300">
            Want to increase visibility for your business?
          </h1>
          <p className="mt-4 text-lg text-gray-200/90 leading-relaxed max-w-3xl">
            Choose an advertising option that fits your goals. Reserve your slot
            with secure checkout, then our team reviews and publishes your ad.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="#options"
              className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow"
            >
              Explore Ad Options
            </a>
            <Link
              href="/business-directory"
              className="inline-flex justify-center rounded-xl border border-yellow-500/30 bg-black/30 px-6 py-3 font-bold text-yellow-300 hover:bg-yellow-500/10 transition"
            >
              View Sponsored Directory
            </Link>
          </div>

          <div className="mt-4 text-sm text-gray-300">
            Tip: Have your banner image ready (PNG/JPG), website link, and the
            dates you want to run.
          </div>
        </section>

        {/* Benefits */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow hover:bg-white/10 transition"
            >
              <h3 className="text-xl font-semibold text-yellow-200 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-200/90">{item.text}</p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
          <h2 className="text-2xl font-bold text-yellow-200 text-center">
            How It Works
          </h2>
          <ol className="mt-4 list-decimal list-inside space-y-2 max-w-2xl mx-auto text-gray-200/90">
            <li>Choose your ad package.</li>
            <li>Review pricing and placement options.</li>
            <li>Submit your details and upload your banner (if applicable).</li>
            <li>Pay securely and reserve your slot.</li>
            <li>We review and publish your ad.</li>
          </ol>
        </section>

        {/* Options */}
        <section id="options" className="space-y-4">
          <div>
            <h2 className="text-3xl font-extrabold text-yellow-300">
              Advertising Options
            </h2>
            <p className="mt-2 text-gray-200/90 max-w-3xl">
              Select one of the options below to begin. Each option leads to a
              simple, streamlined page before checkout.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AD_OPTIONS.map((option) => (
              <Link
                key={option.title}
                href={option.href}
                className="group rounded-2xl border border-yellow-500/20 bg-gray-900/40 p-6 shadow hover:shadow-2xl hover:border-yellow-400/35 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-yellow-200 transition">
                    {option.title}
                  </h3>
                  <span className="text-[11px] rounded-full border border-yellow-500/25 bg-black/30 px-2 py-1 text-yellow-300">
                    {option.tag}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                  {option.description}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-yellow-300 group-hover:text-yellow-200">
                  Start → <span className="opacity-70">({option.href})</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Instant purchase */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow text-center">
          <h3 className="text-xl font-semibold text-white">
            Try an Instant Purchase
          </h3>
          <p className="mt-2 text-gray-300">
            This is a test checkout button (example sponsor package).
          </p>

          <div className="mt-6 flex items-center justify-center">
            {meLoading ? (
              <div className="h-10 w-56 rounded-xl bg-white/10 animate-pulse" />
            ) : canBuy ? (
              <BuyNowButton
                userId={userId}
                itemId="example-sponsor-package"
                amount={75}
                type="ad"
              />
            ) : (
              <Link
                href="/login?redirect=/advertise-with-us"
                className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow"
              >
                Log in to purchase
              </Link>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-400">
            For production, replace the test package with your real ad SKUs and
            pricing from MongoDB.
          </p>
        </section>
      </div>
    </div>
  );
}
