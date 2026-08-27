"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { getAdDurationOptions } from "@/lib/advertising/pricing";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const AdCard = ({
  title,
  desc,
  where,
  nextStep,
  price,
  href,
  badge,
  onStart,
}: {
  title: string;
  desc: string;
  where: string;
  nextStep: string;
  price: string;
  href: string;
  badge?: string;
  onStart?: () => void;
}) => (
  <article className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-white/68">{desc}</p>
        <p className="mt-3 text-xs text-white/52">
          <span className="font-semibold text-white/84">Where it appears:</span>{" "}
          {where}
        </p>
        <p className="mt-1 text-xs text-white/52">
          <span className="font-semibold text-white/84">
            What happens next:
          </span>{" "}
          {nextStep}
        </p>
      </div>

      {badge ? (
        <span className="rounded-full border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.12)] px-3 py-1 text-xs text-[var(--accent)]">
          {badge}
        </span>
      ) : null}
    </div>

    <div className="mt-5 flex items-end justify-between gap-3">
      <div>
        <div className="text-xs text-white/45">Starting at</div>
        <div className="text-2xl font-bold text-[var(--accent)]">{price}</div>
      </div>

      <Link
        href={href}
        onClick={onStart}
        className={cx("bwe-cta-primary bwe-focus-ring px-5")}
      >
        Start campaign details
      </Link>
    </div>
  </article>
);

function optionToDetailsHref(option: string) {
  if (option === "featured-sponsor") return "/advertise/featured-sponsor";
  if (option === "directory-standard" || option === "directory-featured") {
    return "/advertise/business-directory";
  }
  if (option === "banner-ad") return "/advertise/banner-ads";
  if (option === "custom-solution-deposit" || option === "custom-solution") {
    return "/advertise/custom";
  }
  return "/advertising";
}

