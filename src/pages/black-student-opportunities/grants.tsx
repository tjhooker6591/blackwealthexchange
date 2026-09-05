// pages/black-student-opportunities/grants.tsx
import type { GetServerSideProps } from "next";
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
  MapPin,
  ArrowLeft,
} from "lucide-react";
import {
  getPublicStudentHubPageRecords,
  type PublicStudentHubRecord,
} from "@/lib/studentHub/public";
import { useStudentHubPageView } from "@/hooks/useStudentHubPageView";

type GrantItem = {
  title: string;
  description: string;
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

function GrantCard({ item }: { item: GrantItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 transition hover:bg-white/[0.05]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[#D4AF37]">
            {item.title}
          </h3>
          <p className="mt-2 text-sm text-white/70">{item.description}</p>
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
          <span
            key={t}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold text-white/70"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const Grants = ({
  initialGrants,
}: {
  initialGrants: PublicStudentHubRecord[];
}) => {
  const YEAR = 2026;

  useStudentHubPageView("grants");

  const grants: GrantItem[] = initialGrants.map((record) => ({
    title: record.title,
    description: record.description,
    whoItsFor: [record.eligibilitySummary],
    howToApply:
      record.howToApply && record.howToApply.length
        ? record.howToApply
        : [
            "Review the official source and complete the current financial-aid or program application steps.",
          ],
    link: record.applicationUrl,
    tags: [...(record.tags || []), record.statusLabel],
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Background layers (consistent with index) */}
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
              Updated for {YEAR} • Grants & aid pathways
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
                Grants for Black College Students
                <span className="text-[#D4AF37]">.</span>
              </h1>
            </div>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-white/70">
              Grants = money you typically don’t repay. Start with FAFSA, then
              stack school, state, and foundation grants to reduce out-of-pocket
              costs.
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto max-w-6xl px-4 pb-12">
          {/* Quick Start */}
          <SectionCard title="2026 Quick Start Checklist" icon={Calendar}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                  <BookOpen className="h-4 w-4" />
                  Step 1: FAFSA first
                </div>
                <p className="text-sm text-white/70">
                  FAFSA unlocks most federal and many state/campus grants.
                  Submit early.
                </p>
                <a
                  href="https://studentaid.gov/h/apply-for-aid/fafsa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37] hover:underline"
                >
                  Complete FAFSA <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                  <CheckCircle2 className="h-4 w-4" />
                  Step 2: Ask your school
                </div>
                <p className="text-sm text-white/70">
                  Schools have limited, campus-administered grants. Ask about
                  deadlines and forms.
                </p>
                <p className="mt-3 text-xs text-white/50">
                  Tip: Use the phrase “campus-based grants / emergency funds.”
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#D4AF37]">
                  <MapPin className="h-4 w-4" />
                  Step 3: Stack state aid
                </div>
                <p className="text-sm text-white/70">
                  Many states offer grants (often FAFSA-linked). Check your
                  state’s agency.
                </p>
                <a
                  href="https://www2.ed.gov/about/contacts/state/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37] hover:underline"
                >
                  Find State Grants <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </SectionCard>

          {/* Grants list */}
          <div className="mt-6 space-y-5">
            {grants.map((g) => (
              <GrantCard key={g.title} item={g} />
            ))}
          </div>

          {/* Benefits */}
          <div className="mt-6">
            <SectionCard title="Why Grants Matter" icon={ShieldCheck}>
              <ul className="grid gap-3 md:grid-cols-2 text-sm text-white/70">
                <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-extrabold text-white">
                    No repayment (usually)
                  </div>
                  <div className="mt-1 text-white/65">
                    Grants are typically “gift aid” — unlike loans.
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-extrabold text-white">
                    Less out-of-pocket stress
                  </div>
                  <div className="mt-1 text-white/65">
                    Use grants to cover tuition, fees, books, housing, and
                    essentials.
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-extrabold text-white">
                    More academic focus
                  </div>
                  <div className="mt-1 text-white/65">
                    Less financial pressure means more time for studying and
                    internships.
                  </div>
                </li>
                <li className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-extrabold text-white">
                    Better long-term outcomes
                  </div>
                  <div className="mt-1 text-white/65">
                    Lower debt helps with credit, housing, and post-grad
                    options.
                  </div>
                </li>
              </ul>
            </SectionCard>
          </div>

          <div className="mt-6">
            <SectionCard title="Live Updates (RSS / Feeds)" icon={BookOpen}>
              <p className="text-sm text-white/70">
                These official sources are worth revisiting when you are
                checking grant deadlines, aid changes, and school-specific
                funding updates:
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <a
                  href="https://fsapartners.ed.gov/knowledge-center/library/whats-new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="text-sm font-extrabold text-[#D4AF37]">
                    Federal Student Aid — “What’s New”
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Has an RSS option on the page (good for policy/aid updates).
                  </div>
                  <div className="mt-2 text-xs font-bold text-white/70 group-hover:text-white">
                    Open source page{" "}
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                  </div>
                </a>

                <a
                  href="https://uncf.org/programs/uncf-emergency-student-aid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="text-sm font-extrabold text-[#D4AF37]">
                    UNCF — Emergency Student Aid
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Keep this bookmarked for eligibility changes and program
                    details.
                  </div>
                  <div className="mt-2 text-xs font-bold text-white/70 group-hover:text-white">
                    Open program page{" "}
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                  </div>
                </a>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
                Grant and aid policies move fast. Use official financial-aid
                pages as your source of truth before you apply or make a school
                decision.
              </div>
            </SectionCard>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <Link
              href="/black-student-opportunities/scholarships"
              className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-5 py-2.5 text-sm font-extrabold text-[#D4AF37] shadow-sm transition hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/15"
            >
              Explore Scholarships Next →
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-extrabold text-black shadow transition hover:bg-yellow-500"
            >
              Back to Home
            </Link>

            <p className="max-w-2xl text-[11px] text-white/45">
              Note: Always verify deadlines and eligibility on the official
              source or your school’s financial aid office.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Grants;

export const getServerSideProps: GetServerSideProps = async () => {
  const { records } = await getPublicStudentHubPageRecords("grants");
  return {
    props: {
      initialGrants: records,
    },
  };
};
