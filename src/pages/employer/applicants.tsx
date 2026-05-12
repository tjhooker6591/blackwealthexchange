"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { requirePageRole } from "@/lib/security/pageRoleGuard";

type HiringStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "contacted"
  | "interview"
  | "hired"
  | "rejected";

interface Applicant {
  vettingStatus?: "qualified" | "review_needed" | "not_yet_qualified";
  vettingSignals?: any;
  vettingSummary?: string;
  vettingUpdatedAt?: string;
  vettingConfidenceBand?: "high" | "medium" | "low";
  manualOverride?: boolean;
  overrideReason?: string;
  _id: string;
  name: string;
  email: string;
  resumeUrl: string;
  appliedDate: string;
  jobTitle?: string;
  jobId?: string;
  hiringStatus?: HiringStatus;
  employerNote?: string;
  rejectionReason?: string;
  statusHistory?: Array<{
    status: HiringStatus;
    changedAt?: string;
    actor?: string;
    note?: string;
    rejectionReason?: string;
  }>;
}

const STATUS_ORDER: HiringStatus[] = [
  "new",
  "reviewed",
  "shortlisted",
  "contacted",
  "interview",
  "hired",
  "rejected",
];

const STATUS_LABEL: Record<HiringStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  contacted: "Contacted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Rejected",
};

const NEXT_STATUS: Record<HiringStatus, HiringStatus | null> = {
  new: "reviewed",
  reviewed: "shortlisted",
  shortlisted: "contacted",
  contacted: "interview",
  interview: "hired",
  hired: null,
  rejected: null,
};