export default function AdvertisingIndexPage() {
  const featuredBase = getAdDurationOptions("featured-sponsor")[0];
  const directoryBase = getAdDurationOptions("directory-standard")[0];
  const bannerBase = getAdDurationOptions("banner-ad")[0];
  const customBase = getAdDurationOptions("custom-solution-deposit")[0];

  const priceLabel = (base?: {
    amountDollars: number;
    durationDays: number;
  }) =>
    base ? `$${base.amountDollars} / ${base.durationDays} days` : "See details";

  const router = useRouter();
  const success = router.query.success === "1";
  const canceled = router.query.canceled === "1";
  const option =
    typeof router.query.option === "string" ? router.query.option : "";

  const trackAdvertisingEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/advertising",
      section: "advertising_landing",
      ...extras,
    });
  };

  useEffect(() => {
    trackAdvertisingEvent("advertising_landing_viewed");
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[740px] w-[740px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 right-[-8rem] h-[420px] w-[420px] rounded-full bg-sky-500/[0.04] blur-3xl" />

      <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
        <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="bwe-eyebrow">Advertising</div>
              <h1 className="bwe-display-title mt-3 max-w-[10ch]">
                Promote with trusted BWE placements.
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">
                Choose a package, complete campaign details, and move through
                the existing review, approval, and scheduled activation flow.
              </p>
              <p className="mt-3 text-sm text-white/58">
                Placement definitions and delivery rules stay canonical and
                visible before checkout.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/advertising/placements"
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  View placements
                </Link>
                <Link
                  href="/"
                  className="bwe-cta-secondary bwe-focus-ring px-6"
                >
                  View site
                </Link>
              </div>
            </div>

            <section className="rounded-2xl border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Delivery model
              </div>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Choose package, complete campaign details, review and approval,
                then activation by placement rules and schedule.
              </p>
              <p className="mt-3 text-xs text-white/52">
                Placement definitions:{" "}
                <Link
                  href="/advertising/placements"
                  className="text-[var(--accent)] underline underline-offset-4"
                >
                  /advertising/placements
                </Link>
              </p>
            </section>
          </div>
        </section>

        {success ? (
          <div className="mt-6 rounded-[24px] border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
            Payment submitted successfully. Your advertising request is now in
            review, and our team will follow up with activation details.
          </div>
        ) : null}

        {canceled ? (
          <div className="mt-6 rounded-[24px] border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Checkout was canceled. Your campaign request is still saved and can
            be resumed.
            {option ? (
              <div className="mt-2">
                <Link
                  href={optionToDetailsHref(option)}
                  className="text-[var(--accent)] underline underline-offset-4"
                >
                  Resume campaign details for {option}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <section className="mt-8 rounded-[28px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
          <div className="bwe-eyebrow">How advertising works</div>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-white/68 md:grid-cols-3">
            <li className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
              <span className="font-semibold text-white">
                1. Choose placement
              </span>
              <br />
              Pick the format that matches your goal and budget.
            </li>
            <li className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
              <span className="font-semibold text-white">
                2. Submit campaign details
              </span>
              <br />
              Complete targeting and creative requirements.
            </li>
            <li className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
              <span className="font-semibold text-white">
                3. Review and activation
              </span>
              <br />
              BWE confirms eligibility, then schedules placement.
            </li>
          </ol>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdCard
            title="Featured Sponsor"
            desc="Primary homepage sponsorship surface with weekly scheduled Featured Sponsor rail placement."
            where="Homepage Featured Sponsors rail"
            nextStep="Open package details, provide campaign info, then continue through approval and scheduling."
            price={priceLabel(featuredBase)}
            badge="Most popular"
            href="/advertise/featured-sponsor"
            onStart={() =>
              trackAdvertisingEvent("advertising_option_selected", {
                ctaId: "ad_option_featured_sponsor",
                ctaLabel: "Featured Sponsor",
                destination: "/advertise/featured-sponsor",
                ad_option: "featured-sponsor",
                ad_type: "featured-sponsor",
                package_type: "featured",
                source_variant: "advertising_index",
              })
            }
          />

          <AdCard
            title="Directory listings"
            desc="Directory campaign tiers with explicit review and placement lifecycle."
            where="Business Directory featured and top placement areas"
            nextStep="Choose standard or featured listing, then submit campaign details for review."
            price={priceLabel(directoryBase)}
            href="/advertise/business-directory"
            onStart={() =>
              trackAdvertisingEvent("advertising_option_selected", {
                ctaId: "ad_option_directory",
                ctaLabel: "Directory Listings",
                destination: "/advertise/business-directory",
                ad_option: "directory",
                ad_type: "directory",
                package_type: "directory",
                source_variant: "advertising_index",
              })
            }
          />

          <AdCard
            title="Banner ads"
            desc="Business Directory banner inventory for high-visibility campaign impressions."
            where="Business Directory banner and sidebar inventory"
            nextStep="Select requested banner placement and duration, then submit campaign details."
            price={priceLabel(bannerBase)}
            href="/advertise/banner-ads"
            onStart={() =>
              trackAdvertisingEvent("advertising_option_selected", {
                ctaId: "ad_option_banner",
                ctaLabel: "Banner Ads",
                destination: "/advertise/banner-ads",
                ad_option: "banner-ad",
                ad_type: "banner-ad",
                package_type: "banner",
                source_variant: "advertising_index",
              })
            }
          />

          <AdCard
            title="Custom solutions"
            desc="Custom scoped campaigns with deliverables defined before launch."
            where="Approved custom surfaces defined in the campaign plan"
            nextStep="Submit a custom request first, then proceed with scoped activation flow."
            price={
              customBase
                ? `$${customBase.amountDollars} deposit`
                : "See details"
            }
            href="/advertise/custom"
            onStart={() =>
              trackAdvertisingEvent("advertising_option_selected", {
                ctaId: "ad_option_custom",
                ctaLabel: "Custom Solutions",
                destination: "/advertise/custom",
                ad_option: "custom-solution",
                ad_type: "custom-solution",
                package_type: "custom",
                source_variant: "advertising_index",
              })
            }
          />
        </section>

        <section className="mt-8 rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
          <div className="bwe-eyebrow">Support and policy</div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/support/advertising"
              className="bwe-open-link bwe-focus-ring text-white/86"
            >
              Advertising support
            </Link>
            <Link
              href="/legal/advertising-guidelines"
              className="bwe-open-link bwe-focus-ring text-white/86"
            >
              Advertising guidelines
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
