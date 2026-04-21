"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type HiringStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "contacted"
  | "rejected";

interface Applicant {
  _id: string;
  name: string;
  email: string;
  resumeUrl: string;
  appliedDate: string;
  jobTitle?: string;
  jobId?: string;
  hiringStatus?: HiringStatus;
}

const STATUS_ORDER: HiringStatus[] = [
  "new",
  "reviewed",
  "shortlisted",
  "contacted",
  "rejected",
];

const STATUS_LABEL: Record<HiringStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  contacted: "Contacted",
  rejected: "Rejected",
};

const NEXT_STATUS: Record<HiringStatus, HiringStatus | null> = {
  new: "reviewed",
  reviewed: "shortlisted",
  shortlisted: "contacted",
  contacted: "rejected",
  rejected: null,
};

export default function EmployerApplicantsPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const jobId =
    typeof router.query.jobId === "string" ? router.query.jobId : "";

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const qs = new URLSearchParams();
        if (jobId) qs.set("jobId", jobId);
        const res = await fetch(`/api/employer/applicants?${qs.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok) {
          setApplicants(data.applicants || []);
        } else {
          setError(data?.error || "Failed to load applicants.");
        }
      } catch {
        setError("Failed to load applicants.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId]);

  const grouped = useMemo(() => {
    const base: Record<HiringStatus, Applicant[]> = {
      new: [],
      reviewed: [],
      shortlisted: [],
      contacted: [],
      rejected: [],
    };

    for (const a of applicants) {
      const s = (a.hiringStatus || "new") as HiringStatus;
      base[s].push(a);
    }

    return base;
  }, [applicants]);

  const updateStatus = async (applicantId: string, status: HiringStatus) => {
    setBusyId(applicantId);
    setError("");

    const prev = applicants;
    setApplicants((cur) =>
      cur.map((a) =>
        a._id === applicantId ? { ...a, hiringStatus: status } : a,
      ),
    );

    try {
      const res = await fetch("/api/employer/applicants/status", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, status }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
    } catch (e: any) {
      setApplicants(prev);
      setError(e?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold">Applicant Pipeline</h1>
            <p className="text-sm text-gray-400 mt-1">
              Move candidates through your hiring workflow in one place.
            </p>
          </div>
          <Link href="/employer/jobs">
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
              Back to Jobs
            </button>
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded border border-red-500/30 bg-red-900/20 p-3 text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-gray-400">Loading applicants...</p>
        ) : applicants.length === 0 ? (
          <p className="text-gray-400">No applicants found yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {STATUS_ORDER.map((s) => (
                <div
                  key={s}
                  className="rounded-lg border border-gray-700 bg-gray-900 p-3"
                >
                  <div className="text-xs text-gray-400 uppercase">
                    {STATUS_LABEL[s]}
                  </div>
                  <div className="text-2xl font-bold text-gold">
                    {grouped[s].length}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-7">
              {STATUS_ORDER.map((status) => (
                <section key={status}>
                  <h2 className="text-xl font-bold text-gold mb-3">
                    {STATUS_LABEL[status]} ({grouped[status].length})
                  </h2>
                  {grouped[status].length === 0 ? (
                    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 text-gray-500">
                      No applicants in this stage.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {grouped[status].map((applicant) => (
                        <div
                          key={applicant._id}
                          className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-gold">
                                {applicant.name}
                              </h3>
                              <p className="text-gray-300">{applicant.email}</p>
                              <p className="text-sm text-gray-400 mt-1">
                                Applied:{" "}
                                {new Date(
                                  applicant.appliedDate,
                                ).toLocaleDateString()}
                              </p>
                              {applicant.jobTitle ? (
                                <p className="text-sm text-blue-300 mt-1">
                                  For job: {applicant.jobTitle}
                                </p>
                              ) : null}
                            </div>

                            {applicant.resumeUrl ? (
                              <a
                                href={applicant.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                              >
                                View Resume
                              </a>
                            ) : null}
                          </div>

                          <div className="mt-4 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {STATUS_ORDER.map((next) => {
                                const active =
                                  (applicant.hiringStatus || "new") === next;
                                return (
                                  <button
                                    key={next}
                                    disabled={busyId === applicant._id || active}
                                    onClick={() =>
                                      updateStatus(applicant._id, next)
                                    }
                                    className={`px-3 py-1.5 text-xs rounded border transition ${
                                      active
                                        ? "border-yellow-400/60 bg-yellow-400/20 text-yellow-200"
                                        : "border-gray-600 text-gray-200 hover:border-yellow-400/50"
                                    } ${busyId === applicant._id ? "opacity-60 cursor-not-allowed" : ""}`}
                                  >
                                    {STATUS_LABEL[next]}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {NEXT_STATUS[(applicant.hiringStatus || "new") as HiringStatus] ? (
                                <button
                                  disabled={busyId === applicant._id}
                                  onClick={() =>
                                    updateStatus(
                                      applicant._id,
                                      NEXT_STATUS[(applicant.hiringStatus || "new") as HiringStatus] as HiringStatus,
                                    )
                                  }
                                  className="px-3 py-1.5 text-xs rounded border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                                >
                                  Move to {STATUS_LABEL[NEXT_STATUS[(applicant.hiringStatus || "new") as HiringStatus] as HiringStatus]}
                                </button>
                              ) : null}
                              {(applicant.hiringStatus || "new") !== "rejected" ? (
                                <button
                                  disabled={busyId === applicant._id}
                                  onClick={() => updateStatus(applicant._id, "rejected")}
                                  className="px-3 py-1.5 text-xs rounded border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
