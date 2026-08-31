import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import {
  ArrowRight,
  Headphones,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { getJwtSecret } from "@/lib/env";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { toPublicErrorMessage } from "@/lib/publicError";

type Readiness = {
  sellerExists: boolean;
  onboardingStatus?: string;
  payoutConnected?: boolean;
  payoutReady?: boolean;
  dashboardReady?: boolean;
  creatorPlanStatus?: string;
  creatorReady?: boolean;
  musicCreatorReady?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function PlanCard({
  title,
  price,
  summary,
  featured = false,
  disabled = false,
  cta,
  onClick,
  points,
}: {
  title: string;
  price: string;
  summary: string;
  featured?: boolean;
  disabled?: boolean;
  cta: string;
  onClick: () => void;
  points: string[];
}) {
  return (
    <article
      className={cx(
        "rounded-[26px] border p-5 sm:p-6",
        featured
          ? "border-[rgba(212,175,55,0.34)] bg-[rgba(212,175,55,0.08)]"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="bwe-eyebrow">{title}</div>
          <h2 className="mt-2 text-[1.6rem] font-extrabold tracking-[-0.04em] text-white sm:text-[1.9rem]">
            {price}
          </h2>
        </div>
        <span className="bwe-badge" data-tone={featured ? "accent" : undefined}>
          {featured ? "Recommended" : "Launch tier"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/68">{summary}</p>

      <ul className="mt-4 space-y-2 text-sm leading-6 text-white/68">
        {points.map((point) => (
          <li key={point}>• {point}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
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
        {cta}
        {!disabled ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
    </article>
  );
}

export default function MusicPricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");
  const [gateLoading, setGateLoading] = useState(true);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [lockedReason, setLockedReason] = useState("");

  const trackMusicPricingEvent = useCallback(
    (eventType: string, extras: Record<string, unknown> = {}) => {
      emitFlowEvent({
        eventType,
        pageRoute: "/music/pricing",
        section: "music_pricing",
        isAuthenticated: Boolean(user),
        accountType: user?.accountType || "anonymous",
        ...extras,
      });
    },
    [user],
  );

  useEffect(() => {
    if (!loading) {
      trackMusicPricingEvent("music_pricing_viewed");
    }

    (async () => {
      if (loading) return;
      if (!user) return;

      try {
        const res = await fetch("/api/marketplace/readiness", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load readiness");
        setReadiness(data);

        if (!data?.sellerExists) {
          setLockedReason(
            "No creator profile was found for this account. Start the creator join flow first.",
          );
          return;
        }

        if (data?.onboardingStatus !== "onboarded") {
          setLockedReason(
            "Creator onboarding is incomplete. Finish onboarding before plan activation.",
          );
          return;
        }

        if (!data?.payoutReady) {
          setLockedReason(
            "Payout setup is incomplete. Finish payout readiness before plan activation.",
          );
          return;
        }

        if (data?.musicCreatorReady || data?.creatorReady) {
          setLockedReason(
            "Creator access is already active for this account. Pricing is only needed for first-time activation or later plan changes.",
          );
          return;
        }
      } catch {
        setLockedReason(
          "Creator readiness could not be verified right now. Return to join to refresh the staged access path.",
        );
        return;
      } finally {
        setGateLoading(false);
      }
    })();
  }, [loading, trackMusicPricingEvent, user]);

  async function start(planId: "music-creator-starter" | "music-creator-pro") {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/music/pricing")}`);
      return;
    }

    setBusy(planId);
    setError("");

    trackMusicPricingEvent("music_plan_selected", {
      plan_tier: planId,
      billing_cycle: "monthly",
      destination: "/api/stripe/checkout",
      ctaId: `music_plan_${planId}`,
      ctaLabel:
        planId === "music-creator-pro" ? "Choose Pro" : "Choose Starter",
    });

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "plan", itemId: planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Could not start checkout");
      }
      window.location.href = data.url;
    } catch (err: any) {
      setError(
        toPublicErrorMessage(err?.message, {
          fallback: "We couldn't start checkout right now. Please try again.",
          authFallback: "Please sign in to continue checkout.",
        }),
      );
      setBusy("");
    }
  }

  const title = "Music Creator Pricing | Black Wealth Exchange";
  const description = truncateMeta(
    "Activate a BWE Music creator plan after onboarding and payout readiness are complete, using the existing gated creator-commerce flow.",
  );

  if (loading || gateLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
        <div className="bwe-section-wrap">
          <div className="bwe-soft-tile p-6 text-sm text-white/70">
            Loading music pricing…
          </div>
        </div>
      </main>
    );
  }

  if (lockedReason) {
    const creatorReady =
      readiness?.musicCreatorReady || readiness?.creatorReady;
    const actionHref = creatorReady
      ? "/creator/dashboard"
      : readiness?.sellerExists && readiness?.onboardingStatus === "onboarded"
        ? "/marketplace/become-a-seller?refresh=1"
        : "/music/join";
    const actionLabel = creatorReady
      ? "Open creator dashboard"
      : readiness?.sellerExists && readiness?.onboardingStatus === "onboarded"
        ? "Finish payout setup"
        : "Complete music join";

    return (
      <>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={canonicalUrl("/music/pricing")} />
        </Head>
        <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
          <div className="absolute inset-0 bg-neutral-950" />
          <div className="pointer-events-none absolute -top-28 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
          <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
            <section className="rounded-[30px] border border-yellow-400/25 bg-yellow-500/10 px-4 py-5 sm:px-6 sm:py-7">
              <div className="bwe-eyebrow">Plan activation locked</div>
              <h1 className="bwe-section-title mt-2 max-w-xl">
                Pricing unlocks only after the current creator readiness rules
                are met.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/74">
                {lockedReason}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                {creatorReady
                  ? "This account already has creator access. Use the dashboard instead of re-entering plan activation."
                  : "Return to the staged join flow, complete the missing readiness step, then come back here."}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={actionHref}
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  {actionLabel}
                </Link>
                <Link
                  href="/music"
                  className="bwe-open-link bwe-focus-ring text-sm text-white/82"
                >
                  Back to music
                </Link>
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl("/music/pricing")} />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-9rem] h-[440px] w-[440px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_24%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Music creator pricing</div>
                <h1 className="bwe-display-title mt-3 max-w-[11ch]">
                  Activate creator commerce after readiness is complete.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  This is the activation step, not the starting point.
                  Onboarding and payouts are already verified, so now the
                  creator can choose the plan that matches the current launch
                  stage.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="bwe-badge" data-tone="accent">
                    <ShieldCheck className="h-4 w-4" />
                    Readiness verified
                  </span>
                  <span className="bwe-badge">
                    <Headphones className="h-4 w-4" />
                    Monthly creator plans
                  </span>
                  <span className="bwe-badge">
                    <Lock className="h-4 w-4" />
                    Existing checkout path preserved
                  </span>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Activation step
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Onboarding and payouts are complete. Plan selection is now
                  unlocked.
                </div>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  After checkout, the existing creator entitlement path is
                  responsible for unlocking creator-ready access.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">Plan clarity</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                Choose the plan that matches the current launch stage.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
                The pricing model is unchanged. This surface now makes the
                difference between starter and higher-visibility creator access
                easier to compare before entering checkout.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Starter
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  $29 / month
                </div>
              </div>
              <div className="rounded-2xl border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Pro
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  $79 / month
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Path
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  checkout then creator-ready state
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <PlanCard
              title="Starter"
              price="$29 / month"
              summary="For new artists preparing early releases and wanting a cleaner path into creator commerce."
              cta={
                busy === "music-creator-starter"
                  ? "Redirecting…"
                  : "Choose Starter"
              }
              disabled={busy === "music-creator-starter"}
              onClick={() => start("music-creator-starter")}
              points={[
                "Launch-stage creator access",
                "Monthly entry plan",
                "Uses the current checkout path",
              ]}
            />
            <PlanCard
              title="Pro"
              price="$79 / month"
              summary="For creators who need stronger visibility and a more advanced creator-tooling tier."
              featured
              cta={busy === "music-creator-pro" ? "Redirecting…" : "Choose Pro"}
              disabled={busy === "music-creator-pro"}
              onClick={() => start("music-creator-pro")}
              points={[
                "Higher-visibility creator tier",
                "Advanced tooling orientation",
                "Uses the current checkout path",
              ]}
            />
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="bwe-soft-tile p-4">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Access behavior
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                Pricing remains available only after onboarding and payouts are
                complete. This preserves the current gated creator flow.
              </p>
            </div>
            <div className="bwe-soft-tile p-4">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <Sparkles className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  After checkout
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                The existing entitlement path is responsible for unlocking
                creator-ready access after a successful plan purchase.
              </p>
            </div>
            <div className="bwe-soft-tile p-4">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <Lock className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Preserved truth
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                No pricing, plan IDs, Stripe route, or activation sequence was
                changed in this Experience 2.0 pass.
              </p>
            </div>
          </section>

          <section className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-white/[0.025] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="bwe-eyebrow">Need to review readiness?</div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                Go back to the creator join flow if you need to confirm
                onboarding or payout status before selecting a plan.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/music/join"
                className="bwe-cta-secondary bwe-focus-ring px-5"
              >
                Review creator join
              </Link>
              <Link
                href="/music"
                className="bwe-open-link bwe-focus-ring text-sm text-white/82"
              >
                Back to music
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  resolvedUrl,
}) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl || "/music/pricing")}`,
        permanent: false,
      },
    };
  }

  try {
    jwt.verify(token, getJwtSecret());
  } catch {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(resolvedUrl || "/music/pricing")}`,
        permanent: false,
      },
    };
  }

  return { props: {} };
};
