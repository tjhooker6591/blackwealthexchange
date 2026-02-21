// src/pages/advertising/index.tsx
"use client";

import Link from "next/link";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const AdCard = ({
  title,
  desc,
  price,
  href,
  badge,
}: {
  title: string;
  desc: string;
  price: string;
  href: string;
  badge?: string;
}) => (
  <div className="rounded-2xl border border-yellow-500/15 bg-zinc-950 p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-yellow-200">{title}</h3>
        <p className="mt-1 text-sm text-zinc-300">{desc}</p>
      </div>

      {badge ? (
        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-200">
          {badge}
        </span>
      ) : null}
    </div>

    <div className="mt-4 flex items-end justify-between gap-3">
      <div>
        <div className="text-xs text-zinc-400">Starting at</div>
        <div className="text-2xl font-bold text-yellow-300">{price}</div>
      </div>

      <Link
        href={href}
        className={cx(
          "rounded-xl px-4 py-2 text-sm font-semibold transition",
          "bg-yellow-500 text-black hover:bg-yellow-400",
        )}
      >
        Proceed to Checkout →
      </Link>
    </div>
  </div>
);

export default function AdvertisingIndexPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-yellow-300">
              Advertising
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Promote your business on Black Wealth Exchange with trusted,
              tasteful placements.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/advertise-with-us"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm hover:bg-zinc-900"
            >
              Back to Hub
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm hover:bg-zinc-900"
            >
              View Site
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdCard
            title="Featured Sponsor"
            desc="Top placement for maximum visibility across the platform."
            price="$149 / 14 days"
            badge="Most Popular"
            href="/advertising/checkout?option=featured-sponsor&duration=14"
          />

          <AdCard
            title="Directory Listing (Standard)"
            desc="Get listed in the directory with trusted visibility."
            price="$49 / 30 days"
            href="/advertising/checkout?option=directory-standard&duration=30"
          />

          <AdCard
            title="Directory Listing (Featured)"
            desc="Priority directory placement + enhanced visibility."
            price="$99 / 30 days"
            href="/advertising/checkout?option=directory-featured&duration=30"
          />

          <AdCard
            title="Banner Ads"
            desc="Tasteful banner placement near high-traffic areas."
            price="$199 / 14 days"
            href="/advertising/checkout?option=banner-ad&duration=14"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-yellow-500/15 bg-zinc-950 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-200">
                Custom Solutions
              </h3>
              <p className="mt-1 text-sm text-zinc-300">
                Recruiting, consulting, partnerships, sponsored content, or
                bundled campaigns.
              </p>
            </div>

            <Link
              href="/advertise/custom"
              className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15"
            >
              Request a Custom Plan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
