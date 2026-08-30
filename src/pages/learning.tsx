import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const PATHWAYS = [
  {
    title: "Free learning",
    copy: "Open resources and public education content you can use right away.",
    links: [
      { href: "/resources", label: "Open resources" },
      { href: "/financial-literacy", label: "Financial literacy" },
      { href: "/news", label: "News and insights" },
    ],
  },
  {
    title: "Premium learning",
    copy: "Course routes that depend on login, enrollment, or active entitlement.",
    links: [
      { href: "/course-enrollment", label: "Enrollment details" },
      { href: "/course-dashboard", label: "Course dashboard" },
      { href: "/courses", label: "Course library" },
    ],
  },
] as const;

const LEARNING_STRIPS = [
  {
    title: "Learn",
    copy: "Start with public guidance and practical learning content.",
  },
  {
    title: "Enroll",
    copy: "Move into course access through the existing enrollment and checkout path.",
  },
  {
    title: "Apply",
    copy: "Use the dashboard and module routes to keep progress moving.",
  },
] as const;

export default function LearningPage() {
  return (
    <>
      <Head>
        <title>Learning Hub | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Browse Black Wealth Exchange learning paths, including public resources, financial literacy, and premium course routes.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/learning")} />
      </Head>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-9rem] h-[440px] w-[440px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Learning hub</div>
                <h1 className="bwe-display-title mt-3 max-w-[11ch]">
                  Choose the learning path that fits your next step.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  BWE learning should feel structured and usable. Start with
                  public resources, move into enrollment where needed, and use
                  your course routes when access is active.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/financial-literacy"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Explore financial literacy
                  </Link>
                  <Link
                    href="/course-enrollment"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    Enrollment details
                  </Link>
                  <Link
                    href="/course-dashboard"
                    className="bwe-open-link bwe-focus-ring text-sm text-white/82"
                  >
                    Open dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="bwe-badge">
                    <BookOpen className="h-4 w-4" />
                    Public resources
                  </span>
                  <span className="bwe-badge">
                    <GraduationCap className="h-4 w-4" />
                    Premium courses
                  </span>
                  <span className="bwe-badge" data-tone="accent">
                    <Sparkles className="h-4 w-4" />
                    Progress-oriented next steps
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {LEARNING_STRIPS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                      {item.title}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white/88">
                      {item.copy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            {PATHWAYS.map((pathway, index) => (
              <article
                key={pathway.title}
                className={`rounded-[28px] border p-5 sm:p-6 ${
                  index === 1
                    ? "border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)]"
                    : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <div className="bwe-eyebrow">{pathway.title}</div>
                <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-white">
                  {pathway.copy}
                </h2>
                <div className="mt-5 space-y-3">
                  {pathway.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex min-h-12 items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 text-sm font-medium text-white/86 transition hover:border-[rgba(212,175,55,0.3)] hover:bg-white/[0.04]"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="bwe-soft-tile p-4">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <BookOpen className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Public learning
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                Resources, financial literacy guidance, and open education stay
                available without forcing a premium decision too early.
              </p>
            </div>
            <div className="bwe-soft-tile p-4">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Access rules
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                Premium routes still rely on the existing entitlement and
                enrollment checks. This pass improves clarity, not policy.
              </p>
            </div>
            <div className="bwe-soft-tile p-4">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <Sparkles className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Next action
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                The hub now makes it clearer where to read, where to enroll, and
                where to continue your existing course progress.
              </p>
            </div>
          </section>

          <section className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-white/[0.025] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="bwe-eyebrow">Keep moving</div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
                Go deeper into the financial-literacy course or continue into
                the course dashboard if your access is already active.
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
