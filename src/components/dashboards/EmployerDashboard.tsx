// src/components/dashboards/EmployerDashboard.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Briefcase,
  Users,
  MessageSquare,
  ArrowRight,
  Lock,
  PlusCircle,
  FileText,
  UserCircle2,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

interface Stats {
  jobsPosted: number;
  totalApplicants: number;
  messages: number;
  profileCompletion: number; // 0-100
}

interface Job {
  _id: string;
  title: string;
  location?: string;
  type?: string;
  description?: string;
  appliedCount?: number;
}

interface Applicant {
  _id: string;
  name: string;
  jobTitle?: string;
  appliedAt?: string;
  resumeUrl?: string;
  jobId?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const ROUTES = {
  postJob: "/post-job",
  jobs: "/employer/jobs",
  applicants: "/employer/applicants",
  messages: "/employer/messages",
  analytics: "/employer/analytics",
  resources: "/employer/resources",
  profile: "/employer/profile",
  billing: "/dashboard/employer/billing",
  consultingInterest: "/dashboard/employer/consulting-interest",
};

function formatDate(value?: string) {
  if (!value) return "Date unknown";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date unknown";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function fetchJson<T>(
  url: string,
  signal: AbortSignal,
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      credentials: "include",
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function normalizeJobs(payload: any): Job[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Job[];
  if (Array.isArray(payload.jobs)) return payload.jobs as Job[];
  if (Array.isArray(payload.data)) return payload.data as Job[];
  return [];
}

function normalizeApplicants(payload: any): Applicant[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Applicant[];
  if (Array.isArray(payload.applicants))
    return payload.applicants as Applicant[];
  if (Array.isArray(payload.data)) return payload.data as Applicant[];
  return [];
}

export default function EmployerDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    jobsPosted: 0,
    totalApplicants: 0,
    messages: 0,
    profileCompletion: 0,
  });

  const [jobList, setJobList] = useState<Job[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError("");
      setAccessDenied(false);

      try {
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!sessionRes.ok) {
          setAccessDenied(true);
          return;
        }

        const sessionData = await sessionRes.json();
        const u = sessionData?.user;

        if (!u || u.accountType !== "employer") {
          setAccessDenied(true);
          return;
        }

        const statsData = await fetchJson<any>(
          "/api/employer/stats",
          controller.signal,
        );

        const jobsPayload =
          (await fetchJson<any>(
            "/api/employer/jobs?limit=5",
            controller.signal,
          )) ||
          (await fetchJson<any>(
            "/api/jobs/by-employer?limit=5",
            controller.signal,
          )) ||
          (await fetchJson<any>("/api/jobs/mine?limit=5", controller.signal));

        const jobs = normalizeJobs(jobsPayload);
        setJobList(jobs);

        const applicantsPayload = await fetchJson<any>(
          "/api/employer/applicants?limit=5",
          controller.signal,
        );

        let applicants = normalizeApplicants(applicantsPayload);

        if (!applicants.length && jobs.length) {
          const buckets = await Promise.all(
            jobs
              .slice(0, 5)
              .map((j) =>
                fetchJson<any>(
                  `/api/applicants/by-job?jobId=${encodeURIComponent(j._id)}`,
                  controller.signal,
                ),
              ),
          );

          applicants = buckets
            .flatMap((b) => normalizeApplicants(b))
            .sort((a, b) => {
              const ta = new Date(a.appliedAt || 0).getTime();
              const tb = new Date(b.appliedAt || 0).getTime();
              return tb - ta;
            })
            .slice(0, 5);
        }

        setRecentApplicants(applicants);

        setStats({
          jobsPosted: Number(statsData?.jobsPosted ?? jobs.length ?? 0),
          totalApplicants: Number(
            statsData?.totalApplicants ?? applicants.length ?? 0,
          ),
          messages: Number(statsData?.messages ?? 0),
          profileCompletion: Number(statsData?.profileCompletion ?? 0),
        });

        if (!statsData) {
          setError(
            "Some employer dashboard data is currently using fallback values while live stats finish loading.",
          );
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error(err);
          setError(
            "Some employer dashboard data could not be loaded right now. Please refresh and try again.",
          );
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const completion = useMemo(() => {
    const n = Number(stats.profileCompletion || 0);
    return Math.max(0, Math.min(100, n));
  }, [stats.profileCompletion]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-black text-white">
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-black text-white">
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30">
                <Lock className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-yellow-300 sm:text-xl">
                  Access Denied
                </h2>
                <p className="mt-1 text-sm text-gray-300">
                  Please log in with an employer account to view this dashboard.
                </p>
                <div className="mt-4 grid gap-3 sm:flex sm:flex-row">
                  <button
                    onClick={() => router.push("/login?redirect=/employer")}
                    className="w-full rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-500 sm:w-auto"
                  >
                    Log In
                  </button>
                  <Link
                    href={ROUTES.postJob}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-center text-sm transition hover:bg-white/10 sm:w-auto"
                  >
                    Post a Job
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-black text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-3 py-4 sm:space-y-8 sm:px-4 sm:py-8">
        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[11px] font-semibold text-yellow-300">
                <Briefcase className="h-3.5 w-3.5" />
                Employer Workspace
              </div>

              <h1 className="mt-3 text-lg font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
                Employer Dashboard
              </h1>
              <p className="mt-1 text-xs text-gray-300 sm:text-sm md:text-base">
                Manage job postings, review applicants, and keep your employer
                profile ready for stronger hiring results.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Link
                href={ROUTES.postJob}
                className="rounded-xl bg-yellow-400 px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-yellow-500"
              >
                Post Job
              </Link>
              <Link
                href={ROUTES.profile}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm transition hover:bg-white/10"
              >
                <UserCircle2 className="h-4 w-4 text-yellow-300" />
                Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <div className="col-span-1">
            <ActionCard
              icon={<PlusCircle className="h-5 w-5 text-yellow-300" />}
              title="Post a New Job"
              description="Create a listing and reach Black talent fast."
              href={ROUTES.postJob}
              primary
            />
          </div>
          <div className="col-span-1">
            <ActionCard
              icon={<Users className="h-5 w-5 text-yellow-300" />}
              title="Applicants"
              description="Review and contact qualified candidates."
              href={ROUTES.applicants}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <ActionCard
              icon={<BookOpen className="h-5 w-5 text-yellow-300" />}
              title="Resources"
              description="Guides, templates, and hiring best practices."
              href={ROUTES.resources}
            />
          </div>
        </div>

        {/* Soft error banner */}
        {error ? (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 shadow-xl sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-black/30">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-yellow-200">Notice</p>
                <p className="mt-1 text-sm break-words text-gray-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          <StatTile
            icon={<Briefcase className="h-5 w-5 text-yellow-300" />}
            label="Jobs Posted"
            value={stats.jobsPosted}
            href={ROUTES.jobs}
          />
          <StatTile
            icon={<Users className="h-5 w-5 text-yellow-300" />}
            label="Applicants"
            value={stats.totalApplicants}
            href={ROUTES.applicants}
          />
          <StatTile
            icon={<MessageSquare className="h-5 w-5 text-yellow-300" />}
            label="Messages"
            value={stats.messages}
            href={ROUTES.messages}
          />
          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl lg:col-span-1 lg:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-gray-300">Profile Completion</div>
              <Link
                href={ROUTES.profile}
                className="shrink-0 text-xs text-yellow-300 hover:underline sm:text-sm"
              >
                Improve
              </Link>
            </div>
            <div className="mt-3 text-xl font-extrabold text-white sm:text-3xl">
              {completion}%
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400 sm:text-sm">
              A strong employer profile increases application quality.
            </p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <ListCard
            title="Recent Applicants"
            subtitle="Most recent applications received."
            viewAllHref={ROUTES.applicants}
            emptyText="No recent applicants yet."
          >
            {recentApplicants.length ? (
              <div className="space-y-3">
                {recentApplicants.map((app) => (
                  <div
                    key={app._id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3 transition hover:bg-black/40 sm:p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="break-words font-semibold text-white">
                          {app.name}
                        </div>
                        <div className="break-words text-sm text-gray-400">
                          {(app.jobTitle || "Job") +
                            " • " +
                            formatDate(app.appliedAt)}
                        </div>
                      </div>
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-yellow-300 hover:underline sm:whitespace-nowrap"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          Resume
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </ListCard>

          <ListCard
            title="Recent Job Postings"
            subtitle="Your latest job listings."
            viewAllHref={ROUTES.jobs}
            emptyText="No job postings found yet."
          >
            {jobList.length ? (
              <div className="space-y-3">
                {jobList.map((job) => (
                  <div
                    key={job._id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3 transition hover:bg-black/40 sm:p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="break-words font-semibold text-white">
                          {job.title}
                        </div>
                        <div className="break-words text-sm text-gray-400">
                          {(job.location || "Remote") +
                            " • " +
                            (job.type || "Role")}
                          {typeof job.appliedCount === "number"
                            ? ` • ${job.appliedCount} applicant${
                                job.appliedCount === 1 ? "" : "s"
                              }`
                            : ""}
                        </div>
                        <p className="mt-2 break-words text-sm text-gray-300">
                          {(job.description || "No description yet.").length >
                          110
                            ? (job.description || "").slice(0, 110) + "…"
                            : job.description || "No description yet."}
                        </p>
                      </div>

                      <Link
                        href={`${ROUTES.jobs}/${job._id}`}
                        className="inline-flex items-center gap-2 text-sm text-yellow-300 hover:underline sm:whitespace-nowrap"
                      >
                        Details <ArrowRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </ListCard>
        </div>

        {/* Consulting interest */}
        <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent p-4 shadow-xl sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-yellow-300 sm:text-xl">
                Recruiting & Consulting Services
              </h3>
              <p className="mt-1 text-sm text-gray-200">
                Get notified when we launch premium recruiting support for
                employers.
              </p>
            </div>
            <Link
              href={ROUTES.consultingInterest}
              className="w-full rounded-xl bg-yellow-400 px-5 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-yellow-500 md:w-auto"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable UI Blocks */

function StatTile({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl transition hover:bg-white/10 hover:shadow-2xl sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-gray-200">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 sm:h-10 sm:w-10">
              {icon}
            </div>
            <div className="truncate text-[11px] text-gray-300 sm:text-sm">
              {label}
            </div>
          </div>
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        </div>
        <div className="mt-3 text-xl font-extrabold text-white sm:mt-4 sm:text-3xl">
          {value}
        </div>
      </div>
    </Link>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <div
        className={cx(
          "h-full rounded-2xl border p-4 shadow-xl transition hover:shadow-2xl sm:p-5",
          primary
            ? "border-yellow-500/25 bg-yellow-500/10 hover:bg-yellow-500/15"
            : "border-white/10 bg-white/5 hover:bg-white/10",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              primary
                ? "border-yellow-500/25 bg-black/30"
                : "border-white/10 bg-black/30",
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-white sm:text-lg">
              {title}
            </h3>
            <p className="mt-1 text-xs text-gray-300 sm:text-sm">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-300 sm:mt-5">
          Open <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function ListCard({
  title,
  subtitle,
  viewAllHref,
  emptyText,
  children,
}: {
  title: string;
  subtitle: string;
  viewAllHref: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const hasContent = !!children;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-yellow-300 sm:text-xl">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
        </div>
        <Link
          href={viewAllHref}
          className="text-sm text-yellow-300 hover:underline"
        >
          View all
        </Link>
      </div>

      {hasContent ? (
        children
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-gray-300 sm:p-5">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-7 w-1/2 animate-pulse rounded bg-white/10 sm:h-8" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-5"
          >
            <div className="h-6 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="mt-6 h-4 w-1/3 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-5"
          >
            <div className="h-5 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-10 w-1/3 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6"
          >
            <div className="h-6 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-24 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
