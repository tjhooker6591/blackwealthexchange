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

// Adjust routes here if your project uses different paths
const ROUTES = {
  postJob: "/post-job",
  jobs: "/employer/jobs",
  applicants: "/employer/applicants",
  messages: "/employer/messages",
  analytics: "/employer/analytics",
  resources: "/employer/resources",
  profile: "/employer/profile",
  billing: "/dashboard/employer/billing", // keep if this exists
  consultingInterest: "/dashboard/employer/consulting-interest",
  // If you have a dedicated edit page, you can switch the Details link to this:
  // editJob: (id: string) => `/employer/edit-job?id=${id}`,
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
        // 1) Gate
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

        // 2) Load jobs + stats (do not hard-fail if one endpoint is missing)
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

        // 3) Applicants: try employer endpoint first; fallback to your existing by-job endpoint
        const applicantsPayload = await fetchJson<any>(
          "/api/employer/applicants?limit=5",
          controller.signal,
        );

        let applicants = normalizeApplicants(applicantsPayload);

        if (!applicants.length && jobs.length) {
          // Fallback: aggregate from /api/applicants/by-job?jobId=
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

        // 4) Stats: fallback compute if stats endpoint isn’t ready yet
        setStats({
          jobsPosted: Number(statsData?.jobsPosted ?? jobs.length ?? 0),
          totalApplicants: Number(
            statsData?.totalApplicants ?? applicants.length ?? 0,
          ),
          messages: Number(statsData?.messages ?? 0),
          profileCompletion: Number(statsData?.profileCompletion ?? 0),
        });

        // If important endpoints are missing, show a soft warning (not blocking UI)
        if (!statsData) {
          setError(
            "Heads up: /api/employer/stats isn’t returning yet. The dashboard is showing fallback numbers.",
          );
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error(err);
          setError(err?.message || "An unexpected error occurred.");
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
        <div className="mx-auto max-w-6xl px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
                <Lock className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-yellow-300">
                  Access Denied
                </h2>
                <p className="text-gray-300 text-sm mt-1">
                  Please log in with an employer account to view this dashboard.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push("/login?redirect=/employer")}
                    className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition"
                  >
                    Log In
                  </button>
                  <Link
                    href={ROUTES.postJob}
                    className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-center"
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
    // ✅ This wrapper is what fixes the “washed out / weird” look on the employer index page
    <div className="min-h-[calc(100vh-80px)] bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              Employer Dashboard
            </h1>
            <p className="text-sm text-gray-300 mt-1">
              Manage job postings, applicants, and your employer profile.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={ROUTES.postJob}
              className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition"
            >
              Post Job
            </Link>
            <Link
              href={ROUTES.profile}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition inline-flex items-center gap-2"
            >
              <UserCircle2 className="h-4 w-4 text-yellow-300" />
              Profile
            </Link>
          </div>
        </div>

        {/* Top row: quick actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            icon={<PlusCircle className="h-5 w-5 text-yellow-300" />}
            title="Post a New Job"
            description="Create a listing and reach Black talent fast."
            href={ROUTES.postJob}
            primary
          />
          <ActionCard
            icon={<Users className="h-5 w-5 text-yellow-300" />}
            title="Applicants"
            description="Review and contact qualified candidates."
            href={ROUTES.applicants}
          />
          <ActionCard
            icon={<BookOpen className="h-5 w-5 text-yellow-300" />}
            title="Resources"
            description="Guides, templates, and hiring best practices."
            href={ROUTES.resources}
          />
        </div>

        {/* Soft error banner (non-blocking) */}
        {error ? (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 shadow-xl">
            <p className="text-yellow-200 font-semibold">Notice</p>
            <p className="text-gray-200 text-sm mt-1">{error}</p>
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={<Briefcase className="h-5 w-5 text-yellow-300" />}
            label="Jobs Posted"
            value={stats.jobsPosted}
            href={ROUTES.jobs}
          />
          <StatTile
            icon={<Users className="h-5 w-5 text-yellow-300" />}
            label="Total Applicants"
            value={stats.totalApplicants}
            href={ROUTES.applicants}
          />
          <StatTile
            icon={<MessageSquare className="h-5 w-5 text-yellow-300" />}
            label="Messages"
            value={stats.messages}
            href={ROUTES.messages}
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Profile Completion</div>
              <Link
                href={ROUTES.profile}
                className="text-sm text-yellow-300 hover:underline"
              >
                Improve
              </Link>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-white">
              {completion}%
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-black/40 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              A strong employer profile increases application quality.
            </p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid gap-6 lg:grid-cols-2">
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
                    className="rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-black/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">
                          {app.name}
                        </div>
                        <div className="text-sm text-gray-400">
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
                          className="inline-flex items-center gap-2 text-sm text-yellow-300 hover:underline whitespace-nowrap"
                        >
                          <FileText className="h-4 w-4" />
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
                    className="rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-black/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">
                          {job.title}
                        </div>
                        <div className="text-sm text-gray-400">
                          {(job.location || "Remote") +
                            " • " +
                            (job.type || "Role")}
                          {typeof job.appliedCount === "number"
                            ? ` • ${job.appliedCount} applicant${
                                job.appliedCount === 1 ? "" : "s"
                              }`
                            : ""}
                        </div>
                        <p className="text-sm text-gray-300 mt-2">
                          {(job.description || "No description yet.").length >
                          110
                            ? (job.description || "").slice(0, 110) + "…"
                            : job.description || "No description yet."}
                        </p>
                      </div>

                      <Link
                        href={`${ROUTES.jobs}/${job._id}`}
                        className="inline-flex items-center gap-2 text-sm text-yellow-300 hover:underline whitespace-nowrap"
                      >
                        Details <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </ListCard>
        </div>

        {/* Consulting interest (coming soon) */}
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-yellow-300">
                Recruiting & Consulting Services
              </h3>
              <p className="text-sm text-gray-200 mt-1">
                Get notified when we launch premium recruiting support for
                employers.
              </p>
            </div>
            <Link
              href={ROUTES.consultingInterest}
              className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition text-center"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Reusable UI Blocks ───────────── */

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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl hover:bg-white/10 hover:shadow-2xl transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-200">
            <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
              {icon}
            </div>
            <div className="text-sm text-gray-300">{label}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
        <div className="mt-4 text-4xl font-extrabold text-white">{value}</div>
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
          "rounded-2xl border p-6 shadow-xl hover:shadow-2xl transition",
          primary
            ? "border-yellow-500/25 bg-yellow-500/10 hover:bg-yellow-500/15"
            : "border-white/10 bg-white/5 hover:bg-white/10",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cx(
              "h-10 w-10 rounded-xl border flex items-center justify-center",
              primary
                ? "border-yellow-500/25 bg-black/30"
                : "border-white/10 bg-black/30",
            )}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">{title}</h3>
            <p className="text-sm text-gray-300 mt-1">{description}</p>
          </div>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 text-yellow-300 font-semibold">
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-extrabold text-yellow-300">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
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
        <div className="rounded-xl border border-white/10 bg-black/30 p-5 text-gray-300">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl"
          >
            <div className="h-6 w-2/3 bg-white/10 rounded animate-pulse" />
            <div className="mt-3 h-4 w-1/2 bg-white/10 rounded animate-pulse" />
            <div className="mt-6 h-4 w-1/3 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl"
          >
            <div className="h-5 w-1/2 bg-white/10 rounded animate-pulse" />
            <div className="mt-4 h-10 w-1/3 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl"
          >
            <div className="h-6 w-1/2 bg-white/10 rounded animate-pulse" />
            <div className="mt-4 h-24 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
