import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, Headphones, Mic2, Sparkles } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

function FeatureRail({
  title,
  copy,
  tone = "default",
}: {
  title: string;
  copy: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        tone === "accent"
          ? "border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)]"
          : "border-white/8 bg-white/[0.03]"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/68">{copy}</p>
    </div>
  );
}

export default function MusicLandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const nextStepLabel = user
    ? "Continue creator setup"
    : "Log in to begin creator setup";

  const title = "BWE Music | Black Wealth Exchange";
  const description = truncateMeta(
    "Discover the BWE Music experience, understand the creator path, and move into onboarding or plan activation without changing the current creator-commerce contract.",
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl("/music")} />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-9rem] h-[440px] w-[440px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_24%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Music and creator commerce</div>
                <h1 className="bwe-display-title mt-3 max-w-[11ch]">
                  Discover culture and launch creator commerce with clarity.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  BWE Music gives listeners a trusted entry point and gives
                  creators a clean path into onboarding, payouts, and plan
                  activation when they are ready to launch.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => router.push("/black-entertainment-news")}
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Explore music culture
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        user ? "/music/join" : "/login?redirect=/music/join",
                      )
                    }
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    {nextStepLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        user
                          ? "/music/pricing"
                          : "/login?redirect=/music/pricing",
                      )
                    }
                    className="bwe-open-link bwe-focus-ring text-sm text-white/82"
                  >
                    View creator plans
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="bwe-badge">
                    <Headphones className="h-4 w-4" />
                    Listen and discover
                  </span>
                  <span className="bwe-badge">
                    <Mic2 className="h-4 w-4" />
                    Creator onboarding
                  </span>
                  <span className="bwe-badge" data-tone="accent">
                    <Sparkles className="h-4 w-4" />
                    Plan activation after readiness
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Creator path
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    Join, connect payouts, activate a plan, then unlock creator
                    tools.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Audience
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/88">
                    listeners and creators
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Current state
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/88">
                    onboarding and pricing live
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">How it works</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                A focused path from discovery into creator readiness.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
                BWE Music is not a separate maze of features. It gives fans a
                clear entry point and gives creators a staged path into launch
                readiness without skipping onboarding or payout setup.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <FeatureRail
                title="1. Discover"
                copy="Start with music and entertainment discovery before moving into creator tools."
              />
              <FeatureRail
                title="2. Prepare"
                copy="Complete creator profile and payout readiness through the existing guided flow."
                tone="accent"
              />
              <FeatureRail
                title="3. Activate"
                copy="Choose a creator plan only after readiness is confirmed."
              />
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <FeatureRail
              title="Creator onboarding"
              copy="Artist identity, creator details, and launch basics are collected before activation so the creator path stays trusted."
            />
            <FeatureRail
              title="Payout readiness"
              copy="Publishing and paid activation remain gated behind payout setup instead of pretending the account is launch-ready too early."
            />
            <FeatureRail
              title="Plan clarity"
              copy="Creator plans stay tied to the current pricing model and checkout path. This refresh improves clarity, not economics."
            />
          </section>

          <section className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-white/[0.025] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="bwe-eyebrow">Next step</div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                Continue into onboarding if you are building as a creator, or
                browse music culture if you are here to discover.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/music/join"
                className="bwe-cta-secondary bwe-focus-ring px-5"
              >
                Open creator join
              </Link>
              <Link
                href="/"
                className="bwe-open-link bwe-focus-ring text-sm text-white/82"
              >
                Back to home
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
