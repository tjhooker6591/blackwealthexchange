import type { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BadgeCheck,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import PremiumDigitalCard from "@/components/black-card/PremiumDigitalCard";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function PlanCard({
  title,
  price,
  cadence,
  summary,
  tier,
  bestFor,
  features,
  ctaText,
  onCta,
  active = false,
  featured = false,
  disabled = false,
  finePrint,
}: {
  title: string;
  price: string;
  cadence: string;
  summary: string;
  tier: string;
  bestFor: string;
  features: string[];
  ctaText: string;
  onCta: () => void;
  active?: boolean;
  featured?: boolean;
  disabled?: boolean;
  finePrint?: string;
}) {
  return (
    <article
      className={cx(
        "flex h-full flex-col rounded-[26px] border p-5 sm:p-6",
        featured
          ? "border-[rgba(212,175,55,0.34)] bg-[rgba(212,175,55,0.08)]"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="bwe-eyebrow">{title}</div>
          <h2 className="mt-2 text-[1.7rem] font-extrabold tracking-[-0.04em] text-white sm:text-[2rem]">
            {price}
          </h2>
          <p className="mt-1 text-sm text-white/58">{cadence}</p>
        </div>
        <span className="bwe-badge" data-tone={featured ? "accent" : undefined}>
          {tier}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/72">{summary}</p>

      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-white/42">
          Best for
        </div>
        <div className="mt-2 text-sm font-semibold text-white/88">
          {bestFor}
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm leading-6 text-white/70">
        {features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCta}
        disabled={disabled}
        className={cx(
          "mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition",
          disabled
            ? "cursor-not-allowed border border-white/10 bg-white/[0.04] text-white/48"
            : featured
              ? "bg-[var(--accent)] text-black hover:bg-[var(--accent-strong)]"
              : "border border-white/14 bg-white/[0.04] text-white hover:border-[rgba(212,175,55,0.35)] hover:bg-white/[0.08]",
        )}
      >
        {active ? "Current plan" : ctaText}
        {!active ? <ArrowRight className="h-4 w-4" /> : null}
      </button>

      {finePrint ? (
        <p className="mt-3 text-xs leading-5 text-white/48">{finePrint}</p>
      ) : null}
    </article>
  );
}

function KeyPoint({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="bwe-soft-tile p-4">
      <div className="flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
          {title}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/64">{copy}</p>
    </div>
  );
}

export default function Pricing() {
  const router = useRouter();
  const { user } = useAuth();

  const authUser = (user ?? null) as Record<string, unknown> | null;

  const isPremiumActive =
    authUser?.isPremium === true ||
    authUser?.currentPlan === "premium" ||
    authUser?.premiumStatus === "active";

  const premiumActivatedAt =
    typeof authUser?.premiumActivatedAt === "string"
      ? authUser.premiumActivatedAt
      : null;

  const premiumActivatedLabel = premiumActivatedAt
    ? new Date(premiumActivatedAt).toLocaleDateString()
    : null;

  const feature =
    typeof router.query.feature === "string" ? router.query.feature : "";
  const returnTo =
    typeof router.query.returnTo === "string" ? router.query.returnTo : "";
  const isRealEstateToolkitContext = feature === "real-estate-toolkit";

  const goCheckout = (plan: "premium" | "founder") => {
    if (!authUser) {
      router.push(
        `/login?next=${encodeURIComponent(`/checkout?plan=${plan}`)}`,
      );
      return;
    }

    if (plan === "premium" && isPremiumActive) return;

    router.push(`/checkout?plan=${plan}`);
  };

  const title = "Membership Pricing | Black Wealth Exchange";
  const description = truncateMeta(
    "Compare BWE membership plans, understand Black Card plan mapping, and move into secure checkout without changing the current commercial contract.",
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl("/pricing")} />
      </Head>

      <div className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 right-[-10rem] h-[460px] w-[460px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <main className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_24%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Membership pricing</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  Choose the membership that fits your current stage.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  Compare the current plans, confirm the Black Card tier each
                  one includes, and continue into secure checkout when you are
                  ready.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/black-card"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Explore Black Card
                  </Link>
                  <Link
                    href="/business-directory"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    Browse directory
                  </Link>
                  <Link
                    href="/"
                    className="bwe-open-link bwe-focus-ring text-sm text-white/82"
                  >
                    Back to home
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="bwe-badge">
                    <ShieldCheck className="h-4 w-4" />
                    Premium billed annually
                  </span>
                  <span className="bwe-badge">
                    <Users className="h-4 w-4" />
                    Founding billed monthly
                  </span>
                  <span className="bwe-badge" data-tone="accent">
                    <Sparkles className="h-4 w-4" />
                    Black Card included with paid plans
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Free
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    $0
                  </div>
                  <div className="mt-1 text-sm text-white/58">
                    Discovery and exploration
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Premium
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    $12 / year
                  </div>
                  <div className="mt-1 text-sm text-white/58">
                    Includes Standard Black Card
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Founding Member
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    $49 / month
                  </div>
                  <div className="mt-1 text-sm text-white/58">
                    Includes Signature Black Card
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Elite
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-white">
                    Invite only
                  </div>
                  <div className="mt-1 text-sm text-white/58">
                    Not self-serve checkout
                  </div>
                </div>
              </div>
            </div>

            {isRealEstateToolkitContext ? (
              <div className="relative mt-6 rounded-2xl border border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)] p-4">
                <div className="text-sm font-semibold text-[var(--accent)]">
                  Unlocking Real Estate Toolkit
                </div>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Premium includes access to real estate calculators,
                  checklists, worksheets, and planning tools.
                </p>
                {returnTo ? (
                  <Link
                    href={returnTo}
                    className="bwe-open-link bwe-focus-ring mt-3 text-[var(--accent)]"
                  >
                    Back to Real Estate Toolkit
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : null}

            {isPremiumActive ? (
              <div className="relative mt-6 rounded-2xl border border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)] p-4">
                <div className="text-sm font-semibold text-[var(--accent)]">
                  Premium Active
                </div>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Your Premium account is already active.
                  {premiumActivatedLabel
                    ? ` Active since ${premiumActivatedLabel}.`
                    : ""}
                </p>
              </div>
            ) : null}
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            <PlanCard
              title="Free"
              price="$0"
              cadence="No plan charge"
              summary="Explore core BWE experiences before moving into a paid membership."
              tier="No Black Card"
              bestFor="Discovery, browsing, and learning the platform."
              features={[
                "Search, filters, tabs, and AI Mode",
                "Marketplace browsing and public content access",
                "Core account and dashboard access",
              ]}
              ctaText="Go to homepage"
              onCta={() => router.push("/")}
              finePrint="Upgrade when you want paid-plan access and Black Card tier inclusion."
            />

            <PlanCard
              title="Premium"
              price="$12 / year"
              cadence="Billed annually • Auto-renews annually • Cancel anytime"
              summary="Premium includes the Standard Black Card and paid-plan access tied to the current system."
              tier="Standard Black Card"
              bestFor="Members who want a low-friction paid entry point."
              features={[
                "Everything in Free",
                "Standard Black Card mapping on activation",
                "Black Card rewards earn/redeem access subject to current checks",
                "Gated learning modules tied to paid-plan access",
              ]}
              ctaText="Upgrade to Premium"
              onCta={() => goCheckout("premium")}
              active={isPremiumActive}
              featured
              disabled={isPremiumActive}
              finePrint={
                isPremiumActive
                  ? "Your Premium membership is already active."
                  : "Activation maps your account to Standard Black Card."
              }
            />

            <PlanCard
              title="Founding Member"
              price="$49 / month"
              cadence="Billed monthly • Auto-renews monthly • Cancel anytime"
              summary="Founding Member includes the Signature Black Card and starts the claim and membership process."
              tier="Signature Black Card"
              bestFor="Members who want the current higher-tier membership path."
              features={[
                "Everything in Premium",
                "Black Card tier mapping under the current membership configuration",
                "Keeps higher existing tier if one is already assigned",
                "Access to founding-member releases only when marked active",
              ]}
              ctaText="Become a Founder"
              onCta={() => goCheckout("founder")}
              finePrint="Payment begins the claim and membership process. Ownership verification remains a separate manual review."
            />
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">Plan clarity</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                Understand the offer, the cost, and the Black Card mapping
                without decoding a long sales page.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
                Free stays free. Premium remains annual. Founding Member remains
                monthly. Elite remains invite-only. This page only clarifies the
                decision and the next action.
              </p>
            </div>

            <div className="bwe-soft-tile p-4 sm:p-5">
              <div className="bwe-eyebrow">What happens after checkout</div>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-white/68">
                <li>1. Complete secure checkout for the selected plan.</li>
                <li>
                  2. Payment is verified and the plan entitlement is mapped to
                  the account.
                </li>
                <li>
                  3. Black Card tier mapping follows the current membership
                  configuration.
                </li>
              </ol>
              <p className="mt-4 text-xs leading-5 text-white/46">
                If checkout is canceled or interrupted, no new entitlement is
                granted. Cancellation stops future renewals under the active
                billing cadence.
              </p>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="bwe-shell-panel rounded-[26px] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="bwe-eyebrow">Black Card mapping</div>
                  <h3 className="bwe-card-title mt-2 text-[1.15rem]">
                    Your membership plan determines your Black Card tier.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/64">
                    Premium includes Standard. Founding Member includes
                    Signature. Elite remains a high-touch invite-only tier and
                    is not self-serve checkout.
                  </p>
                </div>
                <span className="bwe-badge" data-tone="accent">
                  <BadgeCheck className="h-4 w-4" />
                  Trusted access
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4">
                <PremiumDigitalCard
                  memberName="Thomas"
                  memberId="BCM-XXXXXXX"
                  status="Active"
                  verificationId="BCV-XXXXXX"
                  isExample
                />
              </div>

              <Link
                href="/black-card"
                className="bwe-open-link bwe-focus-ring mt-4 text-[var(--accent)]"
              >
                Explore BWE Black Card
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4">
              <KeyPoint
                icon={<Lock className="h-4 w-4" />}
                title="Secure checkout"
                copy="Checkout stays on the existing secure Stripe path. This redesign does not alter billing logic, payment routing, or entitlement rules."
              />
              <KeyPoint
                icon={<Users className="h-4 w-4" />}
                title="Who it is for"
                copy="Free supports exploration. Premium supports member access. Founding Member supports the higher-tier membership path with current Signature mapping."
              />
              <KeyPoint
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Support and billing"
                copy="Need help with billing or activation? Use the existing account help and contact routes. Physical cards are not currently available."
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
