import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { ArrowRight, BadgeCheck, BookOpen, PlayCircle } from "lucide-react";
import { resolvePremiumCourseAccess } from "@/lib/entitlements/courseAccess";
import { verifyAndGrantCourseSession } from "@/lib/db/courses";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const COURSE_MODULES = [
  "Breaking Financial Myths",
  "Budgeting for Real Life",
  "Credit Repair and Power",
  "Building Wealth with Investments",
  "Side Hustles and Business Basics",
  "Debt Management and Elimination",
  "Retirement Planning",
  "Legacy and Asset Protection",
] as const;

type AccessState = {
  loading: boolean;
  allowed: boolean;
  message: string;
};

export default function CourseDashboard() {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [access, setAccess] = useState<AccessState>({
    loading: true,
    allowed: false,
    message: "",
  });
  const router = useRouter();

  useEffect(() => {
    const savedModules = JSON.parse(
      localStorage.getItem("completedModules") || "[]",
    );
    setCompletedModules(savedModules);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const sessionId =
      typeof router.query.session_id === "string"
        ? router.query.session_id
        : "";

    (async () => {
      try {
        const res = await fetch("/api/courses/access", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));

        if (!data?.authenticated) {
          router.replace(
            `/login?next=${encodeURIComponent("/course-dashboard")}`,
          );
          return;
        }

        if (!data?.hasAccess && sessionId) {
          // P0 course fulfillment fix (2026-09-07): a buyer can land here
          // immediately after Stripe checkout before the webhook has
          // processed (or, previously, when it never did). Re-verify the
          // exact session directly against Stripe before showing "locked"
          // -- this is the same grantCourseAccess() path the webhook uses,
          // just triggered from the success redirect instead of relying on
          // the webhook alone.
          setAccess({
            loading: true,
            allowed: false,
            message: "Confirming your payment...",
          });
          try {
            const verifyRes = await fetch(
              `/api/courses/verify-session?session_id=${encodeURIComponent(sessionId)}`,
              { cache: "no-store", credentials: "include" },
            );
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (verifyData?.paid) {
              const recheck = await fetch("/api/courses/access", {
                cache: "no-store",
                credentials: "include",
              });
              const recheckData = await recheck.json().catch(() => ({}));
              if (recheckData?.hasAccess) {
                setAccess({ loading: false, allowed: true, message: "" });
                return;
              }
            }
          } catch {
            // fall through to the standard not-yet-active message below
          }
        }

        if (!data?.hasAccess) {
          setAccess({
            loading: false,
            allowed: false,
            message: sessionId
              ? "We could not confirm this payment yet. If you were just charged, this can take a minute -- refresh this page, or contact support with your payment confirmation if it persists."
              : "Premium course access is not active yet. Complete enrollment to continue.",
          });
          return;
        }

        setAccess({ loading: false, allowed: true, message: "" });
      } catch {
        setAccess({
          loading: false,
          allowed: false,
          message: "Unable to verify premium course access right now.",
        });
      }
    })();
  }, [router, router.isReady, router.query.session_id]);

  const justPurchased =
    typeof router.query.session_id === "string" && !!router.query.session_id;

  const progress = (completedModules.length / COURSE_MODULES.length) * 100;

  const handleModuleClick = (moduleId: string) => {
    router.push(`/premium-finance/module-${moduleId}`);
  };

  const title = "Course Dashboard | Black Wealth Exchange";
  const description = truncateMeta(
    "Track progress, continue modules, and move through the BWE premium finance course dashboard.",
  );

  if (access.loading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
        <div className="bwe-section-wrap">
          <div className="bwe-soft-tile p-6 text-sm text-white/70">
            Loading course dashboard…
          </div>
        </div>
      </main>
    );
  }

  if (!access.allowed) {
    return (
      <>
        <Head>
          <title>{title}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={canonicalUrl("/course-dashboard")} />
        </Head>
        <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
          <div className="absolute inset-0 bg-neutral-950" />
          <div className="pointer-events-none absolute -top-28 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
          <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
            <section className="rounded-[30px] border border-yellow-400/25 bg-yellow-500/10 px-4 py-5 sm:px-6 sm:py-7">
              <div className="bwe-eyebrow">Course locked</div>
              <h1 className="bwe-section-title mt-2 max-w-xl">
                Dashboard access stays locked until course entitlement is
                active.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/74">
                {access.message}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/financial-literacy"
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  Course overview
                </Link>
                <Link
                  href="/course-enrollment"
                  className="bwe-cta-secondary bwe-focus-ring px-6"
                >
                  Enrollment details
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
        <link rel="canonical" href={canonicalUrl("/course-dashboard")} />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-9rem] h-[440px] w-[440px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          {justPurchased ? (
            <section className="mb-6 rounded-[26px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 sm:px-6 sm:py-5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
                Payment successful
              </div>
              <p className="mt-1 text-sm leading-6 text-white/85">
                Your course is ready. Start with the first module below, or come
                back to this dashboard any time to continue where you left off.
              </p>
            </section>
          ) : null}
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Course dashboard</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  Continue your learning with a clearer progress view.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  Use the dashboard to track what is complete, reopen modules,
                  and keep the next lesson obvious without extra friction.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="bwe-badge" data-tone="accent">
                    <BadgeCheck className="h-4 w-4" />
                    Access verified
                  </span>
                  <span className="bwe-badge">
                    <BookOpen className="h-4 w-4" />
                    {COURSE_MODULES.length} modules
                  </span>
                  <span className="bwe-badge">
                    <PlayCircle className="h-4 w-4" />
                    Continue where you left off
                  </span>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Progress
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {Math.round(progress)}%
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-[var(--accent)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  {completedModules.length} of {COURSE_MODULES.length} modules
                  marked complete on this device.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">Course rhythm</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                Review progress, then move directly into the next module.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
                The dashboard now makes the course feel more like a real
                learning environment and less like a flat link list, while
                preserving the current module routes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Locked logic
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  preserved
                </div>
              </div>
              <div className="rounded-2xl border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Progress source
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  local completedModules
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Next action
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  open the next module
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4">
            {COURSE_MODULES.map((title, index) => {
              const moduleId = String(index + 1);
              const done = completedModules.includes(moduleId);

              return (
                <article
                  key={moduleId}
                  className="grid gap-4 rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                      Module {moduleId}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/64">
                      {done
                        ? "Progress has already been recorded for this module on the current device."
                        : "Open this module to begin or continue the lesson path."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleModuleClick(moduleId)}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
                      done
                        ? "bg-[var(--accent)] text-black hover:bg-[var(--accent-strong)]"
                        : "border border-white/14 bg-white/[0.04] text-white hover:border-[rgba(212,175,55,0.35)] hover:bg-white/[0.08]"
                    }`}
                  >
                    {done ? "Continue" : "Start"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </section>

          <section className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-white/[0.025] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="bwe-eyebrow">Need enrollment details?</div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                Return to enrollment if you need to review access state,
                purchase details, or premium entitlement information.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/course-enrollment"
                className="bwe-cta-secondary bwe-focus-ring px-5"
              >
                Enrollment details
              </Link>
              <Link
                href="/learning"
                className="bwe-open-link bwe-focus-ring text-sm text-white/82"
              >
                Learning hub
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const access = await resolvePremiumCourseAccess(ctx.req as any);

  if (!access.authenticated) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl || "/course-dashboard")}`,
        permanent: false,
      },
    };
  }

  if (!access.hasAccess) {
    // P0 course fulfillment fix (2026-09-07): this SSR gate used to redirect
    // straight back to the marketing page whenever access wasn't active yet,
    // which fired for every course buyer landing here right after Stripe
    // checkout -- before the webhook had a chance to process -- bouncing a
    // paying customer off their own success page. If a session_id is
    // present, re-verify it directly against Stripe (same fallback the
    // client-side effect uses) before deciding to redirect away.
    const sessionId =
      typeof ctx.query.session_id === "string" ? ctx.query.session_id : "";
    if (sessionId) {
      const verified = await verifyAndGrantCourseSession(sessionId);
      if (verified.paid) {
        const rechecked = await resolvePremiumCourseAccess(ctx.req as any);
        if (rechecked.hasAccess) {
          return { props: {} };
        }
      }
    }

    return {
      redirect: {
        destination: "/financial-literacy?locked=course-dashboard",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
