// src/pages/jobs.tsx
import Link from "next/link";
import Head from "next/head";
import { useEffect } from "react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";

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
    "Jobs navigation hub for candidates and employers. For indexable job listings, use the main Job Listings page.",
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl("/job-listings")} />
        <meta name="robots" content="noindex,follow" />
      </Head>
      <div className="min-h-screen bg-gray-950 px-6 py-10 text-white">
        <div className="pointer-events-none fixed inset-0 opacity-40">
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-yellow-500/20 blur-3xl" />
          <div className="absolute right-[-120px] top-24 h-[420px] w-[420px] rounded-full bg-yellow-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl space-y-8 rounded-2xl border border-gray-800 bg-gray-900/70 p-8 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Jobs & Careers <span className="text-yellow-400">Hub</span>
              </h1>
              <p className="mt-2 max-w-2xl text-gray-300">
                Find opportunities or hire through a structured candidate review
                workflow with automated role-match checks, readiness indicators,
                and human hiring decisions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/job-listings"
                className="rounded bg-yellow-400 px-4 py-2 font-semibold text-black transition hover:bg-yellow-300"
              >
                Browse Jobs
              </Link>
              <Link
                href="/post-job"
                onClick={() =>
                  trackJobEntry(
                    "jobs_hub_post_job_header",
                    "Post a Job",
                    "/post-job",
                  )
                }
                className="rounded border border-gray-700 px-4 py-2 text-gray-100 transition hover:bg-gray-900"
              >
                Post a Job
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-emerald-300">
              Employer Trust Workflow
            </div>
            <div className="mt-1 text-lg font-bold">
              Structured review, not hype
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-200 space-y-1">
              <li>
                Applications get first-pass screening for readiness and
                role-match signals.
              </li>
              <li>
                Employers see quality status, match band, and screening summary
                in the applicant pipeline.
              </li>
              <li>
                Automated screening assists review, it does not replace hiring
                judgment.
              </li>
              <li>Manual override remains available with reason logging.</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/post-job"
                onClick={() =>
                  trackJobEntry(
                    "jobs_hub_post_job_trust",
                    "Post a Job (Trust block)",
                    "/post-job",
                  )
                }
                className="rounded bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-black hover:bg-emerald-300"
              >
                Start structured hiring
              </Link>
              <Link
                href="/employer/applicants"
                className="rounded border border-emerald-300/40 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/10"
              >
                View applicant pipeline
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-yellow-300">
                Candidate Lane
              </div>
              <div className="mt-1 text-lg font-bold">Find your next role</div>
              <div className="mt-1 text-sm text-gray-200">
                Search open roles and apply with a profile that travels with
                you.
              </div>
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-blue-300">
                Employer Lane
              </div>
              <div className="mt-1 text-lg font-bold">Hire with confidence</div>
              <div className="mt-1 text-sm text-gray-200">
                Publish jobs and review applicants from a focused talent
                pipeline.
              </div>
            </div>
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-purple-300">
                Growth Lane
              </div>
              <div className="mt-1 text-lg font-bold">Expand your options</div>
              <div className="mt-1 text-sm text-gray-200">
                Explore internships, freelance work, and mentorship pathways.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <HubCard
              title="Find a Job"
              description="Browse active roles from Black-owned businesses and inclusive employers."
              href="/job-listings"
              buttonLabel="Explore Jobs"
              variant="gold"
            />

            <HubCard
              title="Hire Black Talent"
              description="Post a role and start reviewing candidates through the employer workflow."
              href="/post-job"
              buttonLabel="Start Hiring"
              variant="blue"
              onClick={() =>
                trackJobEntry(
                  "jobs_hub_post_job_card",
                  "Start Hiring",
                  "/post-job",
                )
              }
            />

            <HubCard
              title="Internship Opportunities"
              description="Access internship listings and early-career opportunities in one focused lane."
              href="/internships"
              buttonLabel="View Internships"
              variant="green"
            />

            <HubCard
              title="Freelance & Gig Work"
              description="Find flexible project-based opportunities and independent work options."
              href="/freelance"
              buttonLabel="Explore Gigs"
              variant="red"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-800 bg-black/40 p-6">
              <h2 className="text-xl font-bold text-yellow-400">Mentorship</h2>
              <p className="mt-2 text-sm text-gray-300">
                Connect with experienced professionals for guidance, strategy,
                and long-term growth.
              </p>
              <Link
                href="/mentorship"
                className="mt-4 inline-flex rounded border border-yellow-500/30 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/10"
              >
                Explore Mentorship
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-black/40 p-6">
              <h2 className="text-xl font-bold text-yellow-400">
                Profile Advantage
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                Build your profile once, apply faster, and keep your
                opportunities organized across the platform.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded bg-yellow-400 px-4 py-2 font-semibold text-black hover:bg-yellow-300"
                >
                  Create Profile
                </Link>
                <Link
                  href="/login"
                  className="rounded border border-gray-700 px-4 py-2 text-gray-100 hover:bg-gray-900"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function HubCard({
  title,
  description,
  href,
  buttonLabel,
  variant,
  onClick,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  variant: "gold" | "blue" | "green" | "red";
  onClick?: () => void;
}) {
  const styles =
    variant === "gold"
      ? "border-yellow-400/30 hover:border-yellow-400/60"
      : variant === "blue"
        ? "border-blue-500/30 hover:border-blue-500/60"
        : variant === "green"
          ? "border-green-500/30 hover:border-green-500/60"
          : "border-red-500/30 hover:border-red-500/60";

  const badge =
    variant === "gold"
      ? "bg-yellow-400/15 text-yellow-300"
      : variant === "blue"
        ? "bg-blue-500/15 text-blue-300"
        : variant === "green"
          ? "bg-green-500/15 text-green-300"
          : "bg-red-500/15 text-red-300";

  return (
    <div
      className={[
        "rounded-2xl border bg-gray-950/40 p-6 shadow-lg transition",
        styles,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold">{title}</h3>
        <span className={["rounded px-2 py-1 text-xs", badge].join(" ")}>
          Hub
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-300">{description}</p>
      <Link href={href} onClick={onClick}>
        <button className="mt-4 rounded bg-yellow-400 px-5 py-2 font-semibold text-black transition hover:bg-yellow-300">
          {buttonLabel}
        </button>
      </Link>
    </div>
  );
}
