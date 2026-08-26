import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import PremiumDigitalCard from "@/components/black-card/PremiumDigitalCard";
import {
  BLACK_CARD_POSITIONING,
  BLACK_CARD_TIERS,
  type BlackCardTier,
} from "@/lib/black-card";

const ORDER: BlackCardTier[] = ["standard", "signature", "elite"];

const TIER_CONTEXT: Record<
  BlackCardTier,
  {
    segment: string;
    valueSummary: string;
    cta: string;
    badge: string;
    ctaHref?: string;
    ctaDisabled?: boolean;
  }
> = {
  standard: {
    segment: "Entry Membership",
    valueSummary: "Included with Premium plan.",
    cta: "View Premium plan",
    badge: "STANDARD",
    ctaHref: "/pricing",
  },
  signature: {
    segment: "Growth Membership",
    valueSummary: "Included with Founding Member plan.",
    cta: "View Founding plan",
    badge: "SIGNATURE",
    ctaHref: "/pricing",
  },
  elite: {
    segment: "Executive Membership",
    valueSummary:
      "Elite is a high-touch tier and is not available as self-serve checkout.",
    cta: "Invite Only",
    badge: "ELITE",
    ctaDisabled: true,
  },
};

export default function BlackCardLandingPage() {
  const [hasActiveCard, setHasActiveCard] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/black-card/member-summary", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        const active =
          res.ok &&
          (String(json?.member?.status || "").toLowerCase() === "active" ||
            Boolean(json?.card?.cardIdDisplay));
        setHasActiveCard(active);
        setMemberId(String(json?.card?.memberId || ""));
        setVerificationUrl(String(json?.card?.verificationUrl || ""));
      } catch {
        setHasActiveCard(false);
      }
    })();
  }, []);

  return (
    <>
      <Head>
        <title>BWE Black Card | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Understand BWE Black Card tier mapping, member access behavior, and the current plan-to-tier relationship without changing the underlying membership contract."
        />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-9rem] h-[440px] w-[440px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_80%_22%,rgba(255,255,255,0.08),transparent_24%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Black Card</div>
                <h1 className="bwe-display-title mt-3 max-w-[11ch]">
                  Membership identity with clear plan-to-tier mapping.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  {BLACK_CARD_POSITIONING}. Black Card is a membership benefit
                  tied to your BWE plan, not a separate self-serve product line.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/pricing"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    View pricing plans
                  </Link>
                  <a
                    href="#tiers"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    See plan mapping
                  </a>
                  <Link
                    href="/"
                    className="bwe-open-link bwe-focus-ring text-sm text-white/82"
                  >
                    Back to home
                  </Link>
                </div>

                {hasActiveCard ? (
                  <div className="mt-6 rounded-2xl border border-[rgba(93,211,158,0.3)] bg-[rgba(93,211,158,0.08)] p-4">
                    <div className="text-sm font-semibold text-emerald-200">
                      Your Black Card is active
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/72">
                      {memberId ? `Member ID: ${memberId}. ` : ""}
                      {verificationUrl
                        ? "Verification is available from the current member route."
                        : "Verification is still being prepared."}
                    </p>
                    <Link
                      href="/dashboard/black-card"
                      className="bwe-open-link bwe-focus-ring mt-3 text-[var(--accent)]"
                    >
                      View my digital card
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[26px] border border-[rgba(212,175,55,0.2)] bg-black/24 p-3 shadow-[0_14px_50px_rgba(0,0,0,0.45)]">
                <PremiumDigitalCard
                  memberName="Thomas"
                  memberId="BCM-XXXXXXX"
                  status="Active"
                  verificationId="BCV-XXXXXX"
                  isExample
                />
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">What it is</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                Black Card is included through membership, and the current plan
                determines the current tier.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
                Premium includes Standard. Founding Member includes Signature.
                Elite remains invite-only. This page explains the current
                relationship without changing plan rules or self-serve
                availability.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Standard
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  Included with Premium
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Signature
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  Included with Founding Member
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Elite
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  Invite-only
                </div>
              </div>
            </div>
          </section>

          <section id="tiers" className="mt-8 grid gap-4 lg:grid-cols-3">
            {ORDER.map((tierKey) => {
              const tier = BLACK_CARD_TIERS[tierKey];
              const context = TIER_CONTEXT[tierKey];
              const featured = tierKey === "signature";

              return (
                <article
                  key={tierKey}
                  className={`rounded-[26px] border p-5 sm:p-6 ${
                    featured
                      ? "border-[rgba(212,175,55,0.34)] bg-[rgba(212,175,55,0.08)]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="bwe-eyebrow">{context.badge}</div>
                      <h3 className="mt-2 text-[1.4rem] font-extrabold tracking-[-0.04em] text-white">
                        {tier.label}
                      </h3>
                    </div>
                    <span
                      className="bwe-badge"
                      data-tone={featured ? "accent" : undefined}
                    >
                      {context.segment}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/68">
                    {tier.tagline}
                  </p>

                  <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-[var(--accent)]">
                      {context.valueSummary}
                    </div>
                    <div className="mt-1 text-xs text-white/48">
                      Black Card is included with the matching membership plan.
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm leading-6 text-white/68">
                    {tier.benefits.slice(0, 5).map((benefit) => (
                      <li key={benefit}>• {benefit}</li>
                    ))}
                  </ul>

                  <div className="mt-5">
                    {context.ctaDisabled ? (
                      <div className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-5 text-sm font-semibold text-white/48">
                        {context.cta}
                      </div>
                    ) : (
                      <Link
                        href={context.ctaHref || "/pricing"}
                        className="bwe-cta-secondary bwe-focus-ring w-full px-5"
                      >
                        {context.cta}
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="bwe-soft-tile p-4 sm:p-5">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Access behavior
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-white/68">
                <li>1. Activate Premium or Founding from `/pricing`.</li>
                <li>
                  2. Member-only rewards stay locked until the current access
                  conditions are met.
                </li>
                <li>
                  3. Dashboard card and related member actions unlock through
                  the existing system.
                </li>
                <li>4. Physical cards are not currently available.</li>
              </ul>
            </div>

            <div className="bwe-soft-tile p-4 sm:p-5">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <BadgeCheck className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Why members upgrade
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-white/68">
                <li>
                  • Standard gives immediate identity and member-priced entry
                  points.
                </li>
                <li>
                  • Signature extends access through the current higher-tier
                  membership path.
                </li>
                <li>
                  • Elite remains the highest tier and is not a self-serve
                  purchase.
                </li>
                <li>
                  • The value is tied to the current BWE member system, not
                  cosmetic status alone.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
