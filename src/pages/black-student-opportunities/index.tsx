// /src/pages/black-student-opportunities/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type OpportunityType =
  | "Internship"
  | "Scholarship"
  | "Grant"
  | "Fellowship"
  | "Mentorship"
  | "Research"
  | "Competition"
  | "Career";

type Opportunity = {
  id: string;
  title: string;
  org: string;
  type: OpportunityType;
  level: "High School" | "Undergrad" | "Graduate" | "Any";
  mode: "Remote" | "In-Person" | "Hybrid" | "Any";
  field:
    | "STEM"
    | "Business"
    | "Healthcare"
    | "Creative"
    | "Public Service"
    | "Finance"
    | "Any";
  note: string;
  href: string;
  isFeatured?: boolean;
};

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

// Curated “works now” list.
// Later, you can replace/augment this with a feed from your API (RSS aggregation).
const CURATED: Opportunity[] = [
  {
    id: "uncf",
    title: "UNCF Scholarships & Programs",
    org: "UNCF",
    type: "Scholarship",
    level: "Any",
    mode: "Any",
    field: "Any",
    note: "Scholarship and program listings vary year-round—check often.",
    href: "https://uncf.org/scholarships",
    isFeatured: true,
  },
  {
    id: "tmcf",
    title: "TMCF Scholarships",
    org: "Thurgood Marshall College Fund (TMCF)",
    type: "Scholarship",
    level: "Undergrad",
    mode: "Any",
    field: "Any",
    note: "Strong for HBCU students—deadlines rotate through the year.",
    href: "https://www.tmcf.org/students-alumni/scholarships/",
    isFeatured: true,
  },
  {
    id: "inroads",
    title: "INROADS Career Development & Opportunities",
    org: "INROADS",
    type: "Internship",
    level: "Undergrad",
    mode: "Any",
    field: "Business",
    note: "Career support + pathways into major employers.",
    href: "https://inroads.org/",
  },
  {
    id: "mlt",
    title: "MLT Career Prep",
    org: "Management Leadership for Tomorrow (MLT)",
    type: "Mentorship",
    level: "Undergrad",
    mode: "Any",
    field: "Business",
    note: "Coaching + community. High-value for career acceleration.",
    href: "https://mlt.org/career-prep/",
  },
  {
    id: "nsbe",
    title: "NSBE (STEM Community + Career Resources)",
    org: "NSBE",
    type: "Career",
    level: "Any",
    mode: "Any",
    field: "STEM",
    note: "Student membership + events + career connections.",
    href: "https://www.nsbe.org/",
  },
  {
    id: "naba",
    title: "NABA Student Resources",
    org: "NABA",
    type: "Mentorship",
    level: "Undergrad",
    mode: "Any",
    field: "Finance",
    note: "Accounting/finance pathway support through chapters and programs.",
    href: "https://www.nabainc.org/",
  },
  {
    id: "scholarshipamerica",
    title: "Scholarship Search",
    org: "Scholarship America",
    type: "Scholarship",
    level: "Any",
    mode: "Any",
    field: "Any",
    note: "Broad scholarship search tool—use with UNCF/TMCF too.",
    href: "https://www.scholarshipamerica.org/",
  },
  {
    id: "nsf-reu",
    title: "NSF REU (Research Experiences for Undergraduates)",
    org: "National Science Foundation",
    type: "Research",
    level: "Undergrad",
    mode: "Any",
    field: "STEM",
    note: "Research programs hosted by universities. Great for grad school paths.",
    href: "https://www.nsf.gov/crssprgm/reu/",
  },
];

