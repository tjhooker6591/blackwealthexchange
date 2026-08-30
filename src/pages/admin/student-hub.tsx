import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { requireAdminPageProps } from "@/lib/adminPageGuard";

type StudentHubStatus =
  | "open"
  | "upcoming"
  | "closing_soon"
  | "closed"
  | "needs_review";

type AdminStudentHubRecord = {
  id: string;
  title: string;
  organization: string;
  opportunityType: string;
  categoryPages: string[];
  description: string;
  eligibilitySummary: string;
  eligibilityType: string;
  targetAudience?: string | null;
  institutionRelationship?: string | null;
  discipline?: string | null;
  studentLevel: string;
  location?: string | null;
  attendanceMode: string;
  opensAt?: string | null;
  deadline?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status: StudentHubStatus;
  source: string;
  sourceUrl: string;
  applicationUrl: string;
  lastVerifiedAt?: string | null;
  lastCheckedAt?: string | null;
  nextReviewAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  featured?: boolean;
  tags?: string[];
  statusNote?: string | null;
  howToApply?: string[];
  duplicateGroup?: string | null;
  sourceVerified?: boolean;
  applicationUrlVerified?: boolean;
  brokenLink?: boolean;
  archivedAt?: string | null;
  derivedStatus: StudentHubStatus;
  statusLabel: string;
  stale: boolean;
  current: boolean;
  upcoming: boolean;
  closed: boolean;
  daysUntilDeadline?: number | null;
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
  storage: {
    mode: "baseline_catalog" | "database";
    collection: string;
    seeded: boolean;
  };
  adminEmail?: string | null;
};

type FormState = {
  id: string;
  title: string;
  organization: string;
  opportunityType: string;
  categoryPages: string[];
  description: string;
  eligibilitySummary: string;
  eligibilityType: string;
  targetAudience: string;
  institutionRelationship: string;
  discipline: string;
  studentLevel: string;
  location: string;
  attendanceMode: string;
  opensAt: string;
  deadline: string;
  startsAt: string;
  endsAt: string;
  status: StudentHubStatus;
  source: string;
  sourceUrl: string;
  applicationUrl: string;
  lastVerifiedAt: string;
  nextReviewAt: string;
  featured: boolean;
  tags: string;
  statusNote: string;
  howToApply: string;
  sourceVerified: boolean;
  applicationUrlVerified: boolean;
  brokenLink: boolean;
};

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

const OPPORTUNITY_TYPES = [
  "scholarship",
  "financial_aid",
  "grant",
  "internship",
  "fellowship",
  "research",
  "student_job",
  "mentorship",
  "career_development",
  "entrepreneurship",
  "conference",
  "event",
  "hbcu_resource",
] as const;

const CATEGORY_PAGES = [
  "hub",
  "scholarships",
  "grants",
  "internships",
  "mentorship",
] as const;

const ELIGIBILITY_TYPES = [
  "black_student_specific",
  "black_student_targeted",
  "hbcu_student_specific",
  "hbcu_outreach",
  "open_to_all_eligible_students",
  "needs_review",
] as const;

const STUDENT_LEVELS = [
  "high_school",
  "undergraduate",
  "graduate",
  "any",
] as const;

const ATTENDANCE_MODES = ["remote", "in_person", "hybrid", "any"] as const;

const INSTITUTION_RELATIONSHIPS = [
  "hbcu",
  "non_hbcu",
  "multi_institution",
  "none",
] as const;

function fmtDate(value?: string | null) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString();
}

function joinLines(values?: string[]) {
  return Array.isArray(values) ? values.join("\n") : "";
}

