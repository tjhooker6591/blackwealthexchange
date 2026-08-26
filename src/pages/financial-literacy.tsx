import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

type MeUser = {
  _id?: string;
  id?: string;
  email?: string;
  accountType?: string;
};

const ITEM_ID = "financial-literacy-premium";

const COURSE_MODULES = [
  {
    title: "Breaking Financial Myths",
    text: "Build a money mindset designed for legacy, not survival.",
    bullets: [
      "Your money story and scarcity patterns",
      "The real math behind getting ahead",
      "How wealth is built through time, systems, and ownership",
    ],
  },
  {
    title: "Budgeting for Real Life",
    text: "Use a simple system that works even when income is uneven.",
    bullets: [
      "Zero-based and priority budgeting",
      "Emergency fund planning",
      "Spending categories that protect your future",
    ],
  },
  {
    title: "Credit Repair and Power",
    text: "Improve your score with a clear step-by-step process.",
    bullets: [
      "What affects your score and what does not",
      "Dispute letters and tracking",
      "Building positive credit without new traps",
    ],
  },
  {
    title: "Building Wealth with Investments",
    text: "Learn the basics of investing, real estate, and passive income.",
    bullets: [
      "Key investing terms in plain English",
      "How to avoid common mistakes and scams",
      "Matching a plan to your risk level",
    ],
  },
  {
    title: "Side Hustles and Business Basics",
    text: "Turn skills into income with a cleaner business foundation.",
    bullets: [
      "Choosing a profitable offer",
      "Pricing and packaging",
      "Business setup basics",
    ],
  },
  {
    title: "Debt Management and Elimination",
    text: "Reduce debt while still protecting savings and credit health.",
    bullets: [
      "Snowball and avalanche methods",
      "Negotiating rates and payment plans",
      "Avoiding the re-debt cycle",
    ],
  },
  {
    title: "Retirement Planning",
    text: "Build long-term security whether you are starting early or restarting.",
    bullets: [
      "401(k), IRA, and Roth IRA basics",
      "Catch-up strategies",
      "A durable long-term plan",
    ],
  },
  {
    title: "Legacy and Asset Protection",
    text: "Learn the basics of protecting assets for your family.",
    bullets: [
      "Wills versus trusts",
      "Beneficiaries and probate mistakes",
      "A practical legacy planning checklist",
    ],
  },
] as const;

const COURSE_BONUSES = [
  "Downloadable worksheets and checklists",
  "Credit repair letter pack",
  "Investment starter guide",
  "Optional certificate of completion",
] as const;

