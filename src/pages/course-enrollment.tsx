import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const COURSE_DATA = {
  slug: "personal-finance-101",
  name: "Personal Finance 101",
  price: 29,
  modules: [
    "Breaking Financial Myths",
    "Budgeting for Real Life",
    "Credit Repair and Power",
    "Building Wealth with Investments",
    "Side Hustles and Business Basics",
    "Debt Management and Elimination",
    "Retirement Planning",
    "Legacy and Asset Protection",
  ],
} as const;

type AccessState = {
  loading: boolean;
  isLoggedIn: boolean;
  hasAccess: boolean;
  reason: string;
  statusMessage: string;
  nextAction: string;
};

export default function CourseEnrollmentPage() {
  const [state, setState] = useState<AccessState>({
    loading: true,
    isLoggedIn: false,
    hasAccess: false,
    reason: "",
    statusMessage: "",
    nextAction: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const router = useRouter();

  async function loadAccessState() {
    try {
      const meRes = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      if (!meRes.ok) {
        setState({
          loading: false,
          isLoggedIn: false,
          hasAccess: false,
          reason: "login_required",
          statusMessage: "Access is locked because you are not logged in.",
          nextAction: "Log in or create an account to continue enrollment.",
        });
        return;
      }

      const accessRes = await fetch("/api/courses/access", {
        cache: "no-store",
        credentials: "include",
      });
      const accessData = await accessRes.json().catch(() => ({}));
      const hasAccess = Boolean(accessData?.hasAccess);
      const reason = String(accessData?.reason || "");

      const reasonMessageMap: Record<string, string> = {
        premium_active: "Access is already active through your premium plan.",
        user_purchased_courses:
          "Access is already active from your purchased course entitlement.",
        enrollment_granted:
          "Access is already active from your enrollment grant.",
        no_entitlement:
          "Access is locked until premium entitlement or course enrollment is active.",
        user_not_found:
          "Access is locked because your account record could not be found.",
      };

      setState({
        loading: false,
        isLoggedIn: true,
        hasAccess,
        reason,
        statusMessage: hasAccess
          ? reasonMessageMap[reason] ||
            "Access is active. Continue into the course dashboard."
          : reasonMessageMap[reason] ||
            "Access is locked until enrollment is completed.",
        nextAction: hasAccess
          ? "Open the course dashboard and continue your next lesson."
          : "Complete checkout to activate entitlement and unlock modules.",
      });
    } catch {
      setState({
        loading: false,
        isLoggedIn: false,
        hasAccess: false,
        reason: "access_check_failed",
        statusMessage: "We could not verify course access right now.",
        nextAction: "Retry, then log in and continue enrollment.",
      });
    }
  }

  useEffect(() => {
    (async () => {
      const sessionId =
        typeof router.query.session_id === "string"
          ? router.query.session_id
          : "";

      if (sessionId) {
        await fetch(
          `/api/courses/verify-session?session_id=${encodeURIComponent(sessionId)}`,
          {
            credentials: "include",
          },
        ).catch(() => null);

        router.replace("/course-enrollment", undefined, { shallow: true });
      }

      await loadAccessState();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.session_id]);

  const handlePurchase = async () => {
    setCheckoutError("");
    setIsProcessing(true);
    try {
      const response = await fetch("/api/courses/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseSlug: COURSE_DATA.slug }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || "Unable to start checkout session.");
      }
    } catch {
      setCheckoutError("Something went wrong with checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  const title = "Course Enrollment | Black Wealth Exchange";
  const description = truncateMeta(
    "Review access status, enrollment steps, and direct purchase details for the BWE premium finance course.",
  );

  if (state.loading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
        <div className="bwe-section-wrap">
          <div className="bwe-soft-tile p-6 text-sm text-white/70">
            Loading enrollment…
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl("/course-enrollment")} />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-9rem] h-[440px] w-[440px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Course enrollment</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  Confirm access, then move into the right enrollment step.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  This page explains whether access is already active, what is
                  blocking entry, and what action to take next.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className="bwe-badge"
                    data-tone={state.hasAccess ? "accent" : undefined}
                  >
                    <BadgeCheck className="h-4 w-4" />
                    {state.hasAccess ? "Access active" : "Access locked"}
                  </span>
                  <span className="bwe-badge">
                    <ShieldCheck className="h-4 w-4" />
                    One-time enrollment path
                  </span>
                  <span className="bwe-badge">
                    <Lock className="h-4 w-4" />
                    Premium-linked entitlement supported
                  </span>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Current status
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {state.statusMessage}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  Next action: {state.nextAction}
                </p>
                <p className="mt-3 text-xs text-white/46">
                  Reason code: {state.reason || "n/a"}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">What this route does</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                Enrollment explains state before you pay or continue.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
                This route is meant to remove guesswork. It shows the existing
                reason for your access state and gives you the next safe step
                into login, checkout, or the course dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Course
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  {COURSE_DATA.name}
                </div>
              </div>
              <div className="rounded-2xl border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Direct enrollment
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  ${COURSE_DATA.price} one-time
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Outcome
                </div>
                <div className="mt-1 text-sm font-semibold text-white/88">
                  dashboard access after entitlement
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <article className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="bwe-eyebrow">What you unlock</div>
              <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-white">
                Eight modules with practical progression.
              </h2>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-white/66 sm:grid-cols-2">
                {COURSE_DATA.modules.map((moduleTitle, index) => (
                  <li
                    key={moduleTitle}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                  >
                    {index + 1}. {moduleTitle}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[28px] border border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.07)] p-5 sm:p-6">
              <div className="bwe-eyebrow">Next step</div>
              <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-white">
                Continue based on your current access state.
              </h2>

              {!state.isLoggedIn ? (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/signup"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Sign up to enroll
                  </Link>
                  <Link
                    href={`/login?next=${encodeURIComponent("/course-enrollment")}`}
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    Log in to continue
                  </Link>
                </div>
              ) : state.hasAccess ? (
                <div className="mt-5">
                  <Link
                    href="/course-dashboard"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Open course dashboard
                  </Link>
                </div>
              ) : (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    {isProcessing
                      ? "Redirecting to payment…"
                      : `Buy and enroll for $${COURSE_DATA.price}`}
                  </button>
                </div>
              )}

              {checkoutError ? (
                <p className="mt-4 text-sm text-red-300">{checkoutError}</p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/68">
                  Secure checkout remains on the existing course purchase path.
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/68">
                  Verified access returns you to the dashboard rather than
                  leaving you on a dead-end status page.
                </div>
              </div>
            </article>
          </section>

          <section className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-white/[0.025] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="bwe-eyebrow">Need the overview first?</div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                Return to the financial-literacy overview if you want to review
                the course structure before completing enrollment.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/financial-literacy"
                className="bwe-cta-secondary bwe-focus-ring px-5"
              >
                Course overview
              </Link>
              <Link
                href="/learning"
                className="bwe-open-link bwe-focus-ring text-sm text-white/82"
              >
                Learning hub
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