function joinComma(values?: string[]) {
  return Array.isArray(values) ? values.join(", ") : "";
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitComma(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function emptyForm(): FormState {
  return {
    id: "",
    title: "",
    organization: "",
    opportunityType: "scholarship",
    categoryPages: ["hub"],
    description: "",
    eligibilitySummary: "",
    eligibilityType: "open_to_all_eligible_students",
    targetAudience: "",
    institutionRelationship: "none",
    discipline: "",
    studentLevel: "undergraduate",
    location: "",
    attendanceMode: "any",
    opensAt: "",
    deadline: "",
    startsAt: "",
    endsAt: "",
    status: "open",
    source: "",
    sourceUrl: "",
    applicationUrl: "",
    lastVerifiedAt: "",
    nextReviewAt: "",
    featured: false,
    tags: "",
    statusNote: "",
    howToApply: "",
    sourceVerified: false,
    applicationUrlVerified: false,
    brokenLink: false,
  };
}

function formFromRecord(record: AdminStudentHubRecord): FormState {
  return {
    id: record.id,
    title: record.title,
    organization: record.organization,
    opportunityType: record.opportunityType,
    categoryPages: record.categoryPages || ["hub"],
    description: record.description,
    eligibilitySummary: record.eligibilitySummary,
    eligibilityType: record.eligibilityType,
    targetAudience: record.targetAudience || "",
    institutionRelationship: record.institutionRelationship || "none",
    discipline: record.discipline || "",
    studentLevel: record.studentLevel,
    location: record.location || "",
    attendanceMode: record.attendanceMode,
    opensAt: record.opensAt || "",
    deadline: record.deadline || "",
    startsAt: record.startsAt || "",
    endsAt: record.endsAt || "",
    status: record.status,
    source: record.source,
    sourceUrl: record.sourceUrl,
    applicationUrl: record.applicationUrl,
    lastVerifiedAt: record.lastVerifiedAt || "",
    nextReviewAt: record.nextReviewAt || "",
    featured: Boolean(record.featured),
    tags: joinComma(record.tags),
    statusNote: record.statusNote || "",
    howToApply: joinLines(record.howToApply),
    sourceVerified: Boolean(record.sourceVerified),
    applicationUrlVerified: Boolean(record.applicationUrlVerified),
    brokenLink: Boolean(record.brokenLink),
  };
}

function recordTone(status: StudentHubStatus) {
  switch (status) {
    case "closing_soon":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "upcoming":
      return "border-sky-500/30 bg-sky-500/10 text-sky-100";
    case "closed":
      return "border-zinc-700 bg-zinc-800 text-zinc-200";
    case "needs_review":
      return "border-rose-500/30 bg-rose-500/10 text-rose-100";
    default:
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  }
}

export default function StudentHubAdminPage() {
  const [records, setRecords] = useState<AdminStudentHubRecord[]>([]);
  const [counts, setCounts] = useState<
    AdminStudentHubResponse["counts"] | null
  >(null);
  const [legacySummary, setLegacySummary] = useState<
    AdminStudentHubResponse["legacySummary"] | null
  >(null);
  const [storage, setStorage] = useState<
    AdminStudentHubResponse["storage"] | null
  >(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [review, setReview] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) || null,
    [records, selectedId],
  );

  const summaryCards = useMemo(() => {
    if (!counts || !legacySummary) return [];
    return [
      { label: "Canonical records", value: counts.total },
      { label: "Legacy raw records", value: legacySummary.legacyRecordTotal },
      { label: "Open", value: counts.open },
      { label: "Closing soon", value: counts.closingSoon },
      { label: "Upcoming", value: counts.upcoming },
      { label: "Closed", value: counts.closed },
      { label: "Needs review", value: counts.needsReview },
      { label: "Broken links", value: counts.brokenLinks },
    ];
  }, [counts, legacySummary]);

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
      const data: AdminStudentHubResponse | { error?: string } =
        await res.json();

      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Failed to load");
      }

      const next = data as AdminStudentHubResponse;
      setRecords(next.records || []);
      setCounts(next.counts || null);
      setLegacySummary(next.legacySummary || null);
      setStorage(next.storage || null);
      setAdminEmail(next.adminEmail || null);

      if (selectedId) {
        const freshSelection =
          (next.records || []).find((record) => record.id === selectedId) ||
          null;
        if (freshSelection) {
          setForm(formFromRecord(freshSelection));
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load Student Hub admin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status, review]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleCategoryPage(page: (typeof CATEGORY_PAGES)[number]) {
    setForm((current) => {
      const has = current.categoryPages.includes(page);
      return {
        ...current,
        categoryPages: has
          ? current.categoryPages.filter((entry) => entry !== page)
          : [...current.categoryPages, page],
      };
    });
  }

  function startCreate() {
    setSelectedId(null);
    setSuccess("");
    setError("");
    setForm(emptyForm());
  }

  function startEdit(record: AdminStudentHubRecord) {
    setSelectedId(record.id);
    setSuccess("");
    setError("");
    setForm(formFromRecord(record));
  }

  async function submit(
    method: "POST" | "PATCH",
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/student-hub", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setSuccess(successMessage);
      await load();

      if (data?.record?.id) {
        setSelectedId(data.record.id);
      }
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const payload = {
      id: form.id || undefined,
      title: form.title,
      organization: form.organization,
      opportunityType: form.opportunityType,
      categoryPages: form.categoryPages,
      description: form.description,
      eligibilitySummary: form.eligibilitySummary,
      eligibilityType: form.eligibilityType,
      targetAudience: form.targetAudience || null,
      institutionRelationship: form.institutionRelationship || "none",
      discipline: form.discipline || null,
      studentLevel: form.studentLevel,
      location: form.location || null,
      attendanceMode: form.attendanceMode,
      opensAt: form.opensAt || null,
      deadline: form.deadline || null,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      status: form.status,
      source: form.source,
      sourceUrl: form.sourceUrl,
      applicationUrl: form.applicationUrl,
      lastVerifiedAt: form.lastVerifiedAt || null,
      nextReviewAt: form.nextReviewAt || null,
      featured: form.featured,
      tags: splitComma(form.tags),
      statusNote: form.statusNote || null,
      howToApply: splitLines(form.howToApply),
      sourceVerified: form.sourceVerified,
      applicationUrlVerified: form.applicationUrlVerified,
      brokenLink: form.brokenLink,
    };

    if (selectedId) {
      await submit(
        "PATCH",
        { action: "update", ...payload },
        "Student Hub record updated.",
      );
      return;
    }

    await submit("POST", payload, "Student Hub record created.");
  }

  async function handleArchive() {
    if (!selectedId) return;
    if (!window.confirm("Archive and close this opportunity?")) return;
    await submit(
      "PATCH",
      { action: "archive", id: selectedId },
      "Student Hub record archived.",
    );
  }

  async function handleMarkVerified() {
    if (!selectedId) return;
    await submit(
      "PATCH",
      { action: "mark_verified", id: selectedId },
      "Student Hub record marked verified.",
    );
  }

  async function handleSeedBaseline() {
    await submit(
      "POST",
      { action: "seed_baseline" },
      "Baseline catalog seeded into Student Hub storage.",
    );
  }

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
                Maintain the canonical Student Hub catalog, review lifecycle
                state, and keep public opportunity data current without editing
                source files.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Storage mode:{" "}
                <span className="font-semibold text-zinc-300">
                  {storage?.mode === "database"
                    ? "database-backed"
                    : "baseline catalog fallback"}
                </span>
                {storage?.collection ? ` • ${storage.collection}` : ""}
                {adminEmail ? ` • ${adminEmail}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void handleSeedBaseline()}
                disabled={saving}
                className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 hover:bg-sky-500/20 disabled:opacity-60"
              >
                Seed Baseline
              </button>
              <button
                onClick={startCreate}
                className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/20"
              >
                Add Opportunity
              </button>
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
              placeholder="Search title, organization, tags, source, or links"
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
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Refresh
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {success}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <div className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
                Canonical catalog records
              </div>

              {loading ? (
                <div className="p-5 text-sm text-zinc-300">
                  Loading Student Hub records…
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="p-3">Record</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Verification</th>
                        <th className="p-3">Actions</th>
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
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-300">
                              {record.categoryPages.map((page) => (
                                <span
                                  key={page}
                                  className="rounded-full border border-zinc-700 px-2 py-1"
                                >
                                  {page}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <div
                              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${recordTone(record.derivedStatus)}`}
                            >
                              {record.statusLabel}
                            </div>
                            <div className="mt-2 text-xs text-zinc-400">
                              {record.stale
                                ? "Stale verification"
                                : "Fresh verification"}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {record.brokenLink
                                ? "Broken link flagged"
                                : "Links healthy"}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-zinc-300">
                            <div>
                              Last verified: {fmtDate(record.lastVerifiedAt)}
                            </div>
                            <div className="mt-1">
                              Next review: {fmtDate(record.nextReviewAt)}
                            </div>
                            <div className="mt-1">
                              Legacy pages:{" "}
                              {record.legacySourcePages.length
                                ? record.legacySourcePages.join(", ")
                                : "n/a"}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => startEdit(record)}
                                className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/20"
                              >
                                Edit
                              </button>
                              <a
                                href={record.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-sky-200 hover:underline"
                              >
                                Source
                              </a>
                              <a
                                href={record.applicationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-sky-200 hover:underline"
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
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedRecord ? "Edit Opportunity" : "Add Opportunity"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Maintain Student Hub records through the canonical admin
                    path.
                  </p>
                </div>
                {selectedRecord ? (
                  <button
                    onClick={startCreate}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    New record
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Title</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Organization</span>
                  <input
                    value={form.organization}
                    onChange={(event) =>
                      updateForm("organization", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Opportunity type</span>
                  <select
                    value={form.opportunityType}
                    onChange={(event) =>
                      updateForm("opportunityType", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  >
                    {OPPORTUNITY_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Lifecycle status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value as StudentHubStatus,
                      )
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  >
                    {STATUS_FILTERS.filter((option) => option.value).map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <label className="mt-4 block space-y-2 text-sm">
                <span className="text-zinc-300">Category pages</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_PAGES.map((page) => {
                    const active = form.categoryPages.includes(page);
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => toggleCategoryPage(page)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          active
                            ? "border-gold/40 bg-gold/10 text-gold"
                            : "border-zinc-700 bg-black text-zinc-300"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="mt-4 block space-y-2 text-sm">
                <span className="text-zinc-300">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  rows={4}
                  className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                />
              </label>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Eligibility summary</span>
                  <textarea
                    value={form.eligibilitySummary}
                    onChange={(event) =>
                      updateForm("eligibilitySummary", event.target.value)
                    }
                    rows={4}
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Target audience</span>
                  <textarea
                    value={form.targetAudience}
                    onChange={(event) =>
                      updateForm("targetAudience", event.target.value)
                    }
                    rows={4}
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Eligibility type</span>
                  <select
                    value={form.eligibilityType}
                    onChange={(event) =>
                      updateForm("eligibilityType", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  >
                    {ELIGIBILITY_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Student level</span>
                  <select
                    value={form.studentLevel}
                    onChange={(event) =>
                      updateForm("studentLevel", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  >
                    {STUDENT_LEVELS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Attendance mode</span>
                  <select
                    value={form.attendanceMode}
                    onChange={(event) =>
                      updateForm("attendanceMode", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  >
                    {ATTENDANCE_MODES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">
                    Institution relationship
                  </span>
                  <select
                    value={form.institutionRelationship}
                    onChange={(event) =>
                      updateForm("institutionRelationship", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  >
                    {INSTITUTION_RELATIONSHIPS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Discipline</span>
                  <input
                    value={form.discipline}
                    onChange={(event) =>
                      updateForm("discipline", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Location</span>
                  <input
                    value={form.location}
                    onChange={(event) =>
                      updateForm("location", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Source</span>
                  <input
                    value={form.source}
                    onChange={(event) =>
                      updateForm("source", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Source URL</span>
                  <input
                    value={form.sourceUrl}
                    onChange={(event) =>
                      updateForm("sourceUrl", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-zinc-300">Application URL</span>
                  <input
                    value={form.applicationUrl}
                    onChange={(event) =>
                      updateForm("applicationUrl", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Opens at</span>
                  <input
                    type="date"
                    value={form.opensAt}
                    onChange={(event) =>
                      updateForm("opensAt", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Deadline</span>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(event) =>
                      updateForm("deadline", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Program starts</span>
                  <input
                    type="date"
                    value={form.startsAt}
                    onChange={(event) =>
                      updateForm("startsAt", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Program ends</span>
                  <input
                    type="date"
                    value={form.endsAt}
                    onChange={(event) =>
                      updateForm("endsAt", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Last verified</span>
                  <input
                    type="date"
                    value={form.lastVerifiedAt}
                    onChange={(event) =>
                      updateForm("lastVerifiedAt", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Next review</span>
                  <input
                    type="date"
                    value={form.nextReviewAt}
                    onChange={(event) =>
                      updateForm("nextReviewAt", event.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">Status note</span>
                  <textarea
                    value={form.statusNote}
                    onChange={(event) =>
                      updateForm("statusNote", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-zinc-300">How to apply</span>
                  <textarea
                    value={form.howToApply}
                    onChange={(event) =>
                      updateForm("howToApply", event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                    placeholder="One step per line"
                  />
                </label>
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="text-zinc-300">Tags</span>
                  <input
                    value={form.tags}
                    onChange={(event) => updateForm("tags", event.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white outline-none focus:border-gold/60"
                    placeholder="Comma-separated tags"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {[
                  ["featured", "Featured"],
                  ["sourceVerified", "Source verified"],
                  ["applicationUrlVerified", "Application URL verified"],
                  ["brokenLink", "Broken link flagged"],
                ].map(([key, label]) => (
                  <label key={key} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(form[key as keyof FormState])}
                      onChange={(event) =>
                        updateForm(
                          key as keyof FormState,
                          event.target.checked as never,
                        )
                      }
                    />
                    <span className="text-zinc-300">{label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : selectedRecord
                      ? "Save changes"
                      : "Create record"}
                </button>
                {selectedRecord ? (
                  <>
                    <button
                      onClick={() => void handleMarkVerified()}
                      disabled={saving}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
                    >
                      Mark verified
                    </button>
                    <button
                      onClick={() => void handleArchive()}
                      disabled={saving}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/20 disabled:opacity-60"
                    >
                      Archive / close
                    </button>
                  </>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/student-hub");
