"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { AD_PRICING, getAdDurationOptions } from "@/lib/advertising/pricing";

function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-60">
      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
    </div>
  );
}

const GOAL_OPTIONS = [
  {
    goal: "Get Maximum Visibility",
    title: "Featured Sponsor",
    option: "featured-sponsor",
    where: "Homepage Featured Sponsors rail",
    who: "Best for launches, brand awareness, and premium positioning",
    href: "/advertise/featured-sponsor",
  },
  {
    goal: "Promote Your Brand",
    title: "Banner Placement",
    option: "banner-ad",
    where: "Homepage top banner slot or Business Directory sidebar banner slot",
    who: "Best for strong visual campaigns and repeated impressions",
    href: "/advertise/banner-ads",
  },
  {
    goal: "Increase Discovery",
    title: "Directory Placement",
    option: "directory-featured",
    where: "Business Directory featured placements block and directory listing tiers",
    who: "Best for local discovery and ongoing lead visibility",
    href: "/advertise/business-directory",
  },
  {
    goal: "Run a Custom Campaign",
    title: "Custom Solution",
    option: "custom-solution-deposit",
    where: "Scoped surfaces defined in approval (no fixed slot promised at intake)",
    who: "Best for multi-surface campaigns and larger initiatives",
    href: "/advertise/custom",
  },
] as const;

const HOW_IT_WORKS = [
  "Choose a package based on your growth goal.",
  "Submit campaign details and creative assets.",
  "Campaign enters review and approval workflow.",
  "Approved campaign goes live in selected placements.",
  "Campaign runs for the selected duration, then rotates/ends by schedule.",
] as const;

