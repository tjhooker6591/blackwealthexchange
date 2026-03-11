// src/pages/advertising/index.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/router";

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
        Start Campaign Details →
      </Link>
    </div>
  </div>
);

function optionToDetailsHref(option: string) {
  if (option === "featured-sponsor") return "/advertise/featured-sponsor";
  if (option === "directory-standard" || option === "directory-featured") {
    return "/advertise/business-directory";
  }
  if (option === "banner-ad") return "/advertise/banner-ads";
  if (option === "custom-solution-deposit") return "/advertise/custom";
  return "/advertising";
}

export default function AdvertisingIndexPage() {
  const router = useRouter();
  const success = router.query.success === "1";
  const canceled = router.query.canceled === "1";
  const option =
    typeof router.query.option === "string" ? router.query.option : "";

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

        {success ? (
          <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
            Payment submitted successfully. Your advertising request is now in
            review, and our team will follow up with activation details.
          </div>
        ) : null}

        {canceled ? (
          <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
            Checkout was canceled. Your campaign request is still saved — you
            can restart checkout anytime below.
            {option ? (
              <div className="mt-2">
                <Link
                  href={optionToDetailsHref(option)}
                  className="underline text-yellow-100"
                >
                  Resume campaign details for {option}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdCard
            title="Featured Sponsor"
            desc="Top placement for maximum visibility across the platform."
            price="$25 / 7 days"
            badge="Most Popular"
            href="/advertise/featured-sponsor"
          />

          <AdCard
            title="Directory Listings"
            desc="Choose standard or featured placement based on your growth goals."
            price="$49 / 30 days"
            href="/advertise/business-directory"
          />

          <AdCard
            title="Banner Ads"
            desc="Tasteful banner placement near high-traffic areas."
            price="$199 / 14 days"
            href="/advertise/banner-ads"
          />

          <AdCard
            title="Custom Solutions"
            desc="Recruiting, consulting, partnerships, sponsored content, or bundled campaigns."
            price="$100 deposit"
            href="/advertise/custom"
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
