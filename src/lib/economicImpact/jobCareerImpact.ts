// src/lib/economicImpact/jobCareerImpact.ts
//
// Phase 6 -- Job / Career Impact. Aggregates the real `jobs` and
// `applicants` collections. BWE's hiring pipeline
// (src/pages/api/employer/applicants/status.ts) tracks hiringStatus values
// "new" | "reviewed" | "shortlisted" | "contacted" | "rejected" -- there is
// no "hired" or "placed" status anywhere in the schema, so a real
// hires/placements count does not exist. Rather than approximate it from
// "contacted" (which is not the same claim), this resolver reports the
// real funnel and explicitly marks hires as insufficient_data.

import type { Db } from "mongodb";
import { measured, insufficientData, type EconomicMetric } from "./shared";

export type JobCareerImpactResult = {
  metrics: EconomicMetric[];
  applicantsByStatus: Record<string, number>;
};

const KNOWN_STATUSES = [
  "new",
  "reviewed",
  "shortlisted",
  "contacted",
  "rejected",
];

export async function resolveJobCareerImpact(
  db: Db,
): Promise<JobCareerImpactResult> {
  const [jobCount, applicantAgg] = await Promise.all([
    db.collection("jobs").countDocuments({}),
    db
      .collection("applicants")
      .aggregate([
        {
          $group: {
            _id: { $ifNull: ["$hiringStatus", "new"] },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
  ]);

  const applicantsByStatus: Record<string, number> = {};
  for (const status of KNOWN_STATUSES) applicantsByStatus[status] = 0;
  let totalApplicants = 0;
  for (const row of applicantAgg as any[]) {
    const key = String(row._id || "new");
    applicantsByStatus[key] = row.count;
    totalApplicants += row.count;
  }

  return {
    applicantsByStatus,
    metrics: [
      measured("job_postings_total", "Jobs posted on BWE", jobCount, "count", [
        "jobs",
      ]),
      measured(
        "job_applications_total",
        "Applications submitted",
        totalApplicants,
        "count",
        ["applicants"],
      ),
      measured(
        "job_applications_shortlisted",
        "Applications reaching shortlisted or later",
        (applicantsByStatus.shortlisted || 0) +
          (applicantsByStatus.contacted || 0),
        "count",
        ["applicants"],
        "Sum of hiringStatus in {shortlisted, contacted} -- the funnel stages that exist in the schema. Not a hire count.",
      ),
      insufficientData(
        "job_hires_total",
        "Confirmed hires / placements",
        "BWE's hiring pipeline (applicants.hiringStatus) has no 'hired' or 'placed' status -- only new/reviewed/shortlisted/contacted/rejected are tracked. A hires figure would have to be invented, so none is reported.",
      ),
      insufficientData(
        "job_wages_total",
        "Wages generated through BWE job placements",
        "No hire/placement data exists to attribute wages to, and BWE does not collect salary outcomes for applicants. Not calculable from current data.",
      ),
    ],
  };
}
