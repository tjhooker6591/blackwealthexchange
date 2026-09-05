// /src/pages/black-student-opportunities/index.tsx
import type { GetServerSideProps } from "next";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  getPublicStudentHubPageRecords,
  type PublicStudentHubRecord,
} from "@/lib/studentHub/public";
import { useStudentHubPageView } from "@/hooks/useStudentHubPageView";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const HUB_PATH = "/black-student-opportunities";

const CORE_ROUTES = [
  {
    title: "Grants",
    desc: "Gift aid + trusted resources to reduce the cost of school.",
    href: "/black-student-opportunities/grants",
    badge: "Funding",
  },
  {
    title: "Internships",
    desc: "Experience + career entry points—paid when possible.",
    href: "/black-student-opportunities/internships",
    badge: "Career",
  },
  {
    title: "Mentorship",
    desc: "Mentors, coaching, and networks that open doors faster.",
    href: "/black-student-opportunities/mentorship",
    badge: "Network",
  },
] as const;

const TYPES = [
  "All",
  "Internship",
  "Scholarship",
  "Grant",
  "Fellowship",
  "Mentorship",
  "Research",
  "Competition",
  "Career",
];

const LEVELS = ["All", "High School", "Undergrad", "Graduate", "Any"];

const MODES = ["All", "Remote", "In-Person", "Hybrid", "Any"];

const FIELDS = [
  "All",
  "STEM",
  "Business",
  "Healthcare",
  "Creative",
  "Public Service",
  "Finance",
  "Any",
] as const;

type Opportunity = {
  id: string;
  title: string;
  org: string;
  type: (typeof TYPES)[number];
  level: (typeof LEVELS)[number];
  mode: (typeof MODES)[number];
  field: (typeof FIELDS)[number];
  note: string;
  href: string;
  isFeatured?: boolean;
  statusLabel: string;
};

function formatType(record: PublicStudentHubRecord): Opportunity["type"] {
  switch (record.opportunityType) {
    case "internship":
      return "Internship";
    case "scholarship":
    case "financial_aid":
      return "Scholarship";
    case "grant":
      return "Grant";
    case "fellowship":
      return "Fellowship";
    case "research":
      return "Research";
    case "mentorship":
      return "Mentorship";
    default:
      return "Career";
  }
}

function formatLevel(record: PublicStudentHubRecord): Opportunity["level"] {
  switch (record.studentLevel) {
    case "high_school":
      return "High School";
    case "undergraduate":
      return "Undergrad";
    case "graduate":
      return "Graduate";
    default:
      return "Any";
  }
}

function formatMode(record: PublicStudentHubRecord): Opportunity["mode"] {
  switch (record.attendanceMode) {
    case "remote":
      return "Remote";
    case "in_person":
      return "In-Person";
    case "hybrid":
      return "Hybrid";
    default:
      return "Any";
  }
}

function formatField(record: PublicStudentHubRecord): Opportunity["field"] {
  const discipline = (record.discipline || "").toLowerCase();
  if (discipline.includes("stem") || discipline.includes("health"))
    return "STEM";
  if (discipline.includes("finance") || discipline.includes("account"))
    return "Finance";
  if (discipline.includes("business") || discipline.includes("consult"))
    return "Business";
  if (discipline.includes("creative") || discipline.includes("design"))
    return "Creative";
  if (discipline.includes("public")) return "Public Service";
  return "Any";
}

