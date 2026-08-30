import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";

type HubCardTone = "accent" | "neutral" | "success";

export default function JobsHubPage() {
  useEffect(() => {
    emitFlowEvent({
      eventType: "jobs_landing_viewed",
      pageRoute: "/jobs",
      section: "jobs_hub",
    });
  }, []);

  const trackJobEntry = (
    ctaId: string,
    ctaLabel: string,
    destination: string,
  ) => {
    emitFlowEvent({
      eventType: "employer_post_job_started",
      pageRoute: "/jobs",
      section: "jobs_hub",
      ctaId,
      ctaLabel,
      destination,
      entityType: "job_post",
    });
  };

  const title = "Jobs Hub | Black Wealth Exchange";
  const description = truncateMeta(
    "Professional opportunity hub for candidates, employers, internships, and structured hiring workflows on Black Wealth Exchange.",
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl("/job-listings")} />
        <meta name="robots" content="noindex,follow" />
      </Head>

      <div className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 right-[-10rem] h-[460px] w-[460px] rounded-full bg-sky-500/[0.05] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_84%_28%,rgba(90,160,255,0.12),transparent_28%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Professional opportunity</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  Find roles, hire talent, and keep the process clear.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  BWE keeps candidate discovery, employer posting, internships,
                  and structured review in one calmer opportunity hub without
                  obscuring the real job-listings flow underneath it.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/job-listings"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Browse job listings
                  </Link>
                  <Link
                    href="/post-job"
                    onClick={() =>
                      trackJobEntry(
                        "jobs_hub_post_job_hero",
                        "Post a Job",
                        "/post-job",
                      )
                    }
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    Post a job
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/42">
                    Candidate path
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/86">
                    Search live roles and continue into applications.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/42">
                    Employer path
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/86">
                    Post roles and review applicants with structured signals.
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/42">
                    Growth path
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/86">
                    Move into internships, freelance work, and mentorship lanes.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="border-t border-white/8 pt-5 text-left">
              <div className="bwe-eyebrow">How hiring works here</div>
              <h2 className="bwe-section-title mt-2 max-w-2xl">
                Structured review stays visible, but human judgment still owns
                the decision.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
                Employers can use readiness and role-match signals to help sort
                applications, then continue through real applicant review. The
                automation assists hiring decisions without pretending to
                replace them.
              </p>
            </div>

            <div className="bwe-soft-tile p-4 sm:p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Employer trust workflow
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
                <li>
                  Applications receive first-pass readiness and role-match
                  screening.
                </li>
                <li>
                  Employers see pipeline context before making a human decision.
                </li>
                <li>Manual override stays available with reason logging.</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/post-job"
                  onClick={() =>
                    trackJobEntry(
                      "jobs_hub_post_job_workflow",
                      "Start structured hiring",
                      "/post-job",
                    )
                  }
                  className="bwe-cta-primary bwe-focus-ring px-4 py-2.5 text-sm"
                >
                  Start structured hiring
                </Link>
                <Link
                  href="/employer/applicants"
                  className="bwe-open-link bwe-focus-ring text-[var(--accent)]"
                >
                  View applicant pipeline
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="bwe-eyebrow">Choose your lane</div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <LaneCard
                tone="accent"
                title="Candidate lane"
                copy="Search live roles, compare employer context, and move into applications without losing your place."
              />
              <LaneCard
                tone="neutral"
                title="Employer lane"
                copy="Publish a role, review applicants, and keep the hiring path organized around actual decisions."
              />
              <LaneCard
                tone="success"
                title="Growth lane"
                copy="Use internships, project work, and mentorship to widen access beyond one kind of role."
              />
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <HubCard
              tone="accent"
              title="Find a job"
              description="Browse current listings from Black-owned businesses and aligned employers through the main listings route."
              href="/job-listings"
              buttonLabel="Explore jobs"
              icon={<BriefcaseBusiness className="h-4 w-4" />}
            />
            <HubCard
              tone="neutral"
              title="Hire Black talent"
              description="Start the employer workflow, publish a role, and review candidates through the structured pipeline."
              href="/post-job"
              buttonLabel="Start hiring"
              icon={<Building2 className="h-4 w-4" />}
              onClick={() =>
                trackJobEntry(
                  "jobs_hub_post_job_card",
                  "Start Hiring",
                  "/post-job",
                )
              }
            />
            <HubCard
              tone="success"
              title="Internships and early career"
              description="Move into internship and early-career pathways without forcing them to compete with every other jobs action."
              href="/internships"
              buttonLabel="View internships"
              icon={<ArrowRight className="h-4 w-4" />}
            />
            <HubCard
              tone="neutral"
              title="Freelance and gig work"
              description="Browse project-based work and flexible options where independent work is a better fit than a standard role."
              href="/freelance"
              buttonLabel="Explore gigs"
              icon={<ArrowRight className="h-4 w-4" />}
            />
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="bwe-soft-tile p-4 sm:p-5">
              <div className="bwe-eyebrow">Mentorship</div>
              <h3 className="bwe-card-title mt-2">
                Keep opportunity tied to guidance.
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/64">
                Connect with experienced professionals for perspective,
                preparation, and long-term career growth beyond one application.
              </p>
              <Link
                href="/mentorship"
                className="bwe-open-link bwe-focus-ring mt-4 text-[var(--accent)]"
              >
                Explore mentorship
              </Link>
            </article>

            <article className="bwe-soft-tile p-4 sm:p-5">
              <div className="bwe-eyebrow">Profile advantage</div>
              <h3 className="bwe-card-title mt-2">
                Build your profile once and move faster across roles.
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/64">
                Create an account, keep your opportunity context organized, and
                return to listings without restarting your setup every time.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/signup"
                  className="bwe-cta-primary bwe-focus-ring px-4 py-2.5 text-sm"
                >
                  Create profile
                </Link>
                <Link
                  href="/login"
                  className="bwe-cta-secondary bwe-focus-ring px-4 py-2.5 text-sm"
                >
                  Log in
                </Link>
              </div>
            </article>
          </section>
        </div>
      </div>
    </>
  );
}

function LaneCard({
  tone,
  title,
  copy,
}: {
  tone: HubCardTone;
  title: string;
  copy: string;
}) {
  const accentClass =
    tone === "accent"
      ? "text-[var(--accent)]"
      : tone === "success"
        ? "text-emerald-200"
        : "text-white/82";

  return (
    <article className="bwe-soft-tile p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
        {title}
      </div>
      <p className={`mt-2 text-sm font-semibold leading-6 ${accentClass}`}>
        {copy}
      </p>
    </article>
  );
}

function HubCard({
  tone,
  title,
  description,
  href,
  buttonLabel,
  icon,
  onClick,
}: {
  tone: HubCardTone;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  const badgeTone =
    tone === "accent" ? "accent" : tone === "success" ? "success" : undefined;

  return (
    <article className="bwe-soft-tile p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80"
              aria-hidden="true"
            >
              {icon}
            </span>
            <h3 className="bwe-card-title">{title}</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/64">{description}</p>
        </div>
        <span className="bwe-badge" data-tone={badgeTone}>
          Hub
        </span>
      </div>

      <Link
        href={href}
        onClick={onClick}
        className="bwe-open-link bwe-focus-ring mt-4 text-[var(--accent)]"
      >
        {buttonLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
