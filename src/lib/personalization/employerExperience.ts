// src/lib/personalization/employerExperience.ts
//
// P4-05 Employer Experience.
//
// Adds the layer that /api/employer/get-dashboard.ts and
// /api/employer/applicants.ts don't already cover: per-job real view/apply
// funnel (flow_events, jobId-keyed) and a vetting-quality breakdown across
// real applicants, using the vettingStatus already computed and stored at
// application time (see src/lib/hiring/vetting.ts and
// src/pages/api/applicants/create.ts). No new scoring model -- this reads
// existing signals.

import { ObjectId, type Db } from "mongodb";

export type JobPerformance = {
  jobId: string;
  title: string;
  views: number;
  applyStarted: number;
  applicantCount: number;
};

export type EmployerExperienceResult = {
  state: "LINKED" | "NOT_LINKED";
  jobCount: number;
  totalViews: number;
  totalApplyStarted: number;
  totalApplicants: number;
  vettingBreakdown: {
    qualified: number;
    review_needed: number;
    not_yet_qualified: number;
  };
  jobPerformance: JobPerformance[];
  provenance: { source: string; authoritative: boolean }[];
};

function s(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function toId(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof ObjectId) return value.toString();
  return "";
}

export async function resolveEmployerExperience(
  db: Db,
  input: { employerUserId: string },
): Promise<EmployerExperienceResult> {
  const employerUserId = s(input.employerUserId);
  if (!employerUserId) {
    return {
      state: "NOT_LINKED",
      jobCount: 0,
      totalViews: 0,
      totalApplyStarted: 0,
      totalApplicants: 0,
      vettingBreakdown: {
        qualified: 0,
        review_needed: 0,
        not_yet_qualified: 0,
      },
      jobPerformance: [],
      provenance: [{ source: "missing_user_id", authoritative: false }],
    };
  }

  const jobs = await db
    .collection("jobs")
    .find({ userId: employerUserId })
    .project({ _id: 1, title: 1 })
    .toArray();

  if (!jobs.length) {
    return {
      state: "NOT_LINKED",
      jobCount: 0,
      totalViews: 0,
      totalApplyStarted: 0,
      totalApplicants: 0,
      vettingBreakdown: {
        qualified: 0,
        review_needed: 0,
        not_yet_qualified: 0,
      },
      jobPerformance: [],
      provenance: [
        { source: "jobs.userId (no jobs posted)", authoritative: false },
      ],
    };
  }

  const jobIdStrings = jobs.map((j: any) => toId(j._id));
  const jobObjectIds = jobIdStrings
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const [applicants, viewEvents, applyEvents] = await Promise.all([
    db
      .collection("applicants")
      .find({ jobId: { $in: jobObjectIds } })
      .project({ jobId: 1, vettingStatus: 1 })
      .toArray(),
    db
      .collection("flow_events")
      .aggregate([
        {
          $match: {
            jobId: { $in: jobIdStrings },
            eventType: "job_detail_viewed",
          },
        },
        { $group: { _id: "$jobId", count: { $sum: 1 } } },
      ])
      .toArray(),
    db
      .collection("flow_events")
      .aggregate([
        {
          $match: {
            jobId: { $in: jobIdStrings },
            eventType: "job_apply_started",
          },
        },
        { $group: { _id: "$jobId", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const viewsByJob = new Map<string, number>(
    viewEvents.map((row: any) => [String(row._id), row.count]),
  );
  const applyStartsByJob = new Map<string, number>(
    applyEvents.map((row: any) => [String(row._id), row.count]),
  );
  const applicantsByJob = new Map<string, number>();
  const vettingBreakdown = {
    qualified: 0,
    review_needed: 0,
    not_yet_qualified: 0,
  };
  for (const applicant of applicants) {
    const jobId = toId((applicant as any).jobId);
    applicantsByJob.set(jobId, (applicantsByJob.get(jobId) || 0) + 1);
    const status = s((applicant as any).vettingStatus) as
      | keyof typeof vettingBreakdown
      | "";
    if (status && status in vettingBreakdown) {
      vettingBreakdown[status] += 1;
    }
  }

  const jobPerformance: JobPerformance[] = jobs
    .map((job: any) => {
      const id = toId(job._id);
      return {
        jobId: id,
        title: s(job.title) || "Untitled role",
        views: viewsByJob.get(id) || 0,
        applyStarted: applyStartsByJob.get(id) || 0,
        applicantCount: applicantsByJob.get(id) || 0,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    state: "LINKED",
    jobCount: jobs.length,
    totalViews: Array.from(viewsByJob.values()).reduce((a, b) => a + b, 0),
    totalApplyStarted: Array.from(applyStartsByJob.values()).reduce(
      (a, b) => a + b,
      0,
    ),
    totalApplicants: applicants.length,
    vettingBreakdown,
    jobPerformance,
    provenance: [
      { source: "jobs.userId", authoritative: true },
      { source: "applicants.jobId + vettingStatus", authoritative: true },
      { source: "flow_events.jobId", authoritative: false },
    ],
  };
}