export default function AdvertiseWithUs() {
  const router = useRouter();

  const trackAdEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/advertise-with-us",
      section: "advertise_with_us",
      ...extras,
    });
  };

  useEffect(() => {
    trackAdEvent("advertising_landing_viewed", {
      source_variant: "advertise_with_us_google_model",
    });
  }, []);

  const pricingRows = useMemo(() => {
    const rows: Array<{
      placement: string;
      duration: string;
      price: string;
      href: string;
      note: string;
    }> = [];

    for (const item of GOAL_OPTIONS) {
      const durations = getAdDurationOptions(item.option);
      if (!durations.length) continue;

      const top = durations[0];
      const isCustom = item.option === "custom-solution-deposit";

      rows.push({
        placement: item.title,
        duration: isCustom
          ? "Scoped per approved plan"
          : top.durationDays === 30
            ? "30 days"
            : top.durationDays === 14
              ? "14 days"
              : `${top.durationDays} days`,
        price: isCustom ? `$${top.amountDollars} deposit` : `$${top.amountDollars}`,
        href: item.href,
        note: isCustom
          ? "Deposit starts planning. Final surfaces and schedule are approved before launch."
          : "Review and approval required before live placement.",
      });
    }

    return rows;
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GlowBackground />

      <div className="relative max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          >
            ← Back
          </button>
          <Link
            href="/advertising"
            className="hidden md:inline-flex items-center rounded-full bg-yellow-400 px-4 py-2 font-semibold text-black hover:bg-yellow-300 transition"
          >
            View Options
          </Link>
        </div>

        <section className="rounded-2xl border border-yellow-500/25 bg-gradient-to-b from-yellow-500/10 to-transparent p-8 shadow-xl">
          <p className="text-xs uppercase tracking-[0.12em] text-yellow-200/80">
            Advertise with BWE
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-yellow-300">
            Promote your business to customers who actively support Black-owned
            brands.
          </h1>
          <p className="mt-4 text-lg text-gray-200/90 leading-relaxed max-w-3xl">
            BWE advertising is for businesses that want trusted visibility with
            explicit placement rules. Launch a campaign, move through review,
            then activate in approved inventory.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/advertising"
              className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow"
            >
              Start Campaign
            </Link>
            <a
              href="#options"
              className="inline-flex justify-center rounded-xl border border-yellow-500/30 bg-black/30 px-6 py-3 font-bold text-yellow-300 hover:bg-yellow-500/10 transition"
            >
              View Options
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
          <h2 className="text-2xl font-bold text-yellow-200">
            Why Advertise on BWE
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/85">
              Targeted audience focused on supporting Black-owned businesses.
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/85">
              Mission-driven platform with high-trust context and brand-safe
              placement.
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/85">
              Featured Sponsor is implemented in the homepage sponsor rail with
              weekly scheduling.
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/85">
              Structured review and lifecycle states so campaigns are clear and
              verifiable.
            </div>
          </div>
        </section>

        <section id="options" className="space-y-3">
          <h2 className="text-3xl font-extrabold text-yellow-300">
            Advertising Options by Goal
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {GOAL_OPTIONS.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() =>
                  trackAdEvent("advertising_option_selected", {
                    ctaLabel: item.title,
                    destination: item.href,
                    ad_option: item.option,
                    source_variant: "advertise_with_us_goal_grouped",
                  })
                }
                className="rounded-2xl border border-yellow-500/20 bg-gray-900/40 p-6 shadow hover:shadow-2xl hover:border-yellow-400/35 transition"
              >
                <p className="text-xs uppercase tracking-[0.1em] text-yellow-300/80">
                  {item.goal}
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-white/80">
                  <span className="text-white/60">Where it appears:</span>{" "}
                  {item.where}
                </p>
                <p className="mt-2 text-sm text-white/80">
                  <span className="text-white/60">Who it is for:</span>{" "}
                  {item.who}
                </p>
                <div className="mt-4 text-sm font-semibold text-yellow-200">
                  Choose this option →
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
          <h2 className="text-2xl font-bold text-yellow-200">How It Works</h2>
          <ol className="mt-4 list-decimal list-inside space-y-2 text-white/85">
            {HOW_IT_WORKS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
          <h2 className="text-2xl font-bold text-yellow-200">
            Pricing and What You Get
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-white/70 border-b border-white/10">
                  <th className="py-2 pr-4">Placement</th>
                  <th className="py-2 pr-4">Typical Duration</th>
                  <th className="py-2 pr-4">Starting Price</th>
                  <th className="py-2 pr-4">Includes</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map((row) => (
                  <tr
                    key={`${row.placement}-${row.duration}`}
                    className="border-b border-white/5"
                  >
                    <td className="py-3 pr-4 font-semibold text-white">
                      {row.placement}
                    </td>
                    <td className="py-3 pr-4 text-white/80">{row.duration}</td>
                    <td className="py-3 pr-4 text-yellow-300 font-semibold">
                      {row.price}
                    </td>
                    <td className="py-3 pr-4 text-white/70">{row.note}</td>
                    <td className="py-3">
                      <Link
                        href={row.href}
                        className="text-yellow-200 font-semibold hover:text-yellow-100"
                      >
                        Open package
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-white/60">
            Prices shown from current package configuration (
            {AD_PRICING["featured-sponsor"].label}, banners, directory, custom
            deposit).
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
          <h2 className="text-2xl font-bold text-yellow-200">
            Proof and Trust
          </h2>
          <p className="mt-2 text-white/80">
            Live sponsor placements are visible in the Featured Sponsors rail on
            the homepage. Other paid products are launched through explicit
            approval + fulfillment states before they display.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-yellow-500/40 bg-black/30 px-4 py-2 text-yellow-200 font-semibold"
            >
              View Homepage Sponsor Rail
            </Link>
            <Link
              href="/featured"
              className="rounded-xl border border-yellow-500/40 bg-black/30 px-4 py-2 text-yellow-200 font-semibold"
            >
              View Sponsor Profile Template
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
          <h2 className="text-2xl font-bold text-yellow-200">
            Need Help Choosing?
          </h2>
          <p className="mt-2 text-white/80">
            If you are unsure which package fits your business, start with
            Custom Solutions and we will shape a campaign based on your goal,
            budget, and timeline.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-black/35 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-yellow-300/80">
                Direct Support
              </p>
              <p className="mt-1 text-sm text-white/90">
                Contact the advertising team directly for package guidance,
                launch timing, and campaign support.
              </p>
              <a
                href="mailto:advertising@blackwealthexchange.com?subject=BWE%20Advertising%20Support"
                className="mt-3 inline-flex rounded-lg border border-yellow-400/50 bg-yellow-400/10 px-3 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-400/20"
              >
                Email Advertising Support
              </a>
            </div>

            <div className="rounded-xl border border-white/15 bg-black/35 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-yellow-300/80">
                Guided Option
              </p>
              <p className="mt-1 text-sm text-white/90">
                Need a tailored plan? Start a custom campaign request and we
                will match placement, budget, and duration to your goals.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/advertise/custom"
                  className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
                >
                  Request Custom Campaign
                </Link>
                <Link
                  href="/legal/advertising-guidelines"
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  Advertising Guidelines
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
