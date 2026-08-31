import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Filter,
  Search,
  X,
} from "lucide-react";
import type {
  ChapterData,
  HistorySection,
  Region,
  ResourceLink,
} from "@/lib/black-history-foundations";

export interface LibraryItem {
  id: number;
  title: string;
  summary: string;
  category:
    | "Truth & Context"
    | "Slavery & Abolition"
    | "Colonialism & Extraction"
    | "Diaspora & Migration"
    | "Resistance & Liberation"
    | "Culture & Contribution"
    | "Civil Rights & Policy"
    | "Apartheid & Global Racial Systems"
    | "Economics & Ownership"
    | "Research Tools";
  region: Region;
  links: ResourceLink[];
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-extrabold transition",
        active
          ? "border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37]"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]",
      )}
    >
      {children}
    </button>
  );
}

export function ExternalA({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export function Expandable({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-extrabold text-white">{label}</span>
        <span className="text-xs font-extrabold text-white/60">
          {open ? "Hide" : "Open"}
        </span>
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function SectionStory({ section }: { section: HistorySection }) {
  return (
    <section
      id={section.id}
      className="scroll-mt-28 rounded-[30px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-7"
    >
      <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        {section.title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-white/78">
        {section.summary}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/8 p-4">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-red-300">
            Commonly Taught
          </div>
          <p className="mt-3 text-sm leading-7 text-white/80">
            {section.commonlyTaught}
          </p>
        </div>
        <div className="rounded-3xl border border-[#D4AF37]/20 bg-[#D4AF37]/8 p-4">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
            Missing Context
          </div>
          <p className="mt-3 text-sm leading-7 text-white/80">
            {section.missingContext}
          </p>
        </div>
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/8 p-4">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-emerald-300">
            Why It Matters
          </div>
          <p className="mt-3 text-sm leading-7 text-white/80">
            {section.whyItMatters}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <Expandable label="Evidence notes">
          <ul className="space-y-3">
            {section.evidence.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-white/80"
              >
                <span className="mt-2 h-2 w-2 rounded-full bg-[#D4AF37]" />
                <span className="leading-7">{item}</span>
              </li>
            ))}
          </ul>
          {section.caution ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/72">
              <span className="font-extrabold text-white">
                Evidence caution:
              </span>{" "}
              {section.caution}
            </div>
          ) : null}
        </Expandable>
      </div>
    </section>
  );
}

export function HistoryChapterPage({ chapter }: { chapter: ChapterData }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Head>
        <title>{chapter.title} | Library of Black History</title>
        <meta name="description" content={chapter.summary} />
      </Head>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[26rem] w-[26rem] rounded-full bg-emerald-500/[0.06] blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <Link
          href="/library-of-black-history"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to the Library
        </Link>

        <section className="mt-5 rounded-[34px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur sm:p-8 md:p-10">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#D4AF37]">
            {chapter.eyebrow}
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            {chapter.title}
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-white/78 sm:text-lg">
            {chapter.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {chapter.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-extrabold text-white/72 transition hover:bg-white/[0.06]"
              >
                {section.title}
              </a>
            ))}
          </div>
        </section>

        <div className="mt-8 space-y-5">
          {chapter.sections.map((section) => (
            <SectionStory key={section.id} section={section} />
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {chapter.rulers?.length ? (
            <Expandable label="Rulers in context">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {chapter.rulers.map((profile) => (
                  <div
                    key={profile.name}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-extrabold text-white">
                        {profile.name}
                      </h2>
                      <div className="text-sm font-extrabold text-[#D4AF37]">
                        {profile.period}
                      </div>
                      <div className="text-sm text-white/65">
                        {profile.region}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm leading-7 text-white/78">
                      <div>
                        <span className="font-extrabold text-white">
                          Political system:
                        </span>{" "}
                        {profile.politicalSystem}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Economic base:
                        </span>{" "}
                        {profile.economicBase}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Religious context:
                        </span>{" "}
                        {profile.religiousContext}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Governance:
                        </span>{" "}
                        {profile.governance}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Diplomacy:
                        </span>{" "}
                        {profile.diplomacy}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Military role:
                        </span>{" "}
                        {profile.militaryRole}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Achievements:
                        </span>{" "}
                        {profile.achievements}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Conflicts:
                        </span>{" "}
                        {profile.conflicts}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Limitations:
                        </span>{" "}
                        {profile.limitations}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Legacy:
                        </span>{" "}
                        {profile.legacy}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Expandable>
          ) : null}

          {chapter.schoolGaps?.length ? (
            <Expandable label="What school often left out">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {chapter.schoolGaps.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <h2 className="text-lg font-extrabold text-white">
                      {item.title}
                    </h2>
                    <div className="mt-3 space-y-2 text-sm leading-7 text-white/78">
                      <div>
                        <span className="font-extrabold text-white">
                          Commonly taught:
                        </span>{" "}
                        {item.commonlyTaught}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Missing context:
                        </span>{" "}
                        {item.missingContext}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          The evidence:
                        </span>{" "}
                        {item.evidence}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Why it matters:
                        </span>{" "}
                        {item.whyItMatters}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Expandable>
          ) : null}

          {chapter.claimChecks?.length ? (
            <Expandable label="Myth, claim, and evidence">
              <div className="space-y-4">
                {chapter.claimChecks.map((item) => (
                  <div
                    key={item.claim}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <h2 className="text-lg font-extrabold text-[#D4AF37]">
                      {item.claim}
                    </h2>
                    <div className="mt-3 space-y-2 text-sm leading-7 text-white/78">
                      <div>
                        <span className="font-extrabold text-white">
                          What is true:
                        </span>{" "}
                        {item.truth}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          What is uncertain:
                        </span>{" "}
                        {item.uncertain}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          What is unsupported:
                        </span>{" "}
                        {item.unsupported}
                      </div>
                      <div>
                        <span className="font-extrabold text-white">
                          Why it matters:
                        </span>{" "}
                        {item.whyItMatters}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Expandable>
          ) : null}

          <Expandable label="Sources and further reading">
            <div className="space-y-5">
              {chapter.sourceGroups.map((group) => (
                <section
                  key={group.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <h2 className="text-lg font-extrabold text-white">
                    {group.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-white/72">
                    {group.support}
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {group.links.map((source) => (
                      <ExternalA
                        key={`${group.title}-${source.url}`}
                        href={source.url}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80 transition hover:bg-white/[0.06]"
                      >
                        <span className="min-w-0">
                          <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37]">
                            {source.type}
                          </span>
                          <span className="ml-2 font-semibold">
                            {source.label}
                          </span>
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-white/50" />
                      </ExternalA>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Expandable>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/library-of-black-history"
            className="inline-flex items-center justify-center rounded-2xl bg-[#D4AF37] px-5 py-3 text-sm font-extrabold text-black transition hover:bg-yellow-500"
          >
            Return to the library <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/business-directory"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-extrabold text-white/78 transition hover:bg-white/[0.06]"
          >
            Explore the directory
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ResourceExplorer({
  query,
  setQuery,
  filtered,
  category,
  setCategory,
  region,
  setRegion,
  showFilters,
  setShowFilters,
  allCategories,
  allRegions,
}: {
  query: string;
  setQuery: (value: string) => void;
  filtered: LibraryItem[];
  category: LibraryItem["category"] | "All";
  setCategory: (value: LibraryItem["category"] | "All") => void;
  region: Region | "All";
  setRegion: (value: Region | "All") => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  allCategories: readonly LibraryItem["category"][];
  allRegions: Region[];
}) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
          <Search className="h-4 w-4 text-white/60" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics, regions, sources..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-lg p-1 hover:bg-white/[0.06]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-white/60" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-extrabold text-white/75 transition hover:bg-white/[0.06]"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <div className="text-xs font-extrabold text-white/50">
            Showing <span className="text-white/80">{filtered.length}</span>{" "}
            source paths
          </div>
        </div>
      </div>

      {showFilters ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/50">
              Category
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill
                active={category === "All"}
                onClick={() => setCategory("All")}
              >
                All
              </Pill>
              {allCategories.map((value) => (
                <Pill
                  key={value}
                  active={category === value}
                  onClick={() => setCategory(value)}
                >
                  {value}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/50">
              Region
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill active={region === "All"} onClick={() => setRegion("All")}>
                All
              </Pill>
              {allRegions.map((value) => (
                <Pill
                  key={value}
                  active={region === value}
                  onClick={() => setRegion(value)}
                >
                  {value}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const topLinks = item.links.slice(0, 2);
          const expanded = openId === item.id;

          return (
            <article
              key={item.id}
              className="rounded-3xl border border-white/10 bg-black/30 p-5"
            >
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/45">
                {item.category} • {item.region}
              </div>
              <h3 className="mt-2 text-lg font-extrabold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/70">
                {item.summary}
              </p>

              <div className="mt-4 space-y-2">
                {topLinks.map((link: ResourceLink) => (
                  <ExternalA
                    key={link.url}
                    href={link.url}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.06]"
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37]">
                        {link.type}
                      </span>
                      <span className="ml-2 font-semibold">{link.label}</span>
                    </span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-white/50" />
                  </ExternalA>
                ))}

                {expanded
                  ? item.links.slice(2).map((link: ResourceLink) => (
                      <ExternalA
                        key={link.url}
                        href={link.url}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.06]"
                      >
                        <span className="min-w-0 truncate">
                          <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37]">
                            {link.type}
                          </span>
                          <span className="ml-2 font-semibold">
                            {link.label}
                          </span>
                        </span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-white/50" />
                      </ExternalA>
                    ))
                  : null}

                {item.links.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? null : item.id)}
                    className="w-full rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-xs font-extrabold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
                  >
                    {expanded ? "Hide extra sources" : "More sources"}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
