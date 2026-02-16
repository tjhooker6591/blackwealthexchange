// /pages/black-student-opportunities/mentorship.tsx
import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Program = {
  title: string;
  org: string;
  summary: string;
  who: string;
  format: string;
  tags: Array<"Career" | "STEM" | "Business" | "Leadership" | "Finance" | "Community">;
  href: string;
};

const HUB_PATH = "/black-student-opportunities";

const PROGRAMS: Program[] = [
  {
    title: "MLT Career Prep",
    org: "Management Leadership for Tomorrow (MLT)",
    summary:
      "A structured coaching + community program for high-achieving undergrads to build career readiness, leadership, and long-term networks.",
    who: "Undergraduates (varies by cohort)",
    format: "Coaching + community + skill-building",
    tags: ["Career", "Leadership", "Business"],
    href: "https://mlt.org/career-prep/",
  },
  {
    title: "INROADS",
    org: "INROADS",
    summary:
      "Development-focused experience connecting students with professional opportunities plus ongoing support and growth pathways.",
    who: "Students & early-career talent (varies)",
    format: "Career development + opportunities",
    tags: ["Career", "Leadership", "Business"],
    href: "https://inroads.org/",
  },
  {
    title: "SEO Career (Mentorship / Coach & Mentor network)",
    org: "Sponsors for Educational Opportunity (SEO)",
    summary:
      "A career access network for high-achieving undergrads that includes professional guidance and mentorship pathways.",
    who: "High-achieving undergraduates",
    format: "Mentors + professional development",
    tags: ["Career", "Leadership", "Finance"],
    href: "https://careers.seo-usa.org/mentor",
  },
  {
    title: "NSBE Professional Development Program",
    org: "National Society of Black Engineers (NSBE)",
    summary:
      "Member-focused professional development that includes mentoring and career support resources in STEM pathways.",
    who: "NSBE members (students + professionals)",
    format: "Mentoring + professional development",
    tags: ["STEM", "Career", "Leadership"],
    href: "https://nsbe.org/initiative/professional-development-program/",
  },
  {
    title: "NABA Mentoring Program (Student-focused)",
    org: "National Association of Black Accountants (NABA)",
    summary:
      "Chapter-based mentoring and guidance designed to support students with career development, accountability, and professional growth.",
    who: "Students (chapter/member programs vary)",
    format: "Mentor matching + chapter support",
    tags: ["Finance", "Career", "Community"],
    href: "https://community.nabainc.org/shpcchapter/aboutus/naba-mentoring-program",
  },
  {
    title: "The Posse Program",
    org: "The Posse Foundation",
    summary:
      "A cohort-based model supporting students through college with training, leadership development, and ongoing community support.",
    who: "Students selected through Posse cohorts",
    format: "Cohort model + leadership + support network",
    tags: ["Leadership", "Community", "Career"],
    href: "https://www.possefoundation.org/shaping-the-future/the-posse-program",
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const TAGS: Array<"All" | Program["tags"][number]> = [
  "All",
  "Career",
  "STEM",
  "Business",
  "Leadership",
  "Finance",
  "Community",
];

export default function Mentorship() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<(typeof TAGS)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROGRAMS.filter((p) => {
      const matchesTag = tag === "All" ? true : p.tags.includes(tag);
      const matchesQuery =
        !q ||
        `${p.title} ${p.org} ${p.summary} ${p.who} ${p.format} ${p.tags.join(" ")}`
          .toLowerCase()
          .includes(q);
      return matchesTag && matchesQuery;
    });
  }, [query, tag]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35 pointer-events-none"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 pointer-events-none" />

      {/* Subtle glow accents (match index vibe) */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />

      {/* Header */}
      <header className="text-center pt-10 pb-6 sm:pt-12 sm:pb-8 relative z-10">
        <Image
          src="/favicon.png"
          alt="Black Wealth Exchange Logo"
          width={96}
          height={96}
          className="mx-auto mb-3 sm:mb-4"
          priority
        />
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-gold neon-text leading-tight max-w-3xl mx-auto">
          Mentorship for Black Students (2026)
        </h1>
        <p className="text-sm sm:text-base md:text-lg mt-3 text-gray-300 max-w-2xl mx-auto">
          Mentorship is how you compress time: better decisions, stronger networks,
          and a clearer path from school to opportunity.
        </p>

        {/* Quick nav */}
        <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href={HUB_PATH}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/15 hover:border-yellow-300/60 hover:bg-white/15 transition text-sm font-semibold"
          >
            ← Back to Student Hub
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-full bg-gold text-black hover:bg-yellow-500 transition text-sm font-semibold shadow"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 pb-14 relative z-10">
        {/* Filter bar */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-xl p-4 sm:p-5">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                  Search programs
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by program, field, or keyword…"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/20 outline-none transition text-sm"
                />
              </div>

              <div className="md:w-64">
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">
                  Filter
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TAGS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTag(t)}
                      className={cx(
                        "px-3 py-2 rounded-full text-xs font-semibold border transition",
                        tag === t
                          ? "bg-gold text-black border-yellow-300 shadow"
                          : "bg-white/5 text-white border-white/10 hover:border-yellow-300/50 hover:bg-white/10"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
              <div>
                Showing{" "}
                <span className="text-white font-semibold">{filtered.length}</span>{" "}
                program{filtered.length === 1 ? "" : "s"}
              </div>
              <div className="text-gray-500">
                Tip: deadlines change—always confirm on the official page.
              </div>
            </div>
          </div>
        </div>

        {/* Programs grid */}
        <div className="max-w-5xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl bg-white/5 border border-white/10 shadow-xl p-5 hover:border-yellow-300/40 hover:bg-white/7 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold font-extrabold text-lg leading-tight hover:underline"
                  >
                    {p.title}
                  </a>
                  <div className="text-xs text-gray-400 mt-1 truncate">{p.org}</div>
                </div>

                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-2 rounded-full bg-gold text-black text-xs font-bold hover:bg-yellow-500 transition shadow"
                >
                  View
                </a>
              </div>

              <p className="text-sm text-gray-200 mt-3 leading-relaxed">
                {p.summary}
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                  <div className="text-gray-400 uppercase tracking-widest text-[10px]">
                    Who it’s for
                  </div>
                  <div className="mt-1 text-white font-semibold">{p.who}</div>
                </div>
                <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                  <div className="text-gray-400 uppercase tracking-widest text-[10px]">
                    Format
                  </div>
                  <div className="mt-1 text-white font-semibold">{p.format}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/10 text-gray-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to action (matches index style) */}
        <div className="max-w-5xl mx-auto mt-8">
          <div className="rounded-2xl bg-gradient-to-r from-yellow-400/15 via-white/5 to-yellow-400/10 border border-yellow-300/25 shadow-xl p-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-gold">
              Want a mentor-match flow inside BWE?
            </h2>
            <p className="text-sm text-gray-200 mt-2 max-w-3xl">
              Next-step “leading edge” approach: we can turn this into a guided
              mentorship funnel—profile → track → goals → suggested programs →
              mentor matching + check-ins.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="px-5 py-3 rounded-full bg-gold text-black font-bold hover:bg-yellow-500 transition shadow"
              >
                Create Your Profile
              </Link>
              <Link
                href={HUB_PATH}
                className="px-5 py-3 rounded-full bg-white/10 border border-white/15 hover:border-yellow-300/60 hover:bg-white/15 transition font-semibold"
              >
                Browse Student Hub
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
