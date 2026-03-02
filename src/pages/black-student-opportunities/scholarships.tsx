// pages/black-student-opportunities/scholarships.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  GraduationCap,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  FileText,
  Bell,
  Sparkles,
} from "lucide-react";

type ScholarshipItem = {
  title: string;
  description: string;
  statusNote: string;
  whoItsFor: string[];
  howToApply: string[];
  link: string;
  tags: string[];
};

function _cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Icon className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold text-white/70">
      {children}
    </span>
  );
}

function ScholarshipCard({ item }: { item: ScholarshipItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 transition hover:bg-white/[0.05]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[#D4AF37]">
            {item.title}
          </h3>
          <p className="mt-2 text-sm text-white/70">{item.description}</p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/70">
            <Calendar className="h-4 w-4 text-white/60" />
            {item.statusNote}
          </div>
        </div>

        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500"
        >
          Apply / Learn More <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 text-xs font-black tracking-wide text-white/70">
            WHO IT’S FOR
          </div>
          <ul className="space-y-2 text-sm text-white/70">
            {item.whoItsFor.map((x, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 text-xs font-black tracking-wide text-white/70">
            HOW TO APPLY (FAST)
          </div>
          <ol className="space-y-2 text-sm text-white/70">
            {item.howToApply.map((x, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[11px] font-black text-white/75">
                  {i + 1}
                </span>
                <span>{x}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>
    </div>
  );
}

export default function ScholarshipsPage() {
  const YEAR = 2026;

  const scholarships: ScholarshipItem[] = [
    {
      title: "Jackie Robinson Foundation Scholarship",
      description:
        "Major scholarship + leadership development for high-achieving students with strong leadership and service.",
      statusNote:
        "2026 application deadline was Jan 7, 2026; currently closed. Next cycle typically opens in summer. (Verify on official site.)",
      whoItsFor: [
        "High school seniors entering a 4-year college/university",
        "Strong leadership + community service",
        "Academic achievement + financial need factors may apply",
      ],
      howToApply: [
        "Review eligibility and required materials on the official JRF page.",
        "Prepare transcripts, activities list, and recommendations early.",
        "Apply as soon as the next window opens (summer cycle).",
      ],
      link: "https://jackierobinson.org/apply/",
      tags: ["Leadership", "High school seniors", "Major award"],
    },
    {
      title: "Ron Brown Scholar Program",
      description:
        "Prestigious scholarship program recognizing academic excellence, leadership, and service among Black/African American students.",
      statusNote:
        "Official site indicates the 2026 application is closed. Check for the next application window on the official page.",
      whoItsFor: [
        "Black/African American high school seniors",
        "Leadership + community impact",
        "Strong academics and character",
      ],
      howToApply: [
        "Confirm the current application cycle status on the official site.",
        "Prepare essays + leadership/service documentation.",
        "Submit early once the next window opens.",
      ],
      link: "https://ronbrown.org",
      tags: ["Prestige", "Leadership", "Service"],
    },
    {
      title: "UNCF Scholarships (Search & Apply)",
      description:
        "UNCF offers a broad range of scholarships and programs. Deadlines vary by scholarship and partner program.",
      statusNote:
        "Deadlines vary by program—use UNCF’s scholarship listings and apply to matching opportunities.",
      whoItsFor: [
        "Students meeting UNCF scholarship criteria (often GPA + enrollment requirements)",
        "Students with FAFSA filed (common requirement)",
        "Students attending or planning to attend eligible institutions",
      ],
      howToApply: [
        "Visit UNCF scholarships and review opportunities that match your profile.",
        "Create/maintain a strong profile (GPA, major, school, FAFSA).",
        "Apply to multiple opportunities and track each deadline.",
      ],
      link: "https://uncf.org/scholarships",
      tags: ["UNCF", "Many programs", "Deadlines vary"],
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Background layers (consistent with index / updated student pages) */}
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/70 to-black/90" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[560px] w-[560px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <div className="relative z-10">
        {/* Top bar */}
        <div className="container mx-auto max-w-6xl px-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-extrabold text-white/80 transition hover:bg-white/[0.06]"
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
              Back to Home
            </Link>

            <Link
              href="/black-student-opportunities"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-sm font-extrabold text-[#D4AF37] transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/15"
            >
              <GraduationCap className="h-4 w-4" />
              Student Opportunities Hub
            </Link>
          </div>
        </div>

        {/* Hero */}
        <header className="container mx-auto max-w-6xl px-4 pb-8 pt-10 sm:pt-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-wide text-white/75">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Updated for {YEAR} • Scholarships & elite programs
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <Image
                src="/favicon.png"
                alt="Black Wealth Exchange Logo"
                width={54}
                height={54}
                className="object-contain"
                priority
              />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                Scholarships for Black Students
                <span className="text-[#D4AF37]">.</span>
              </h1>
            </div>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-white/70">
              Scholarships can cover tuition, fees, books, housing, and more.
              The winning strategy is to apply early, apply often, and build a
              clean “application kit” you can reuse across programs.
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto max-w-6xl px-4 pb-12">
          {/* Quick Start */}
          <SectionCard title="2026 Scholarship Quick Start" icon={Sparkles}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                  <FileText className="h-4 w-4" />
                  Step 1: Build your kit
                </div>
                <p className="text-sm text-white/70">
                  Create one folder with: resume, activities list, transcript
                  PDF, 2 recommendation contacts, and a reusable personal
                  statement.
                </p>
                <p className="mt-3 text-xs text-white/50">
                  Tip: Keep versions for “leadership,” “STEM,” and “community
                  impact.”
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                  <Calendar className="h-4 w-4" />
                  Step 2: Track deadlines
                </div>
                <p className="text-sm text-white/70">
                  Put deadlines into a calendar and set reminders at 14, 7, and
                  2 days out. Many elite programs close quickly.
                </p>
                <p className="mt-3 text-xs text-white/50">
                  Strategy: Apply early in the cycle when competition is lower.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                  <Bell className="h-4 w-4" />
                  Step 3: Stay current
                </div>
                <p className="text-sm text-white/70">
                  Scholarship windows change. Bookmark official pages and check
                  monthly. We can automate updates via feeds next.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Scholarship list */}
          <div className="mt-6 space-y-5">
            {scholarships.map((s) => (
              <ScholarshipCard key={s.title} item={s} />
            ))}
          </div>

          {/* Application tips */}
          <div className="mt-6">
            <SectionCard title="Application Tips That Win" icon={BookOpen}>
              <ul className="grid gap-3 md:grid-cols-2 text-sm text-white/70">
                <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-extrabold text-white">
                    Lead with impact
                  </div>
                  <div className="mt-1 text-white/65">
                    Replace “I volunteered” with measurable results: hours,
                    outcomes, people served.
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-extrabold text-white">
                    Use a story arc
                  </div>
                  <div className="mt-1 text-white/65">
                    Challenge → action → growth → mission. Make your “why”
                    unforgettable.
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-extrabold text-white">
                    Ask for strong references
                  </div>
                  <div className="mt-1 text-white/65">
                    Share your resume + goals with recommenders so they can
                    write with specifics.
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-extrabold text-white">
                    Apply to 10–20
                  </div>
                  <div className="mt-1 text-white/65">
                    Volume matters. Combine “big name” + “local/community” +
                    “departmental” awards.
                  </div>
                </li>
              </ul>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
                If you want, I can generate a reusable “Scholarship Application
                Kit” template: resume bullets + activities list + personal
                statement framework + recommendation request email.
              </div>
            </SectionCard>
          </div>

          {/* Live updates */}
          <div className="mt-6">
            <SectionCard title="Live Updates (Feeds / Alerts)" icon={Bell}>
              <p className="text-sm text-white/70">
                The leading-edge approach is to pull trusted sources into BWE so
                this page stays current without manual edits. For now, these are
                reliable official starting points:
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <a
                  href="https://jackierobinson.org/apply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="text-sm font-extrabold text-[#D4AF37]">
                    Jackie Robinson Foundation — Apply
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Official cycle status + deadlines (best source of truth).
                  </div>
                  <div className="mt-2 text-xs font-bold text-white/70 group-hover:text-white">
                    Open page{" "}
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                  </div>
                </a>

                <a
                  href="https://ronbrown.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="text-sm font-extrabold text-[#D4AF37]">
                    Ron Brown Scholar Program — Official Site
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Official announcements and application windows.
                  </div>
                  <div className="mt-2 text-xs font-bold text-white/70 group-hover:text-white">
                    Open site{" "}
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                  </div>
                </a>

                <a
                  href="https://uncf.org/scholarships"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="text-sm font-extrabold text-[#D4AF37]">
                    UNCF — Scholarships
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Browse scholarships and program opportunities (deadlines
                    vary).
                  </div>
                  <div className="mt-2 text-xs font-bold text-white/70 group-hover:text-white">
                    Open scholarships{" "}
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                  </div>
                </a>

                <a
                  href="https://studentaid.gov/h/apply-for-aid/fafsa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="text-sm font-extrabold text-[#D4AF37]">
                    FAFSA — StudentAid.gov
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Many scholarships require FAFSA or consider financial need.
                  </div>
                  <div className="mt-2 text-xs font-bold text-white/70 group-hover:text-white">
                    Open FAFSA{" "}
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                  </div>
                </a>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
                Next step (optional): we can add an API route like{" "}
                <span className="text-white/70 font-bold">
                  /api/feeds/scholarships
                </span>{" "}
                that fetches 3–6 trusted sources on a schedule, caches results,
                and renders “Latest Scholarship Updates” right here.
              </div>
            </SectionCard>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <Link
              href="/black-student-opportunities/internships"
              className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-2.5 text-sm font-extrabold text-[#D4AF37] shadow-sm transition hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/15"
            >
              Explore Internships Next →
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500"
            >
              Back to Home
            </Link>

            <p className="max-w-2xl text-[11px] text-white/45">
              Always verify deadlines and eligibility on the official source
              page before applying.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
