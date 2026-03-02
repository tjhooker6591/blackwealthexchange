"use client";

import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Search,
  Globe,
  BookOpen,
  Landmark,
  LibraryBig,
  Shield,
  ArrowRight,
  ExternalLink,
  Filter,
  X,
} from "lucide-react";

type Region =
  | "Global"
  | "Africa"
  | "Caribbean"
  | "Europe"
  | "Latin America"
  | "United States"
  | "Middle East"
  | "Asia";

type SourceType =
  | "Museum"
  | "Archive"
  | "Database"
  | "Academic"
  | "Primary Sources"
  | "Open Access"
  | "Education"
  | "Research Tool";

interface ResourceLink {
  label: string;
  url: string;
  type: SourceType;
}

interface LibraryItem {
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Pill({
  active,
  children,
  onClick,
  icon,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
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
      {icon}
      {children}
    </button>
  );
}

function Card({
  title,
  kicker,
  icon,
  children,
}: {
  title: string;
  kicker?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
            {icon}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {kicker ? (
            <div className="text-[11px] uppercase tracking-widest text-white/50 font-extrabold">
              {kicker}
            </div>
          ) : null}
          <h2 className="mt-1 text-lg sm:text-xl font-extrabold text-white">
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-4 text-white/75 leading-relaxed">{children}</div>
    </section>
  );
}

function List({ items }: { items: Array<React.ReactNode> }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#D4AF37]/70" />
          <span className="text-white/75">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({
  title,
  tone = "gold",
  children,
}: {
  title: string;
  tone?: "gold" | "red" | "emerald";
  children: React.ReactNode;
}) {
  const style =
    tone === "red"
      ? "border-red-500/25 bg-red-500/10"
      : tone === "emerald"
        ? "border-emerald-500/25 bg-emerald-500/10"
        : "border-[#D4AF37]/25 bg-[#D4AF37]/10";

  const titleColor =
    tone === "red"
      ? "text-red-300"
      : tone === "emerald"
        ? "text-emerald-300"
        : "text-[#D4AF37]";

  return (
    <div className={cx("rounded-2xl border p-4", style)}>
      <div className={cx("text-[12px] font-extrabold", titleColor)}>
        {title}
      </div>
      <div className="mt-2 text-[13px] text-white/80 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function ExternalA({
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

function Expandable({
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
    <div className="rounded-2xl border border-white/10 bg-black/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <span className="text-white font-extrabold text-sm">{label}</span>
        <span className="text-white/60 text-xs font-extrabold">
          {open ? "Hide" : "Expand"}
        </span>
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

/** ----------------------------
 *  GLOBAL, MULTI-SOURCE LIBRARY
 *  ---------------------------- */
const libraryItems: LibraryItem[] = [
  {
    id: 1,
    title: "UNESCO — General History of Africa (multi-volume)",
    summary:
      "A global scholarly project centered on African perspectives: civilizations, trade, colonialism, resistance, and the diaspora.",
    category: "Truth & Context",
    region: "Africa",
    links: [
      {
        label: "UNESCO overview (volumes & project)",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
    ],
  },
  {
    id: 2,
    title: "SlaveVoyages — Trans-Atlantic Slave Trade Database",
    summary:
      "A major data project for tracing voyages, routes, ports, and the scale and structure of the slave trade across regions.",
    category: "Slavery & Abolition",
    region: "Global",
    links: [
      {
        label: "SlaveVoyages (database)",
        url: "https://www.slavevoyages.org/",
        type: "Database",
      },
    ],
  },
  {
    id: 3,
    title: "UCL — Legacies of British Slave-ownership",
    summary:
      "Evidence-based research on compensation, estates, and how slavery shaped wealth in Britain and beyond.",
    category: "Colonialism & Extraction",
    region: "Europe",
    links: [
      {
        label: "LBS database (UCL)",
        url: "https://www.ucl.ac.uk/lbs/",
        type: "Database",
      },
    ],
  },
  {
    id: 4,
    title: "Smithsonian NMAAHC — History & primary learning resources",
    summary:
      "Museum-quality context and curated learning materials across slavery, Reconstruction, civil rights, and culture.",
    category: "Truth & Context",
    region: "United States",
    links: [
      {
        label: "NMAAHC (learn & history)",
        url: "https://nmaahc.si.edu/",
        type: "Museum",
      },
    ],
  },
  {
    id: 5,
    title: "Library of Congress — 'Born in Slavery' Narratives",
    summary:
      "Primary-source interviews (Federal Writers’ Project) that capture voices and memories of enslaved people in the U.S.",
    category: "Slavery & Abolition",
    region: "United States",
    links: [
      {
        label: "Born in Slavery (LOC)",
        url: "https://www.loc.gov/collections/slave-narratives-from-the-federal-writers-project-1936-to-1938/about-this-collection/",
        type: "Primary Sources",
      },
    ],
  },
  {
    id: 6,
    title:
      "The National Archives (UK) — Research guidance on African/Caribbean ancestry",
    summary:
      "Practical guidance to navigate records shaped by empire, migration, and racialized documentation.",
    category: "Diaspora & Migration",
    region: "Europe",
    links: [
      {
        label: "UK National Archives guidance",
        url: "https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/black-british-social-and-political-history-in-the-20th-century/",
        type: "Archive",
      },
    ],
  },
  {
    id: 7,
    title: "International Slavery Museum (Liverpool) — exhibitions & learning",
    summary:
      "A major institution connecting slavery to modern racism, global systems, and resistance movements.",
    category: "Slavery & Abolition",
    region: "Europe",
    links: [
      {
        label: "International Slavery Museum",
        url: "https://www.liverpoolmuseums.org.uk/international-slavery-museum",
        type: "Museum",
      },
    ],
  },
  {
    id: 8,
    title: "Digital Library of the Caribbean (dLOC) — Caribbean archives",
    summary:
      "A deep, multi-institution collection across the Caribbean: slavery, emancipation, revolution, migration, and culture.",
    category: "Diaspora & Migration",
    region: "Caribbean",
    links: [
      {
        label: "dLOC collections",
        url: "https://dloc.com/",
        type: "Archive",
      },
      {
        label: "Early Caribbean Digital Archive (example collection)",
        url: "https://dloc.com/collections/ecda",
        type: "Open Access",
      },
    ],
  },
  {
    id: 9,
    title: "South African History Online — Apartheid & liberation",
    summary:
      "Accessible historical materials on apartheid, resistance, and broader African political history.",
    category: "Apartheid & Global Racial Systems",
    region: "Africa",
    links: [
      {
        label: "SAHO (Apartheid topic portal)",
        url: "https://www.sahistory.org.za/topic/apartheid-1948-1994",
        type: "Education",
      },
    ],
  },
  {
    id: 10,
    title: "Apartheid Museum — learner/education materials",
    summary:
      "Education material that connects policy, propaganda, and racial control systems to lived reality and global parallels.",
    category: "Apartheid & Global Racial Systems",
    region: "Africa",
    links: [
      {
        label: "Learner book (PDF)",
        url: "https://apartheidmuseum.org/uploads/files/Learner%20book.pdf",
        type: "Education",
      },
    ],
  },
  {
    id: 11,
    title: "Enslaved.org — linked open data hub",
    summary:
      "A collaborative data hub for the lives of enslaved people and descendants, connecting datasets across institutions.",
    category: "Research Tools",
    region: "Global",
    links: [
      {
        label: "Enslaved.org",
        url: "https://enslaved.org/",
        type: "Database",
      },
    ],
  },
  {
    id: 12,
    title: "UNESCO — The Slave Route (global memory & education)",
    summary:
      "UNESCO initiative focused on research, remembrance, and education around slavery and its legacies worldwide.",
    category: "Slavery & Abolition",
    region: "Global",
    links: [
      {
        label: "UNESCO Slave Route (project)",
        url: "https://en.unesco.org/themes/fostering-rights-inclusion/slave-route",
        type: "Education",
      },
    ],
  },
  {
    id: 13,
    title: "Schomburg Center (NYPL) — research & collections",
    summary:
      "One of the most important institutions for Black history: manuscripts, arts, photos, and research guides.",
    category: "Culture & Contribution",
    region: "United States",
    links: [
      {
        label: "Schomburg Center (NYPL)",
        url: "https://www.nypl.org/locations/schomburg",
        type: "Archive",
      },
    ],
  },
  {
    id: 14,
    title:
      "Pan-African & diaspora lens — diaspora definition and global influence",
    summary:
      "Start with clear definitions: diaspora, displacement, migration, cultural retention, and global influence patterns.",
    category: "Diaspora & Migration",
    region: "Global",
    links: [
      {
        label: "African diaspora overview (Britannica)",
        url: "https://www.britannica.com/topic/African-diaspora",
        type: "Academic",
      },
    ],
  },
  {
    id: 15,
    title:
      "Racial capitalism & extraction — frameworks to explain 'why it repeats'",
    summary:
      "A lens for understanding how race and profit systems reinforce each other through labor, credit, housing, and media.",
    category: "Truth & Context",
    region: "Global",
    links: [
      {
        label: "Stanford Encyclopedia (entry search)",
        url: "https://plato.stanford.edu/search/searcher.py?query=racial+capitalism",
        type: "Academic",
      },
    ],
  },
  {
    id: 16,
    title: "Economics & Ownership — practical bridge from history to action",
    summary:
      "Learn the mechanics: business formation, capital access, supply chains, ownership models, and compounding.",
    category: "Economics & Ownership",
    region: "Global",
    links: [
      {
        label: "OECD — financial literacy topic (global context)",
        url: "https://www.oecd.org/financial/education/",
        type: "Education",
      },
    ],
  },
  {
    id: 17,
    title:
      "Modern propaganda, media literacy, and narrative control (how minds are shaped)",
    summary:
      "Build skill in decoding advertising, stereotypes, consumer identity targeting, and algorithmic amplification.",
    category: "Truth & Context",
    region: "Global",
    links: [
      {
        label: "UNESCO media & information literacy",
        url: "https://www.unesco.org/en/media-information-literacy",
        type: "Education",
      },
    ],
  },
  {
    id: 18,
    title: "Civil rights and global rights movements (comparative study)",
    summary:
      "Understand the shared patterns: state power, legal systems, labor control, education, policing, and resistance.",
    category: "Resistance & Liberation",
    region: "Global",
    links: [
      {
        label: "United Nations Human Rights education",
        url: "https://www.ohchr.org/en/education-and-training",
        type: "Education",
      },
    ],
  },
];

const ALL_CATEGORIES = [
  "Truth & Context",
  "Slavery & Abolition",
  "Colonialism & Extraction",
  "Diaspora & Migration",
  "Resistance & Liberation",
  "Culture & Contribution",
  "Civil Rights & Policy",
  "Apartheid & Global Racial Systems",
  "Economics & Ownership",
  "Research Tools",
] as const;

const ALL_REGIONS: Region[] = [
  "Global",
  "Africa",
  "Caribbean",
  "Europe",
  "Latin America",
  "United States",
  "Middle East",
  "Asia",
];

export default function LibraryOfBlackHistory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<
    (typeof ALL_CATEGORIES)[number] | "All"
  >("All");
  const [region, setRegion] = useState<Region | "All">("All");
  const [openId, setOpenId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return libraryItems.filter((item) => {
      const matchQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.links.some(
          (l) =>
            l.label.toLowerCase().includes(q) ||
            l.type.toLowerCase().includes(q),
        );

      const matchCat = category === "All" ? true : item.category === category;
      const matchRegion = region === "All" ? true : item.region === region;

      return matchQ && matchCat && matchRegion;
    });
  }, [query, category, region]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Head>
        <title>Library of Black History | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Facts. No Fiction. A global library of Black history sources: museums, archives, databases, and research tools."
        />
      </Head>

      {/* index-style glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[820px] w-[820px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[560px] w-[560px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-8 md:py-12">
        {/* HERO */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 md:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[12px] font-extrabold text-[#D4AF37]">
                <Globe className="h-4 w-4" />
                Global Library • Multi-source • Beyond one narrative
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                Library of <span className="text-[#D4AF37]">Black History</span>
              </h1>

              <p className="mt-3 max-w-3xl text-white/70 leading-relaxed">
                Wikipedia is a starting point — not a finish line. This library
                prioritizes{" "}
                <span className="text-white font-bold">museums</span>,{" "}
                <span className="text-white font-bold">archives</span>,{" "}
                <span className="text-white font-bold">databases</span>, and{" "}
                <span className="text-white font-bold">open education</span>{" "}
                from around the world so readers can learn, verify, and build a
                full picture.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill icon={<Landmark className="h-4 w-4" />}>Museums</Pill>
                <Pill icon={<LibraryBig className="h-4 w-4" />}>Archives</Pill>
                <Pill icon={<BookOpen className="h-4 w-4" />}>Open access</Pill>
                <Pill icon={<Shield className="h-4 w-4" />}>
                  Verify sources
                </Pill>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/business-directory"
                className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-2.5 text-[13px] font-extrabold text-black transition hover:bg-yellow-500"
              >
                Explore Directory <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/economic-freedom"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.06]"
              >
                Economic Freedom <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* TRUTH MIRROR (expanded but mobile-friendly via expandable sections) */}
        <div className="mt-8">
          <Card
            kicker="THE TRUTH MIRROR"
            title="What many people were told — and what many people were not told"
            icon={<Shield className="h-5 w-5 text-[#D4AF37]" />}
          >
            <p className="text-white/75">
              Across many countries, people learn a simplified version of
              history: a few famous moments, a few famous leaders, and a clean
              ending. But for a global people, the real story is broader:
              systems, incentives, propaganda, and long-term effects that
              continue after “official” change.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Callout title="A global pattern (not one country)" tone="gold">
                The same architecture repeats in different places: extract labor
                → restrict education/credit/land → shape narratives about worth
                → sell identity back through culture/consumption → keep
                ownership concentrated.
              </Callout>

              <Callout title="What changes everything" tone="emerald">
                When people see the pattern, they stop blaming themselves and
                start building systems: ownership, institutions, capital,
                education pipelines, and group economics.
              </Callout>
            </div>

            <div className="mt-5 space-y-3">
              <Expandable label="1) What many people WERE taught (the short version)">
                <List
                  items={[
                    <>
                      Slavery happened, abolition happened, civil rights
                      happened — therefore the problem is “mostly solved.”
                    </>,
                    <>
                      A few heroes carried progress — therefore ordinary people
                      are just spectators, not builders.
                    </>,
                    <>
                      Culture is the main contribution — therefore entertainment
                      success equals community advancement.
                    </>,
                  ]}
                />
                <Callout title="Why this matters" tone="red">
                  A short story creates short solutions. If the real problem is
                  systemic, the solution must be systemic too — not just
                  individual motivation.
                </Callout>
              </Expandable>

              <Expandable label="2) What many people were NOT told (the missing middle)">
                <List
                  items={[
                    <>
                      <span className="text-white font-bold">
                        The economics:
                      </span>{" "}
                      slavery and colonialism were not only “prejudice” — they
                      were business models that built wealth, banks, insurance,
                      shipping empires, and property systems across continents.
                    </>,
                    <>
                      <span className="text-white font-bold">
                        The transition:
                      </span>{" "}
                      after abolition, coercion often changed form (debt
                      peonage, forced labor, exclusion from credit/land,
                      criminalization, segregation, discriminatory policy).
                    </>,
                    <>
                      <span className="text-white font-bold">
                        The curriculum gap:
                      </span>{" "}
                      many school systems teach events, but avoid mechanisms:
                      how laws, finance, housing, media, and supply chains
                      preserve inequality.
                    </>,
                    <>
                      <span className="text-white font-bold">
                        The global map:
                      </span>{" "}
                      the diaspora links Africa, the Caribbean, Latin America,
                      Europe, and the U.S. through trade routes, plantations,
                      rebellions, migration, and cultural exchange.
                    </>,
                  ]}
                />
                <Callout title="Reader takeaway" tone="gold">
                  When you learn the mechanisms, you can build counter-systems:
                  ownership loops, institutions, alternative pipelines, and
                  capital strategies that protect the next generation.
                </Callout>
              </Expandable>

              <Expandable label="3) The psychological & media layer (why people keep spending outward)">
                <p className="text-white/75">
                  Advertising is not neutral — it targets identity, belonging,
                  status, and fear. When a community is historically excluded
                  from ownership, the market often offers a substitute:
                  <span className="text-white font-bold">
                    {" "}
                    consumption as identity
                  </span>
                  .
                </p>
                <List
                  items={[
                    <>
                      <span className="text-white font-bold">
                        Status hacking:
                      </span>{" "}
                      “buy this to be respected.” If ownership feels out of
                      reach, brands sell the feeling of power.
                    </>,
                    <>
                      <span className="text-white font-bold">
                        Normalization:
                      </span>{" "}
                      repeated imagery teaches people what is “premium,” who is
                      “successful,” and who deserves authority.
                    </>,
                    <>
                      <span className="text-white font-bold">
                        Algorithm loops:
                      </span>{" "}
                      what you watch shapes what you see next; what you see next
                      shapes desire; desire shapes spending; spending reinforces
                      the loop.
                    </>,
                    <>
                      <span className="text-white font-bold">
                        Scarcity mindset:
                      </span>{" "}
                      when the future feels unstable, short-term comfort wins —
                      even if it harms long-term wealth.
                    </>,
                  ]}
                />
                <Callout
                  title="How to break it (simple and real)"
                  tone="emerald"
                >
                  Reduce the “brand diet.” Replace one habit with an ownership
                  habit: one Black-owned switch, one savings/investment rule,
                  and one community referral every week.
                </Callout>
              </Expandable>

              <Expandable label="4) How to research like a builder (verify & cross-check)">
                <List
                  items={[
                    <>
                      Use{" "}
                      <span className="text-white font-bold">
                        primary sources
                      </span>{" "}
                      when possible (archives, recorded testimonies, government
                      records, museum collections).
                    </>,
                    <>
                      Compare{" "}
                      <span className="text-white font-bold">
                        multiple regions
                      </span>{" "}
                      — the pattern is clearer when you see it in the Caribbean,
                      Latin America, Africa, Europe, and the U.S.
                    </>,
                    <>
                      Look for{" "}
                      <span className="text-white font-bold">
                        data projects
                      </span>{" "}
                      (voyages, compensation, migration, census, labor systems)
                      that show structure, not just stories.
                    </>,
                    <>
                      Ask: “Who profits? Who owns the pipeline? Who controls the
                      rules? Who controls the narrative?”
                    </>,
                  ]}
                />
                <Callout title="BWE purpose" tone="gold">
                  The goal is not anger for anger’s sake — it’s clarity that
                  produces action: ownership, investment, education, and systems
                  that protect families.
                </Callout>
              </Expandable>
            </div>
          </Card>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
              <Search className="h-4 w-4 text-white/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, regions, sources…"
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
                onClick={() => setShowFilters((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-extrabold text-white/75 transition hover:bg-white/[0.06]"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>

              <div className="text-xs text-white/50 font-extrabold">
                Showing <span className="text-white/80">{filtered.length}</span>{" "}
                resources
              </div>
            </div>
          </div>

          {showFilters ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-white/50 font-extrabold">
                  Category
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill
                    active={category === "All"}
                    onClick={() => setCategory("All")}
                  >
                    All
                  </Pill>
                  {ALL_CATEGORIES.map((c) => (
                    <Pill
                      key={c}
                      active={category === c}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-widest text-white/50 font-extrabold">
                  Region
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill
                    active={region === "All"}
                    onClick={() => setRegion("All")}
                  >
                    All
                  </Pill>
                  {ALL_REGIONS.map((r) => (
                    <Pill
                      key={r}
                      active={region === r}
                      onClick={() => setRegion(r)}
                    >
                      {r}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* GRID */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const topLinks = item.links.slice(0, 2);
            const hasMore = item.links.length > 2;
            const expanded = openId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-white/50 font-extrabold">
                      {item.category} • {item.region}
                    </div>
                    <h3 className="mt-2 text-white font-extrabold text-lg">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-2 text-white/70 text-sm leading-relaxed">
                  {item.summary}
                </p>

                <div className="mt-4 space-y-2">
                  {topLinks.map((l) => (
                    <ExternalA
                      key={l.url}
                      href={l.url}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06] transition"
                    >
                      <span className="min-w-0 truncate">
                        <span className="text-[#D4AF37] font-extrabold text-[12px]">
                          {l.type}
                        </span>{" "}
                        <span className="text-white/80">•</span>{" "}
                        <span className="font-semibold">{l.label}</span>
                      </span>
                      <ExternalLink className="h-4 w-4 text-white/50" />
                    </ExternalA>
                  ))}

                  {expanded ? (
                    <div className="mt-2 space-y-2">
                      {item.links.slice(2).map((l) => (
                        <ExternalA
                          key={l.url}
                          href={l.url}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06] transition"
                        >
                          <span className="min-w-0 truncate">
                            <span className="text-[#D4AF37] font-extrabold text-[12px]">
                              {l.type}
                            </span>{" "}
                            <span className="text-white/80">•</span>{" "}
                            <span className="font-semibold">{l.label}</span>
                          </span>
                          <ExternalLink className="h-4 w-4 text-white/50" />
                        </ExternalA>
                      ))}
                    </div>
                  ) : null}

                  {hasMore ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(expanded ? null : item.id)}
                      className="w-full rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-xs font-extrabold text-[#D4AF37] hover:bg-[#D4AF37]/15 transition"
                    >
                      {expanded ? "Hide extra sources" : "More sources"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER NAV */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 font-extrabold text-white/75 transition hover:bg-white/[0.06]"
          >
            Back Home
          </Link>
          <Link
            href="/economic-freedom"
            className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 font-extrabold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
          >
            Economic Freedom
          </Link>
          <Link
            href="/business-directory"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 font-extrabold text-white/75 transition hover:bg-white/[0.06]"
          >
            Directory
          </Link>
          <Link
            href="/marketplace"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 font-extrabold text-white/75 transition hover:bg-white/[0.06]"
          >
            Marketplace
          </Link>
        </div>

        <div className="mt-8 pb-6 text-center text-white/45 text-sm">
          © {new Date().getFullYear()} Black Wealth Exchange — Library of Black
          History
        </div>
      </div>
    </div>
  );
}
