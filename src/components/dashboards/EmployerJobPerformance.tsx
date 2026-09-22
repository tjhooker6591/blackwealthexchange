// src/components/dashboards/EmployerJobPerformance.tsx
//
// P4-05 Employer Experience -- real per-job view/apply funnel and
// applicant vetting-quality breakdown, sourced from
// /api/personalization/employer-experience.

"use client";

import { useEffect, useState } from "react";
import { LineChart } from "lucide-react";

type JobPerf = {
  jobId: string;
  title: string;
  views: number;
  applyStarted: number;
  applicantCount: number;
};

type Payload = {
  state: "LINKED" | "NOT_LINKED";
  totalViews: number;
  totalApplyStarted: number;
  totalApplicants: number;
  vettingBreakdown: {
    qualified: number;
    review_needed: number;
    not_yet_qualified: number;
  };
  jobPerformance: JobPerf[];
};

export default function EmployerJobPerformance() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/personalization/employer-experience", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) setData(await res.json());
      } catch {
        // degrade silently
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-5">
        <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-20 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  if (!data || data.state === "NOT_LINKED") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-5">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-yellow-300" />
          <h3 className="text-base font-bold text-gold">Job Performance</h3>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Post a job to see real view and applicant activity here.
        </p>
      </div>
    );
  }

  const { vettingBreakdown } = data;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-5">
      <div className="flex items-center gap-2">
        <LineChart className="h-4 w-4 text-yellow-300" />
        <h3 className="text-base font-bold text-gold">Job Performance</h3>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <MiniStat label="Views" value={data.totalViews} />
        <MiniStat label="Apply started" value={data.totalApplyStarted} />
        <MiniStat label="Applicants" value={data.totalApplicants} />
      </div>

      {data.totalApplicants > 0 ? (
        <div className="mt-3">
          <div className="text-xs uppercase tracking-wide text-gray-400">
            Applicant vetting quality
          </div>
          <div className="mt-1 flex gap-3 text-sm text-gray-200">
            <span>Qualified: {vettingBreakdown.qualified}</span>
            <span>Review needed: {vettingBreakdown.review_needed}</span>
            <span>Not yet qualified: {vettingBreakdown.not_yet_qualified}</span>
          </div>
        </div>
      ) : null}

      {data.jobPerformance.length ? (
        <div className="mt-4 space-y-2">
          {data.jobPerformance.map((job) => (
            <div
              key={job.jobId}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <div className="min-w-0 truncate text-sm text-white">
                {job.title}
              </div>
              <div className="shrink-0 text-xs text-gray-400">
                {job.views} views · {job.applyStarted} started ·{" "}
                {job.applicantCount} applied
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-lg font-extrabold text-white">{value}</div>
    </div>
  );
}
