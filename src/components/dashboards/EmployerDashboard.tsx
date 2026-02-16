// src/components/dashboards/EmployerDashboard.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Briefcase,
  Users,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Lock,
  PlusCircle,
  FileText,
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
  location: string;
  type: string;
  description: string;
  appliedCount?: number;
}

interface Applicant {
  _id: string;
  name: string;
  jobTitle: string;
  appliedAt: string;
  resumeUrl: string;
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
  billing: "/dashboard/employer/billing", // keep if this exists
  consultingInterest: "/dashboard/employer/consulting-interest",
};

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
      try {
        setError("");

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

        // 2) Load dashboard data in parallel
        const [statsRes, jobsRes, appRes] = await Promise.all([
          fetch("/api/employer/stats", {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          }),
          fetch("/api/employer/jobs?limit=5", {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          }),
          fetch("/api/employer/applicants?limit=5", {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          }),
        ]);

        if (!statsRes.ok) throw new Error("Failed to load employer stats.");
        if (!jobsRes.ok) throw new Error("Failed to load recent job postings.");
        if (!appRes.ok) throw new Error("Failed to load recent applicants.");

        const statsData = await statsRes.json();
        const jobsData: { jobs: Job[] } = await jobsRes.json();
        const appData: { applicants: Applicant[] } = await appRes.json();

        setStats({
          jobsPosted: statsData.jobsPosted || 0,
          totalApplicants: statsData.totalApplicants || 0,
          messages: statsData.messages || 0,
          profileCompletion: statsData.profileCompletion || 0,
        });

        setJobList(jobsData?.jobs || []);
        setRecentApplicants(appData?.applicants || []);
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

  // ✅ Option A: return cards/sections only (no full-page wrappers)
  if (loading) return <DashboardSkeleton />;

  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
            <Lock className="h-5 w-5 text-yellow-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-gold">Access Denied</h2>
            <p className="text-gray-300 text-sm mt-1">
              Please log in with an employer account to view this dashboard.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/login?redirect=/dashboard")}
                className="px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
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
    );
  }

  return (
    <section className="space-y-8">
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
          title="View Applicants"
          description="Review and contact qualified candidates."
          href={ROUTES.applicants}
        />
        <ActionCard
          icon={<BarChart3 className="h-5 w-5 text-yellow-300" />}
          title="Analytics"
          description="Track performance and engagement."
          href={ROUTES.analytics}
        />
      </div>

      {/* Error banner (non-blocking) */}
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 shadow-xl">
          <p className="text-red-200 font-semibold">Something went wrong</p>
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
            <Link href="/profile" className="text-sm text-gold hover:underline">
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
                      <div className="font-semibold text-white">{app.name}</div>
                      <div className="text-sm text-gray-400">
                        {app.jobTitle} •{" "}
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-gold hover:underline whitespace-nowrap"
                    >
                      <FileText className="h-4 w-4" />
                      Resume
                    </a>
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
                        {job.location} • {job.type}
                        {typeof job.appliedCount === "number"
                          ? ` • ${job.appliedCount} applicant${job.appliedCount === 1 ? "" : "s"}`
                          : ""}
                      </div>
                      <p className="text-sm text-gray-300 mt-2">
                        {job.description?.length > 110
                          ? job.description.slice(0, 110) + "…"
                          : job.description}
                      </p>
                    </div>

                    <Link
                      href={`${ROUTES.jobs}/${job._id}`}
                      className="inline-flex items-center gap-2 text-sm text-gold hover:underline whitespace-nowrap"
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

      {/* Consulting interest (clean “coming soon”) */}
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-gold">
              Recruiting & Consulting Services
            </h3>
            <p className="text-sm text-gray-200 mt-1">
              Get notified when we launch premium recruiting support for employers.
            </p>
          </div>
          <Link
            href={ROUTES.consultingInterest}
            className="px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition text-center"
          >
            Join Waitlist
          </Link>
        </div>
      </div>
    </section>
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
        <div className="mt-5 inline-flex items-center gap-2 text-gold font-semibold">
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
  const hasContent = !!children && (Array.isArray(children) ? children.length > 0 : true);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-extrabold text-gold">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
        <Link href={viewAllHref} className="text-sm text-gold hover:underline">
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