export default function EmployerApplicantsPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | HiringStatus>("all");
  const [search, setSearch] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});
  const [messageDraft, setMessageDraft] = useState<Record<string, string>>({});
  const [messagesByApplicant, setMessagesByApplicant] = useState<
    Record<
      string,
      Array<{
        _id: string;
        sender: string;
        senderRole: string;
        body: string;
        createdAt: string;
      }>
    >
  >({});

  const jobId =
    typeof router.query.jobId === "string" ? router.query.jobId : "";

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const qs = new URLSearchParams();
        if (jobId) qs.set("jobId", jobId);
        if (statusFilter !== "all") qs.set("status", statusFilter);
        if (search.trim()) qs.set("q", search.trim());
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
  }, [jobId, statusFilter, search]);

  const grouped = useMemo(() => {
    const base: Record<HiringStatus, Applicant[]> = {
      new: [],
      reviewed: [],
      shortlisted: [],
      contacted: [],
      interview: [],
      hired: [],
      rejected: [],
    };

    for (const a of applicants) {
      const s = (a.hiringStatus || "new") as HiringStatus;
      const bucket = base[s] ?? base.new;
      bucket.push(a);
    }

    return base;
  }, [applicants]);

  const updateStatus = async (
    applicantId: string,
    status: HiringStatus,
    options?: { manualOverride?: boolean },
  ) => {
    const note = (notesDraft[applicantId] || "").trim();
    const rejectionReason = (reasonDraft[applicantId] || "").trim();
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
        body: JSON.stringify({
          applicantId,
          status,
          note,
          rejectionReason,
          manualOverride: Boolean(options?.manualOverride),
          overrideReason: Boolean(options?.manualOverride)
            ? note || "Manual employer override"
            : "",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
      setApplicants((cur) =>
        cur.map((a) =>
          a._id === applicantId
            ? {
                ...a,
                hiringStatus: status,
                employerNote: note || a.employerNote,
                rejectionReason:
                  status === "rejected"
                    ? rejectionReason || a.rejectionReason
                    : a.rejectionReason,
                statusHistory: [
                  {
                    status,
                    changedAt:
                      data?.statusChangedAt || new Date().toISOString(),
                    actor: "employer",
                    note,
                    rejectionReason:
                      status === "rejected" ? rejectionReason : "",
                  },
                  ...(a.statusHistory || []),
                ],
              }
            : a,
        ),
      );
    } catch (e: any) {
      setApplicants(prev);
      setError(e?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const loadMessages = async (applicantId: string) => {
    try {
      const res = await fetch(
        `/api/employer/applicants/messages?applicantId=${applicantId}`,
        {
          credentials: "include",
        },
      );
      const data = await res.json();
      if (res.ok) {
        setMessagesByApplicant((cur) => ({
          ...cur,
          [applicantId]: data.messages || [],
        }));
      }
    } catch {
      // ignore
    }
  };

  const sendMessage = async (applicant: Applicant) => {
    const applicantId = applicant._id;
    const body = (messageDraft[applicantId] || "").trim();
    if (!body) return;
    setBusyId(applicantId);
    try {
      const res = await fetch("/api/employer/applicants/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, body }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to send message");
      setMessageDraft((cur) => ({ ...cur, [applicantId]: "" }));
      await loadMessages(applicantId);
    } catch (e: any) {
      setError(e?.message || "Failed to send message");
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
              Structured candidate review with automated role-match checks plus
              human hiring decisions.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Automated screening assists review, it does not replace hiring
              judgment.
            </p>
          </div>
          <Link href="/employer/jobs">
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
              Back to Jobs
            </button>
          </Link>
        </div>

        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or job"
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | HiringStatus)
            }
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="all">All stages</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
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
                    {(grouped?.[s] ?? []).length}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-7">
              {STATUS_ORDER.map((status) => (
                <section key={status}>
                  <h2 className="text-xl font-bold text-gold mb-3">
                    {STATUS_LABEL[status]} ({(grouped?.[status] ?? []).length})
                  </h2>
                  {(grouped?.[status] ?? []).length === 0 ? (
                    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 text-gray-500">
                      No applicants in this stage.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(grouped?.[status] ?? []).map((applicant) => (
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
                            <div className="rounded border border-gray-700 bg-gray-900/60 p-3 text-xs text-gray-200 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">
                                  Quality Status:
                                </span>
                                <span className="px-2 py-0.5 rounded border border-gray-600">
                                  {(
                                    applicant.vettingStatus || "review_needed"
                                  ).replaceAll("_", " ")}
                                </span>
                                <span className="px-2 py-0.5 rounded border border-gray-600">
                                  Role-match:{" "}
                                  {(
                                    applicant.vettingConfidenceBand || "low"
                                  ).toUpperCase()}
                                </span>
                                {applicant.manualOverride ? (
                                  <span className="px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-200">
                                    Manual override
                                  </span>
                                ) : null}
                              </div>
                              <div>
                                <span className="font-semibold">
                                  Readiness:
                                </span>{" "}
                                Profile{" "}
                                {applicant.vettingSignals?.profileCompleteness
                                  ?.passed
                                  ? "complete"
                                  : "partial"}
                                , Resume{" "}
                                {applicant.vettingSignals?.resume?.present
                                  ? "present"
                                  : "missing"}
                              </div>
                              <div>
                                <span className="font-semibold">
                                  Required-match:
                                </span>{" "}
                                Matched{" "}
                                {applicant.vettingSignals?.roleMatch
                                  ?.matchedKeywords?.length || 0}
                                , Missing{" "}
                                {applicant.vettingSignals?.roleMatch
                                  ?.missingKeywords?.length || 0}
                              </div>
                              {(
                                applicant.vettingSignals?.knockout?.reasons ||
                                []
                              ).length ? (
                                <div>
                                  <span className="font-semibold">
                                    Missing requirements:
                                  </span>{" "}
                                  {(
                                    applicant.vettingSignals?.knockout
                                      ?.reasons || []
                                  ).join("; ")}
                                </div>
                              ) : (
                                <div>
                                  <span className="font-semibold">
                                    Missing requirements:
                                  </span>{" "}
                                  None detected
                                </div>
                              )}
                              <div>
                                <span className="font-semibold">
                                  Screening summary:
                                </span>{" "}
                                {applicant.vettingSummary ||
                                  "Awaiting screening summary."}
                              </div>
                              <div>
                                <span className="font-semibold">
                                  Decision guidance:
                                </span>{" "}
                                {applicant.vettingStatus === "qualified"
                                  ? "Core configured requirements appear satisfied."
                                  : applicant.vettingStatus ===
                                      "not_yet_qualified"
                                    ? "Configured knockout requirement(s) were not satisfied."
                                    : "Needs human review due to partial or lower-confidence signals."}
                              </div>
                              {applicant.overrideReason ? (
                                <div>
                                  <span className="font-semibold">
                                    Override reason:
                                  </span>{" "}
                                  {applicant.overrideReason}
                                </div>
                              ) : null}
                            </div>
                            <textarea
                              value={
                                notesDraft[applicant._id] ??
                                applicant.employerNote ??
                                ""
                              }
                              onChange={(e) =>
                                setNotesDraft((cur) => ({
                                  ...cur,
                                  [applicant._id]: e.target.value,
                                }))
                              }
                              placeholder="Add internal notes for this applicant"
                              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                              rows={2}
                            />
                            {(applicant.hiringStatus || "new") !==
                            "rejected" ? (
                              <input
                                value={
                                  reasonDraft[applicant._id] ??
                                  applicant.rejectionReason ??
                                  ""
                                }
                                onChange={(e) =>
                                  setReasonDraft((cur) => ({
                                    ...cur,
                                    [applicant._id]: e.target.value,
                                  }))
                                }
                                placeholder="Optional rejection reason"
                                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                              />
                            ) : null}
                            <div className="flex flex-wrap gap-2">
                              {STATUS_ORDER.map((next) => {
                                const active =
                                  (applicant.hiringStatus || "new") === next;
                                return (
                                  <button
                                    key={next}
                                    disabled={
                                      busyId === applicant._id || active
                                    }
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
                              <button
                                disabled={busyId === applicant._id}
                                onClick={() => loadMessages(applicant._id)}
                                className="px-3 py-1.5 text-xs rounded border border-blue-400/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 disabled:opacity-60"
                              >
                                Request info
                              </button>
                              <button
                                disabled={busyId === applicant._id}
                                onClick={() =>
                                  updateStatus(
                                    applicant._id,
                                    (applicant.hiringStatus ||
                                      "new") as HiringStatus,
                                    { manualOverride: true },
                                  )
                                }
                                className="px-3 py-1.5 text-xs rounded border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                              >
                                Apply manual override
                              </button>
                              {NEXT_STATUS[
                                (applicant.hiringStatus ||
                                  "new") as HiringStatus
                              ] ? (
                                <button
                                  disabled={busyId === applicant._id}
                                  onClick={() =>
                                    updateStatus(
                                      applicant._id,
                                      NEXT_STATUS[
                                        (applicant.hiringStatus ||
                                          "new") as HiringStatus
                                      ] as HiringStatus,
                                    )
                                  }
                                  className="px-3 py-1.5 text-xs rounded border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                                >
                                  Move to{" "}
                                  {
                                    STATUS_LABEL[
                                      NEXT_STATUS[
                                        (applicant.hiringStatus ||
                                          "new") as HiringStatus
                                      ] as HiringStatus
                                    ]
                                  }
                                </button>
                              ) : null}
                              {(applicant.hiringStatus || "new") !==
                              "rejected" ? (
                                <button
                                  disabled={busyId === applicant._id}
                                  onClick={() =>
                                    updateStatus(applicant._id, "rejected")
                                  }
                                  className="px-3 py-1.5 text-xs rounded border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              ) : null}
                            </div>

                            {applicant.statusHistory?.length ? (
                              <div className="mt-2 rounded border border-gray-700 bg-gray-900/60 p-2">
                                <p className="text-xs text-gray-400 mb-1">
                                  History
                                </p>
                                <ul className="space-y-1 text-xs text-gray-300">
                                  {applicant.statusHistory
                                    .slice(0, 4)
                                    .map((h, i) => (
                                      <li key={`${applicant._id}-h-${i}`}>
                                        Moved to {STATUS_LABEL[h.status]} on{" "}
                                        {h.changedAt
                                          ? new Date(
                                              h.changedAt,
                                            ).toLocaleString()
                                          : "unknown date"}
                                        {h.actor ? ` by ${h.actor}` : ""}
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            ) : null}

                            {applicant.hiringStatus === "shortlisted" ||
                            applicant.hiringStatus === "contacted" ? (
                              <div className="mt-2 rounded border border-gray-700 bg-gray-900/60 p-2 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-300">
                                    Applicant Messages
                                  </p>
                                  <button
                                    onClick={() => loadMessages(applicant._id)}
                                    className="text-xs text-blue-300 hover:underline"
                                  >
                                    Load history
                                  </button>
                                </div>
                                {messagesByApplicant[applicant._id]?.length ? (
                                  <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                                    {messagesByApplicant[applicant._id].map(
                                      (m) => (
                                        <div
                                          key={m._id}
                                          className="rounded border border-gray-700 p-1.5"
                                        >
                                          <div className="text-gray-400">
                                            {m.sender} •{" "}
                                            {new Date(
                                              m.createdAt,
                                            ).toLocaleString()}
                                          </div>
                                          <div className="text-gray-200">
                                            {m.body}
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ) : null}
                                <textarea
                                  value={messageDraft[applicant._id] || ""}
                                  onChange={(e) =>
                                    setMessageDraft((cur) => ({
                                      ...cur,
                                      [applicant._id]: e.target.value,
                                    }))
                                  }
                                  rows={2}
                                  placeholder="Send applicant a message"
                                  className="w-full rounded border border-gray-700 bg-black/40 px-2 py-1 text-xs"
                                />
                                <button
                                  disabled={busyId === applicant._id}
                                  onClick={() => sendMessage(applicant)}
                                  className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                                >
                                  Send Message
                                </button>
                              </div>
                            ) : null}
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requirePageRole(ctx, ["employer"], "/employer/applicants");
};