const COURSE_FAQS = [
  {
    q: "Is this course beginner-friendly?",
    a: "Yes. It is designed for people starting from scratch and for people who want a cleaner structure for what they already know.",
  },
  {
    q: "How can access be activated?",
    a: "Existing system access can come through an eligible premium entitlement or a direct course entitlement after verified checkout.",
  },
  {
    q: "What happens after payment?",
    a: "The existing course access flow verifies checkout, grants the entitlement, and then unlocks the course dashboard or modules for the user.",
  },
  {
    q: "Do I need an account?",
    a: "You can browse the overview without an account, but checkout and dashboard access work best when the purchase is linked to your profile.",
  },
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function InfoTile({
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
      className={cx(
        "rounded-2xl border px-4 py-4",
        tone === "accent"
          ? "border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)]"
          : "border-white/8 bg-white/[0.03]",
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/66">{copy}</p>
    </div>
  );
}

function DetailBox({
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

export default function FinancialLiteracy() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [meChecked, setMeChecked] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [ctaState, setCtaState] = useState<
    "idle" | "loading" | "redirect-login" | "redirect-checkout" | "failed"
  >("idle");
  const [ctaError, setCtaError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          setMeChecked(true);
          return;
        }
        const data = await res.json().catch(() => null);
        setUser(data?.user || null);
      } catch {
        // ignore
      } finally {
        setMeChecked(true);
      }
    })();
  }, []);

  const userId = String(user?._id || user?.id || "").trim();

  const startCourseCheckout = async () => {
    setCtaError("");
    if (!userId) {
      setCtaState("redirect-login");
      void router.push(
        `/login?next=${encodeURIComponent("/financial-literacy")}`,
      );
      return;
    }

    setCtaState("loading");
    setQuickLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "course", itemId: ITEM_ID }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        setCtaState("redirect-checkout");
        window.location.assign(data.url);
        return;
      }

      setCtaState("failed");
      setCtaError(
        data?.message || data?.error || "Unable to start checkout session.",
      );
    } catch {
      setCtaState("failed");
      setCtaError("Something went wrong while starting checkout.");
    } finally {
      setQuickLoading(false);
    }
  };

  const title = "Black Financial Literacy Course | Black Wealth Exchange";
  const description = truncateMeta(
    "Build practical money skills with Black Wealth Exchange financial literacy training, clear module discovery, and direct next-step access into enrollment or checkout.",
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl("/financial-literacy")} />
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
                <div className="bwe-eyebrow">Financial literacy</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  Learn the money systems that support long-term wealth.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  This course focuses on practical progress: budgeting, credit,
                  investing, debt reduction, business fundamentals, and legacy
                  planning in one guided learning path.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={startCourseCheckout}
                    disabled={quickLoading}
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    {quickLoading ? "Redirecting…" : "Start secure checkout"}
                  </button>
                  <Link
                    href="/course-enrollment"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    View enrollment details
                  </Link>
                  <a
                    href="#modules"
                    className="bwe-open-link bwe-focus-ring text-sm text-white/82"
                  >
                    Review modules
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="bwe-badge">
                    <BookOpen className="h-4 w-4" />8 modules
                  </span>
                  <span className="bwe-badge">
                    <BadgeCheck className="h-4 w-4" />
                    Worksheets and guides
                  </span>
                  <span className="bwe-badge" data-tone="accent">
                    <Sparkles className="h-4 w-4" />
                    Direct and premium-linked access
                  </span>
                </div>

                {router.query.locked ? (
                  <div className="mt-6 rounded-2xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    Premium course modules are locked until entitlement is
                    active. Continue through enrollment, then return to the
                    modules.
                    <div className="mt-3">
                      <Link
                        href="/course-enrollment"
                        className="bwe-open-link bwe-focus-ring text-[var(--accent)]"
                      >
                        Go to enrollment
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 sm:col-span-2">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Access clarity
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    Existing access can come through an eligible premium
                    entitlement or a direct course entitlement after verified
                    checkout.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Direct checkout
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/88">
                    $49 course access
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Best next step
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/88">
                    review enrollment or begin checkout
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">What you learn</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                A practical curriculum from stability to long-term ownership.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
                The course is structured to help learners stabilize cash flow,
                improve decision-making, and build a stronger base for wealth
                over time.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <InfoTile
                title="Stabilize"
                copy="Budget, manage debt, and reduce financial chaos first."
              />
              <InfoTile
                title="Build"
                copy="Improve credit, save with discipline, and understand investing."
                tone="accent"
              />
              <InfoTile
                title="Protect"
                copy="Use business and legacy planning to support durable outcomes."
              />
            </div>
          </section>

          <section id="modules" className="mt-8">
            <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="bwe-eyebrow">Course modules</div>
                <h2 className="bwe-section-title mt-2">
                  Review the learning path before checkout.
                </h2>
              </div>
              <Link
                href="/course-dashboard"
                className="bwe-open-link bwe-focus-ring text-sm text-white/82"
              >
                Open course dashboard
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {COURSE_MODULES.map((module, index) => (
                <article
                  key={module.title}
                  className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                    Module {index + 1}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/66">
                    {module.text}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-white/64">
                    {module.bullets.map((bullet) => (
                      <li key={bullet}>• {bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
            <div className="rounded-[28px] border border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.07)] p-5 sm:p-6">
              <div className="bwe-eyebrow">Enrollment path</div>
              <h2 className="bwe-section-title mt-2 max-w-xl">
                Keep the next step clear: account, checkout, then access.
              </h2>
              <div className="mt-5 space-y-3 text-sm leading-6 text-white/68">
                <p>
                  1. Browse the course overview and decide whether to continue.
                </p>
                <p>
                  2. Log in if needed so access can be linked to your account.
                </p>
                <p>
                  3. Complete checkout through the existing secure payment path.
                </p>
                <p>
                  4. Return to the course dashboard once entitlement is active.
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/course-enrollment"
                  className="bwe-cta-secondary bwe-focus-ring px-6"
                >
                  Enrollment details
                </Link>
                <button
                  type="button"
                  onClick={startCourseCheckout}
                  disabled={quickLoading}
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  {quickLoading ? "Redirecting…" : "Checkout now"}
                </button>
              </div>
              {ctaError ? (
                <p className="mt-4 text-sm text-red-300">{ctaError}</p>
              ) : null}
              <p className="mt-4 text-xs text-white/46">
                {ctaState === "idle" && "Secure checkout is available."}
                {ctaState === "loading" && "Starting secure checkout."}
                {ctaState === "redirect-login" && "Redirecting to login."}
                {ctaState === "redirect-checkout" &&
                  "Redirecting to secure checkout."}
                {ctaState === "failed" && "Checkout could not be started."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBox
                icon={<ShieldCheck className="h-4 w-4" />}
                title="What is preserved"
                copy="Existing course routes, entitlement checks, and checkout contracts stay intact in this Experience 2.0 pass."
              />
              <DetailBox
                icon={<Lock className="h-4 w-4" />}
                title="Account state"
                copy={
                  meChecked && !userId
                    ? "You can browse now and log in before checkout to link access to your profile."
                    : "Your account can continue through checkout or enrollment details using the current route contracts."
                }
              />
              <div className="sm:col-span-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                  Included resources
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {COURSE_BONUSES.map((bonus) => (
                    <div
                      key={bonus}
                      className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/68"
                    >
                      {bonus}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">FAQ</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                Common questions before you continue.
              </h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {COURSE_FAQS.map((faq) => (
                <article
                  key={faq.q}
                  className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5"
                >
                  <h3 className="text-base font-semibold text-white">
                    {faq.q}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/66">
                    {faq.a}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-white/[0.025] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="bwe-eyebrow">Continue learning</div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                Open the broader learning hub for free resources, premium course
                routes, and next-step learning destinations.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/learning"
                className="bwe-cta-secondary bwe-focus-ring px-5"
              >
                Open learning hub
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