const TYPES: Array<OpportunityType | "All"> = [
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

const LEVELS: Array<Opportunity["level"] | "All"> = [
  "All",
  "High School",
  "Undergrad",
  "Graduate",
  "Any",
];

const MODES: Array<Opportunity["mode"] | "All"> = [
  "All",
  "Remote",
  "In-Person",
  "Hybrid",
  "Any",
];

const FIELDS: Array<Opportunity["field"] | "All"> = [
  "All",
  "STEM",
  "Business",
  "Healthcare",
  "Creative",
  "Public Service",
  "Finance",
  "Any",
];

export default function StudentOpportunitiesHub() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");
  const [mode, setMode] = useState<(typeof MODES)[number]>("All");
  const [field, setField] = useState<(typeof FIELDS)[number]>("All");

  // Optional future feed hook (won’t break if endpoint doesn’t exist)
  const [liveFeed, setLiveFeed] = useState<Opportunity[] | null>(null);

  useEffect(() => {
    let alive = true;

    // If you later build an API like:
    // /api/opportunities/latest?limit=8
    // You can power this hub with live RSS aggregation.
    fetch("/api/opportunities/latest?limit=8")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        if (Array.isArray(data)) setLiveFeed(data);
      })
      .catch(() => {
        // silently ignore until you create the endpoint
      });

    return () => {
      alive = false;
    };
  }, []);

  const data = useMemo(() => {
    // Priority: live feed if available; else curated.
    return (liveFeed && liveFeed.length ? liveFeed : CURATED).slice(0, 50);
  }, [liveFeed]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return data.filter((o) => {
      const matchesQuery =
        !query ||
        `${o.title} ${o.org} ${o.type} ${o.level} ${o.mode} ${o.field} ${o.note}`
          .toLowerCase()
          .includes(query);

      const matchesType = type === "All" ? true : o.type === type;
      const matchesLevel = level === "All" ? true : o.level === level;
      const matchesMode = mode === "All" ? true : o.mode === mode;
      const matchesField = field === "All" ? true : o.field === field;

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

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects (consistent with index vibe) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 pointer-events-none" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 pt-10 pb-6 sm:pt-12 sm:pb-8 text-center px-4">
        <Image
          src="/favicon.png"
          alt="Black Wealth Exchange Logo"
          width={96}
          height={96}
          className="mx-auto mb-3"
          priority
        />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-gray-200">
          <span className="text-gold font-bold">BWE</span>
          <span className="text-gray-300">Student Opportunities Hub</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-300">2026</span>
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide text-gold neon-text max-w-4xl mx-auto leading-tight">
          Turn Opportunity Into Power.
          <span className="block text-white/90 font-extrabold">
            Funding + Experience + Mentorship + Community.
          </span>
        </h1>

        <p className="mt-3 text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
          This hub is designed to help Black students{" "}
          <span className="text-white font-semibold">find opportunities</span>,
          <span className="text-white font-semibold"> build leverage</span>, and
          <span className="text-white font-semibold"> join a network</span> that
          grows with them.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="px-5 py-3 rounded-full bg-gold text-black font-extrabold hover:bg-yellow-500 transition shadow"
          >
            Create Your Student Profile
          </Link>

          <Link
            href="/login"
            className="px-5 py-3 rounded-full bg-white/10 border border-white/15 hover:border-yellow-300/60 hover:bg-white/15 transition font-semibold"
          >
            Log In
          </Link>

          <Link
            href="/"
            className="px-5 py-3 rounded-full bg-black/40 border border-white/10 hover:border-yellow-300/50 hover:bg-white/5 transition font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 pb-14">
        {/* CORE NAV CARDS */}
        <section className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CORE_ROUTES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-2xl bg-white/5 border border-white/10 shadow-xl p-6 hover:border-yellow-300/40 hover:bg-white/7 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-gold font-extrabold text-xl">
                    {c.title}
                  </div>
                  <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-yellow-400/15 border border-yellow-300/25 text-yellow-200">
                    {c.badge}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-2">{c.desc}</p>
                <div className="text-xs text-gray-400 mt-4">Open →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* THE “POWER” SECTION: WHY THIS HUB MAKES STUDENTS JOIN */}
        <section className="max-w-6xl mx-auto mt-8">
          <div className="rounded-2xl bg-gradient-to-r from-yellow-400/15 via-white/5 to-yellow-400/10 border border-yellow-300/25 shadow-xl p-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-gold">
              Why students join BWE (this is your leverage)
            </h2>
            <p className="text-sm text-gray-200 mt-2 max-w-4xl">
              Most students are drowning in scattered links and random advice.
              This hub becomes their
              <span className="text-white font-semibold">
                {" "}
                single trusted launchpad
              </span>
              : opportunities, structure, mentorship, and a community that helps
              them execute.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-black/30 border border-white/10 p-5">
                <div className="text-gold font-extrabold">
                  1) Opportunity Radar
                </div>
                <div className="text-sm text-gray-200 mt-2">
                  Curated + (later) live feeds, so students stop missing
                  deadlines and real openings.
                </div>
              </div>
              <div className="rounded-2xl bg-black/30 border border-white/10 p-5">
                <div className="text-gold font-extrabold">
                  2) Trusted Pathway
                </div>
                <div className="text-sm text-gray-200 mt-2">
                  Clear steps: build a profile → apply smart → track progress →
                  win offers.
                </div>
              </div>
              <div className="rounded-2xl bg-black/30 border border-white/10 p-5">
                <div className="text-gold font-extrabold">
                  3) Network Effects
                </div>
                <div className="text-sm text-gray-200 mt-2">
                  Mentors, ambassadors, and alumni momentum turns individual
                  effort into community power.
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="px-5 py-3 rounded-full bg-gold text-black font-extrabold hover:bg-yellow-500 transition shadow"
              >
                Join Free (Students)
              </Link>
              <Link
                href="/join-the-mission"
                className="px-5 py-3 rounded-full bg-white/10 border border-white/15 hover:border-yellow-300/60 hover:bg-white/15 transition font-semibold"
              >
                Join the Mission
              </Link>
            </div>
          </div>
        </section>

        {/* SEARCH + FILTER PANEL */}
        <section className="max-w-6xl mx-auto mt-8">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-xl p-5">
            <div className="flex flex-col md:flex-row gap-4 md:items-end md:justify-between">
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                  Search opportunities
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search (scholarships, internships, research, mentorship)…"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/20 outline-none transition text-sm"
                />
                <div className="mt-3 text-xs text-gray-400">
                  Results:{" "}
                  <span className="text-white font-bold">
                    {filtered.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:w-[520px]">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-yellow-300/60"
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
                  className="px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-yellow-300/60"
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
                  className="px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-yellow-300/60"
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
                  className="px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-yellow-300/60"
                >
                  {FIELDS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Featured row */}
            {featured.length > 0 && (
              <div className="mt-5">
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">
                  Featured
                </div>
                <div className="flex gap-2 flex-wrap">
                  {featured.map((o) => (
                    <a
                      key={o.id}
                      href={o.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-full bg-yellow-400/15 border border-yellow-300/25 text-yellow-200 text-xs font-semibold hover:bg-yellow-400/20 transition"
                    >
                      {o.org}: {o.type}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RESULTS GRID */}
        <section className="max-w-6xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((o) => (
            <div
              key={o.id}
              className={cx(
                "rounded-2xl bg-white/5 border shadow-xl p-5 transition",
                o.isFeatured
                  ? "border-yellow-300/35 hover:border-yellow-300/60 hover:bg-white/7"
                  : "border-white/10 hover:border-yellow-300/35 hover:bg-white/7",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={o.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold font-extrabold text-lg leading-tight hover:underline"
                  >
                    {o.title}
                  </a>
                  <div className="text-xs text-gray-400 mt-1 truncate">
                    {o.org}
                  </div>
                </div>

                <a
                  href={o.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-2 rounded-full bg-gold text-black text-xs font-bold hover:bg-yellow-500 transition shadow"
                >
                  Open
                </a>
              </div>

              <p className="text-sm text-gray-200 mt-3">{o.note}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/10">
                  {o.type}
                </span>
                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/10">
                  {o.level}
                </span>
                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/10">
                  {o.mode}
                </span>
                <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/10">
                  {o.field}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* LEADING-EDGE PROCESS SECTION (Execution framework) */}
        <section className="max-w-6xl mx-auto mt-8">
          <div className="rounded-2xl bg-black/30 border border-white/10 shadow-xl p-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-gold">
              The BWE Student “Winning System” (how we help students execute)
            </h2>
            <p className="text-sm text-gray-200 mt-2 max-w-4xl">
              This is the difference between “a list of links” and a platform
              students stay on. You’re building a repeatable system that
              produces outcomes.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="text-gold font-extrabold">Step 1</div>
                <div className="text-white font-semibold mt-1">
                  Create Profile
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  School, major, interests, resume basics, and goals.
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="text-gold font-extrabold">Step 2</div>
                <div className="text-white font-semibold mt-1">Get Matched</div>
                <div className="text-sm text-gray-300 mt-2">
                  Suggested opportunities + mentorship based on track.
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="text-gold font-extrabold">Step 3</div>
                <div className="text-white font-semibold mt-1">Apply Smart</div>
                <div className="text-sm text-gray-300 mt-2">
                  Checklists, templates, reminders, and accountability.
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="text-gold font-extrabold">Step 4</div>
                <div className="text-white font-semibold mt-1">Build Power</div>
                <div className="text-sm text-gray-300 mt-2">
                  Offers, networks, skills—and bring others with you.
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="px-5 py-3 rounded-full bg-gold text-black font-extrabold hover:bg-yellow-500 transition shadow"
              >
                Start Step 1 (Profile)
              </Link>
              <Link
                href="/black-student-opportunities/mentorship"
                className="px-5 py-3 rounded-full bg-white/10 border border-white/15 hover:border-yellow-300/60 hover:bg-white/15 transition font-semibold"
              >
                Go to Mentorship
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ / TRUST SECTION */}
        <section className="max-w-6xl mx-auto mt-8">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-xl p-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-gold">FAQ</h2>

            <div className="mt-4 space-y-3">
              <details className="rounded-xl bg-black/30 border border-white/10 p-4">
                <summary className="cursor-pointer font-semibold text-white">
                  Is everything here updated for 2026?
                </summary>
                <div className="text-sm text-gray-300 mt-2">
                  This hub is built for 2026+ and focuses on trusted sources.
                  Deadlines change, so we link directly to official pages. Next
                  upgrade: live feeds (RSS/updates) pulled into “Latest
                  Opportunities.”
                </div>
              </details>

              <details className="rounded-xl bg-black/30 border border-white/10 p-4">
                <summary className="cursor-pointer font-semibold text-white">
                  Can BWE send opportunity alerts?
                </summary>
                <div className="text-sm text-gray-300 mt-2">
                  Yes—this is a strong “sticky” feature. Next step: student
                  profiles + saved searches + email alerts. We can add a clean
                  opt-in module on this hub.
                </div>
              </details>

              <details className="rounded-xl bg-black/30 border border-white/10 p-4">
                <summary className="cursor-pointer font-semibold text-white">
                  How does this help students join the platform long-term?
                </summary>
                <div className="text-sm text-gray-300 mt-2">
                  The hub becomes their home base: resources → execution tools →
                  community. Over time, you add: mentor matching, templates,
                  verified badges, events, and internships from
                  sponsors/employers.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="max-w-6xl mx-auto mt-8 text-center">
          <div className="rounded-2xl bg-gradient-to-r from-yellow-400/15 via-white/5 to-yellow-400/10 border border-yellow-300/25 shadow-xl p-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gold">
              Students don’t just need opportunities.
              <span className="block text-white/90">They need a system.</span>
            </h2>
            <p className="text-sm text-gray-200 mt-2 max-w-3xl mx-auto">
              This hub is where BWE can become the trusted platform students
              return to every week.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-full bg-gold text-black font-extrabold hover:bg-yellow-500 transition shadow"
              >
                Join Free as a Student
              </Link>
              <Link
                href={HUB_PATH}
                className="px-6 py-3 rounded-full bg-white/10 border border-white/15 hover:border-yellow-300/60 hover:bg-white/15 transition font-semibold"
              >
                Refresh Hub
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
