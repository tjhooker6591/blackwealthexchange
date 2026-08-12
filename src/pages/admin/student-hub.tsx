import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { requireAdminPageProps } from "@/lib/adminPageGuard";

type AdminStudentHubRecord = {
  id: string;
  title: string;
  organization: string;
  derivedStatus:
    | "open"
    | "upcoming"
    | "closing_soon"
    | "closed"
    | "needs_review";
  statusLabel: string;
  sourceUrl: string;
  applicationUrl: string;
  lastVerifiedAt?: string | null;
  nextReviewAt?: string | null;
  stale: boolean;
  brokenLink?: boolean;
  duplicateGroup?: string | null;
  legacySourcePages: string[];
};

type AdminStudentHubResponse = {
  records: AdminStudentHubRecord[];
  counts: {
    total: number;
    open: number;
    upcoming: number;
    closingSoon: number;
    closed: number;
    needsReview: number;
    stale: number;
    brokenLinks: number;
    duplicateGroups: number;
  };
  legacySummary: {
    legacyRecordTotal: number;
    uniqueOpportunityTotal: number;
    duplicateRawRecords: number;
  };
};

function fmtDate(value?: string | null) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString();
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "Closing soon", value: "closing_soon" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Closed", value: "closed" },
  { label: "Needs review", value: "needs_review" },
] as const;

const REVIEW_FILTERS = [
  { label: "All records", value: "" },
  { label: "Needs review", value: "needs_review" },
  { label: "Stale", value: "stale" },
  { label: "Broken links", value: "broken" },
  { label: "Duplicates", value: "duplicates" },
] as const;

export default function StudentHubAdminPage() {
  const [records, setRecords] = useState<AdminStudentHubRecord[]>([]);
  const [counts, setCounts] = useState<
    AdminStudentHubResponse["counts"] | null
  >(null);
  const [legacySummary, setLegacySummary] = useState<
    AdminStudentHubResponse["legacySummary"] | null
  >(null);
  const [status, setStatus] = useState("");
  const [review, setReview] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (review) params.set("review", review);
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/admin/student-hub?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      const data: AdminStudentHubResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          (data as any)?.error || "Failed to load Student Hub admin",
        );
      }

      setRecords(data.records || []);
      setCounts(data.counts || null);
      setLegacySummary(data.legacySummary || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load Student Hub admin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status, review]);

  const summaryCards = useMemo(() => {
    if (!counts || !legacySummary) return [];
    return [
      { label: "Unique records", value: counts.total },
      { label: "Legacy raw records", value: legacySummary.legacyRecordTotal },
      { label: "Open", value: counts.open },
      { label: "Closing soon", value: counts.closingSoon },
      { label: "Upcoming", value: counts.upcoming },
      { label: "Closed", value: counts.closed },
      { label: "Needs review", value: counts.needsReview },
      { label: "Broken links", value: counts.brokenLinks },
    ];
  }, [counts, legacySummary]);

  return (
    <>
      <Head>
        <title>Admin | Student Hub</title>
      </Head>

      <main className="min-h-screen bg-black p-6 text-white md:p-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gold">
                Student Hub Admin
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Review current, upcoming, closing, duplicate, stale, and
                needs-review opportunity records from one canonical catalog.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/dashboard"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Admin Dashboard
              </Link>
            </div>
          </header>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {card.label}
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search title, organization, tag, or URL"
              className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={review}
              onChange={(event) => setReview(event.target.value)}
              className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
            >
              {REVIEW_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => void load()}
              className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/20"
            >
              Refresh
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-zinc-300">
              Loading Student Hub records…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="p-3">Record</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Legacy pages</th>
                    <th className="p-3">Verified</th>
                    <th className="p-3">Review</th>
                    <th className="p-3">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-zinc-900 align-top"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-white">
                          {record.title}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {record.organization}
                        </div>
                        <div className="mt-2 text-xs text-zinc-500">
                          {record.id}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">
                          {record.statusLabel}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-300">
                        {record.legacySourcePages.join(", ") || "n/a"}
                      </td>
                      <td className="p-3 text-zinc-300">
                        <div>
                          Last verified: {fmtDate(record.lastVerifiedAt)}
                        </div>
                        <div>Next review: {fmtDate(record.nextReviewAt)}</div>
                      </td>
                      <td className="p-3 text-zinc-300">
                        <div>{record.stale ? "Stale" : "Fresh"}</div>
                        <div>
                          {record.brokenLink ? "Broken link" : "Links healthy"}
                        </div>
                        <div>
                          {record.duplicateGroup
                            ? `Duplicate group: ${record.duplicateGroup}`
                            : "Canonical record"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-2">
                          <a
                            href={record.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gold hover:underline"
                          >
                            Source
                          </a>
                          <a
                            href={record.applicationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gold hover:underline"
                          >
                            Application
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/student-hub");