export default function StudentOpportunitiesHub({
  initialRecords,
}: {
  initialRecords: PublicStudentHubRecord[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");
  const [mode, setMode] = useState<(typeof MODES)[number]>("All");
  const [field, setField] = useState<(typeof FIELDS)[number]>("All");

  useStudentHubPageView("hub_home");

  React.useEffect(() => {
    if (!router.isReady) return;
    const queryValue =
      typeof router.query.q === "string"
        ? router.query.q
        : typeof router.query.search === "string"
          ? router.query.search
          : "";
    if (queryValue) setQ(queryValue);
  }, [router.isReady, router.query.q, router.query.search]);

  const data = useMemo(() => {
    return initialRecords.map(
      (record): Opportunity => ({
        id: record.id,
        title: record.title,
        org: record.organization,
        type: formatType(record),
        level: formatLevel(record),
        mode: formatMode(record),
        field: formatField(record),
        note: record.statusNote || record.description,
        href: record.applicationUrl,
        isFeatured: Boolean(record.featured),
        statusLabel: record.statusLabel,
      }),
    );
  }, [initialRecords]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return data.filter((o) => {
      const matchesQuery =
        !query ||
        `${o.title} ${o.org} ${o.type} ${o.level} ${o.mode} ${o.field} ${o.note}`
          .toLowerCase()
          .includes(query);

      const matchesType = type === "All" ? true : o.type === type;
      const matchesLevel =
        level === "All" ? true : o.level === level || o.level === "Any";
      const matchesMode =
        mode === "All" ? true : o.mode === mode || o.mode === "Any";
      const matchesField =
        field === "All" ? true : o.field === field || o.field === "Any";

      return (
        matchesQuery &&
        matchesType &&
        matchesLevel &&
        matchesMode &&
        matchesField
      );
    });
  }, [q, data, type, level, mode, field]);

  const featured = useMemo(
    () => filtered.filter((x) => x.isFeatured).slice(0, 6),
    [filtered],
  );

  const summary = useMemo(() => {
    const internships = data.filter(
      (item) => item.type === "Internship",
    ).length;
    const scholarships = data.filter(
      (item) => item.type === "Scholarship" || item.type === "Grant",
    ).length;
    const mentorship = data.filter((item) => item.type === "Mentorship").length;

    return {
      total: data.length,
      internships,
      scholarships,
      mentorship,
    };
  }, [data]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 right-[-8rem] h-[440px] w-[440px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <main className="bwe-section-wrap relative z-10 py-8 sm:py-10">
        <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_78%_28%,rgba(93,211,158,0.12),transparent_28%)]" />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/72">
                <Image
                  src="/favicon.png"
                  alt="Black Wealth Exchange"
                  width={20}
                  height={20}
                  className="rounded-full"
                  priority
                />
                <span className="font-semibold tracking-[0.12em] text-[var(--accent)]">
                  STUDENT HUB
                </span>
              </div>

              <div className="bwe-eyebrow mt-4">Opportunity discovery</div>
              <h1 className="bwe-display-title mt-3 max-w-[13ch]">
                Find grants, internships, mentorship, and career pathways.
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">
                Built with Black students in mind and open to all students who
                qualify, this hub keeps trusted opportunities easier to search,
                compare, and act on.
              </p>

              <div className="mt-5 grid gap-3 sm:flex sm:flex-row sm:flex-wrap">
                <Link
                  href="/signup"
                  className="bwe-cta-primary bwe-focus-ring justify-center px-6"
                >
                  Create student profile
                </Link>
                <Link
                  href="/login"
                  className="bwe-cta-secondary bwe-focus-ring justify-center px-6"
                >
                  Log in
                </Link>
                <Link
                  href="/"
                  className="bwe-open-link bwe-focus-ring justify-center text-sm text-white/82 sm:justify-start"
                >
                  Back to home
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Opportunities
                </div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {summary.total}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Funding
                </div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {summary.scholarships}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Internships
                </div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {summary.internships}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  Mentorship
                </div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {summary.mentorship}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="grid gap-3 md:grid-cols-3">
            {CORE_ROUTES.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="bwe-soft-tile bwe-focus-ring flex min-h-28 flex-col justify-between p-4 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="bwe-card-title">{route.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/62">
                      {route.desc}
                    </p>
                  </div>
                  <span className="bwe-badge" data-tone="accent">
                    {route.badge}
                  </span>
                </div>
                <span className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]">
                  Open
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div className="border-t border-white/8 pt-5 text-left">
            <div className="bwe-eyebrow">How to use this hub</div>
            <h2 className="bwe-section-title mt-2 max-w-2xl">
              Search current opportunities, narrow the list, and move into the
              next real step quickly.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-[15px]">
              Instead of scattered tabs and random links, BWE keeps funding,
              experience, and mentorship opportunities in one focused discovery
              surface with filters that actually work.
            </p>
          </div>

          <div className="bwe-soft-tile p-4 sm:p-5">
            <div className="bwe-eyebrow">Why students care</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/70">
              <li>Trusted sources stay easier to compare.</li>
              <li>Funding, internships, and mentorship live in one place.</li>
              <li>
                Profile creation and follow-on BWE actions stay connected.
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/join-the-mission"
                className="bwe-open-link bwe-focus-ring text-[var(--accent)]"
              >
                Join the mission
              </Link>
              <Link
                href={HUB_PATH}
                className="bwe-open-link bwe-focus-ring text-white/82"
              >
                Refresh hub
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="bwe-shell-panel rounded-[26px] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1">
                <div className="bwe-eyebrow">Search opportunities</div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search scholarships, internships, research, mentorship..."
                  className="bwe-input mt-3 bg-black/28"
                />
                <div className="mt-2 text-sm text-white/56">
                  {filtered.length} results
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:w-[520px] lg:grid-cols-4">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="bwe-select bg-black/28"
                  aria-label="Filter by opportunity type"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="bwe-select bg-black/28"
                  aria-label="Filter by student level"
                >
                  {LEVELS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="bwe-select bg-black/28"
                  aria-label="Filter by attendance mode"
                >
                  {MODES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  value={field}
                  onChange={(e) => setField(e.target.value as any)}
                  className="bwe-select bg-black/28"
                  aria-label="Filter by discipline"
                >
                  {FIELDS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {featured.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {featured.map((opportunity) => (
                  <a
                    key={opportunity.id}
                    href={opportunity.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bwe-badge hover:border-[rgba(212,175,55,0.35)] hover:text-[var(--accent)]"
                  >
                    {opportunity.org} · {opportunity.type}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.length ? (
              filtered.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className={cx(
                    "bwe-soft-tile flex h-full flex-col p-4 sm:p-5",
                    opportunity.isFeatured
                      ? "border-[rgba(212,175,55,0.22)]"
                      : "",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a
                        href={opportunity.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bwe-card-title text-[1.05rem] leading-snug text-[var(--accent)] hover:underline"
                      >
                        {opportunity.title}
                      </a>
                      <div className="mt-1 text-sm text-white/52">
                        {opportunity.org}
                      </div>
                    </div>

                    <a
                      href={opportunity.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bwe-cta-primary bwe-focus-ring shrink-0 px-3 py-2 text-xs"
                    >
                      {opportunity.statusLabel}
                    </a>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/64">
                    {opportunity.note}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      opportunity.type,
                      opportunity.level,
                      opportunity.mode,
                      opportunity.field,
                    ].map((tag) => (
                      <span key={tag} className="bwe-badge">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="bwe-state-panel md:col-span-2">
                <div className="bwe-state-title">
                  No opportunities match those filters yet.
                </div>
                <div className="bwe-state-copy">
                  Broaden the search or clear one of the filters to see more
                  results.
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="bwe-soft-tile p-4 sm:p-5">
              <div className="bwe-eyebrow">Winning system</div>
              <div className="mt-3 space-y-3 text-sm text-white/68">
                <div>
                  <span className="font-semibold text-white">1.</span> Create a
                  profile.
                </div>
                <div>
                  <span className="font-semibold text-white">2.</span> Narrow
                  the opportunity list.
                </div>
                <div>
                  <span className="font-semibold text-white">3.</span> Apply
                  with a clearer plan.
                </div>
                <div>
                  <span className="font-semibold text-white">4.</span> Keep
                  building leverage through mentorship and repeat action.
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/signup"
                  className="bwe-cta-primary bwe-focus-ring px-4 py-2.5 text-sm"
                >
                  Start with profile
                </Link>
                <Link
                  href="/black-student-opportunities/mentorship"
                  className="bwe-open-link bwe-focus-ring text-[var(--accent)]"
                >
                  Go to mentorship
                </Link>
              </div>
            </div>

            <div className="bwe-soft-tile p-4 sm:p-5">
              <div className="bwe-eyebrow">FAQ</div>
              <div className="mt-3 space-y-3">
                <details className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <summary className="cursor-pointer font-semibold text-white">
                    Is this focused on current opportunities?
                  </summary>
                  <div className="mt-2 text-sm leading-6 text-white/64">
                    Yes. The hub is structured around current public
                    opportunities and trusted official sources where possible.
                  </div>
                </details>
                <details className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <summary className="cursor-pointer font-semibold text-white">
                    Can BWE grow into alerts and saved opportunities?
                  </summary>
                  <div className="mt-2 text-sm leading-6 text-white/64">
                    Yes. This surface is designed to support deeper tracking and
                    return behavior as later phases unlock more personalized
                    features.
                  </div>
                </details>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { records } = await getPublicStudentHubPageRecords("hub");
  return {
    props: {
      initialRecords: records,
    },
  };
};
