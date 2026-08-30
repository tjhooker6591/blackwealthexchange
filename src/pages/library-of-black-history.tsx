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

type EvidenceClass = "A" | "B" | "C" | "D" | "E";

interface JourneyBlock {
  block: string;
  title: string;
  status: "Completed checkpoint" | "Active now" | "Queued next";
  note: string;
}

interface HistorySection {
  id: string;
  kicker: string;
  title: string;
  coverage: string;
  evidenceClass: EvidenceClass;
  summary: string;
  commonlyTaught: string;
  missingContext: string;
  evidence: string[];
  whyItMatters: string;
  caution?: string;
  sources: ResourceLink[];
}

interface ClaimCheck {
  claim: string;
  truth: string;
  uncertain: string;
  unsupported: string;
  whyItMatters: string;
}

interface CurriculumGap {
  title: string;
  commonlyTaught: string;
  missingContext: string;
  evidence: string;
  whyItMatters: string;
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
  {
    id: 19,
    title: "UNESCO — General History of Africa Volume II",
    summary:
      "A wide scholarly frame for Egypt, Nubia, the Ethiopian highlands, the Maghrib, the Sahara, and early states across northeastern Africa.",
    category: "Truth & Context",
    region: "Africa",
    links: [
      {
        label: "UNESCO General History of Africa overview",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "UNESCO Volume II",
        url: "https://unesdoc.unesco.org/ark:/48223/pf0000184265",
        type: "Open Access",
      },
    ],
  },
  {
    id: 20,
    title: "The Met — Egypt, Nubia, and Sudan essays",
    summary:
      "Museum essays that help connect the Nile Valley chronologically: Old Kingdom, Middle Kingdom, New Kingdom, later Egypt, Nubia, and Kush.",
    category: "Truth & Context",
    region: "Africa",
    links: [
      {
        label: "The Land of Nubia",
        url: "https://www.metmuseum.org/essays/nubia",
        type: "Museum",
      },
      {
        label: "Egypt in the New Kingdom",
        url: "https://www.metmuseum.org/essays/egypt-in-the-new-kingdom",
        type: "Museum",
      },
      {
        label: "Egypt in the Late Period",
        url: "https://www.metmuseum.org/essays/egypt-in-the-late-period-ca-712-332-b-c",
        type: "Museum",
      },
    ],
  },
  {
    id: 21,
    title: "UCL Digital Egypt — language, religion, and writing",
    summary:
      "A useful teaching archive for hieratic, literacy, religious concepts, and textual framing across ancient Egypt.",
    category: "Research Tools",
    region: "Africa",
    links: [
      {
        label: "Digital Egypt A-Z",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/alphabet.html",
        type: "Education",
      },
      {
        label: "UCL Hieratic",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/writing/hieratic.html",
        type: "Education",
      },
      {
        label: "UCL Literacy",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/education/literacy.html",
        type: "Education",
      },
    ],
  },
  {
    id: 22,
    title: "Ancient population evidence — Egypt and biological limits",
    summary:
      "Scientific and archaeological research can illuminate ancient populations, but sample size, chronology, and geography limit sweeping modern racial claims.",
    category: "Research Tools",
    region: "Africa",
    links: [
      {
        label: "Nature — Whole-genome ancestry of an Old Kingdom Egyptian",
        url: "https://www.nature.com/articles/s41586-025-09195-5",
        type: "Academic",
      },
      {
        label: "Nature news coverage of the genome study",
        url: "https://www.nature.com/articles/d41586-025-02102-y",
        type: "Academic",
      },
      {
        label: "Ancient Egyptian mummy genomes (open access)",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5459999/",
        type: "Open Access",
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

const historyJourneys: JourneyBlock[] = [
  {
    block: "Block 1",
    title: "Inventory, research ledger, gap matrix, content architecture",
    status: "Completed checkpoint",
    note: "The research scaffold now exists and preserves the current library before larger expansions.",
  },
  {
    block: "Block 2",
    title:
      "Humanity's African Beginning, Africa Before Captivity, African Sacred Worlds, Yoruba Worldview",
    status: "Completed checkpoint",
    note: "The first substantive expansion now anchors the live page with accepted long-form sections.",
  },
  {
    block: "Block 3",
    title: "Egypt / Kemet / Nile Valley / Nubia / Kush",
    status: "Active now",
    note: "This evidence-heavy build treats chronology, language, statecraft, women, Nubia, Kush, and disputed identity claims with explicit caution.",
  },
  {
    block: "Block 4",
    title: "Government, rulers, knowledge systems, writing, science, education",
    status: "Queued next",
    note: "This block will connect political institutions to intellectual production.",
  },
  {
    block: "Block 5",
    title: "West African civilizations: Ghana, Mali, Songhai, Timbuktu",
    status: "Queued next",
    note: "Trade, scholarship, governance, and wealth networks.",
  },
  {
    block: "Block 6",
    title: "East Africa, Aksum, Ethiopia, and the Swahili world",
    status: "Queued next",
    note: "This block will connect inland and Indian Ocean histories.",
  },
  {
    block: "Block 7",
    title: "North Africa, Amazigh histories, Moors, and al-Andalus",
    status: "Queued next",
    note: "Complexity first, slogans never.",
  },
  {
    block: "Block 8",
    title: "Christianity, Islam, the Bible, and Africa",
    status: "Queued next",
    note: "The page will separate text, history, tradition, and modern interpretation.",
  },
  {
    block: "Block 9",
    title: "Slave trades, colonialism, and extraction",
    status: "Queued next",
    note: "Will cover trans-Saharan, Indian Ocean, Atlantic, and colonial systems together.",
  },
  {
    block: "Block 10",
    title: "Diaspora, Haiti, Caribbean, and Latin America",
    status: "Queued next",
    note: "Global Black history cannot collapse into a U.S.-only story.",
  },
  {
    block: "Block 11",
    title: "Black America before emancipation through Reconstruction",
    status: "Queued next",
    note: "Resistance, war service, officeholding, institutions, and land.",
  },
  {
    block: "Block 12",
    title: "Black land, towns, enterprise, and HBCUs",
    status: "Queued next",
    note: "Institution-building becomes explicit here.",
  },
  {
    block: "Block 13",
    title: "Racial violence, Jim Crow, housing discrimination, and redlining",
    status: "Queued next",
    note: "Economic exclusion will be treated as structure, not side-note tragedy.",
  },
  {
    block: "Block 14",
    title: "Civil Rights, economic movements, invention, and culture",
    status: "Queued next",
    note: "History of ideas, ownership, and innovation together.",
  },
  {
    block: "Block 15",
    title: "Modern Black economics, restoration, and the BWE bridge",
    status: "Queued next",
    note: "The library closes by connecting memory, trust, institutions, and ownership.",
  },
];

const historySections: HistorySection[] = [
  {
    id: "origins",
    kicker: "BLOCK 2A",
    title: "Humanity's African Beginning",
    coverage: "Current coverage: Partial, now expanded",
    evidenceClass: "B",
    summary:
      "The strongest current scientific consensus places the emergence of Homo sapiens in Africa about 300,000 years ago. That matters because it resets the frame: Africa is not a late chapter in world history, but the central ground of human beginnings.",
    commonlyTaught:
      "Many people were taught Black history as though it begins with captivity, colonization, or civil-rights struggle.",
    missingContext:
      "Human history begins in Africa. Any serious Black historical library has to start before forced dispersal, before empire, and before modern racial hierarchy.",
    evidence: [
      "The Smithsonian Human Origins Program states that Homo sapiens evolved in Africa about 300,000 years ago.",
      "Smithsonian genetics and fossil framing also place the deepest roots of living humans and earlier human species in Africa.",
      "UNESCO's General History of Africa treats African prehistory as foundational, not peripheral, and includes prehistory, art, agriculture, and metallurgy in Volume I.",
    ],
    whyItMatters:
      "When history starts in captivity, identity starts in damage. When history starts in Africa, identity starts in origin, adaptation, creativity, and civilization-building.",
    caution:
      "This does not authorize simplistic racial storytelling about every prehistoric population. The evidence establishes Africa's centrality to human origins, not one modern political identity projected backward without care.",
    sources: [
      {
        label: "Smithsonian Human Origins - Homo sapiens",
        url: "https://humanorigins.si.edu/evidence/human-fossils/species/homo-sapiens",
        type: "Museum",
      },
      {
        label: "Smithsonian Human Origins - One Species, Living Worldwide",
        url: "https://humanorigins.si.edu/evidence/genetics/one-species-living-worldwide",
        type: "Research Tool",
      },
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
    ],
  },
  {
    id: "before-captivity",
    kicker: "BLOCK 2B",
    title: "Africa Before Captivity",
    coverage: "Current coverage: Partial, now expanded",
    evidenceClass: "B",
    summary:
      "Africa before Atlantic captivity was not a blank space waiting for Europe. It held multiple civilizations, trade systems, urban centers, sacred worlds, and political traditions that developed across very different regions and time periods.",
    commonlyTaught:
      "Too many public histories collapse pre-captivity Africa into vague tribal imagery, a few monuments, or a fast jump into the slave trade.",
    missingContext:
      "Long before Atlantic slavery became the frame through which many people encounter Africa, the continent contained regional systems of agriculture, metallurgy, governance, trade, scholarship, and city-building. The real story is not one empire or one identity, but a large field of connected and distinct histories.",
    evidence: [
      "UNESCO's General History of Africa Volume II covers nearly nine thousand years of African history across the Nile corridor, Egypt and Nubia, the Ethiopian highlands, the Maghrib, the Sahara, and other regions.",
      "UNESCO's Volume IV describes the twelfth through sixteenth centuries as a period of expanding trade, cultural exchange, political development, and more common written records across major parts of Africa.",
      "The Met's work on trans-Saharan gold trade shows structured economic exchange linking Mediterranean and sub-Saharan economies, while its Guinea Coast essays show distinct African polities rather than one undifferentiated society.",
    ],
    whyItMatters:
      "When Africa before captivity is erased, Black identity is easier to detach from statecraft, commerce, scholarship, and inherited civilizational memory. Restoring that record changes what people think is normal, possible, and worth rebuilding.",
    caution:
      "Africa before captivity should not be turned into a single golden-age slogan. Different regions moved on different timelines, and the public library should keep distinctions between regions, periods, and evidence types clear.",
    sources: [
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "UNESCO - General History of Africa Volume IV",
        url: "https://unesdoc.unesco.org/ark:/48223/pf0000184287",
        type: "Open Access",
      },
      {
        label: "Met - The Trans-Saharan Gold Trade",
        url: "https://www.metmuseum.org/essays/the-trans-saharan-gold-trade-7th-14th-century",
        type: "Academic",
      },
      {
        label: "Met - Origins and Empire: Benin, Owo, and Ijebu",
        url: "https://www.metmuseum.org/essays/origins-and-empire-the-benin-owo-and-ijebu-kingdoms",
        type: "Academic",
      },
    ],
  },
  {
    id: "sacred-worlds",
    kicker: "BLOCK 2C",
    title: "African Sacred Worlds",
    coverage: "Current coverage: Partial, now expanded",
    evidenceClass: "C",
    summary:
      "African sacred worlds were never one interchangeable system. They include distinct cosmologies, moral languages, ritual institutions, and ways of understanding creation, character, community, and obligation.",
    commonlyTaught:
      "School often treated African religions as folklore, superstition, or a hazy backdrop before Christianity or Islam arrived.",
    missingContext:
      "Across the continent, sacred life helped order time, kinship, responsibility, political legitimacy, healing, environment, and social memory. These traditions were knowledge systems, not empty myths.",
    evidence: [
      "UNESCO's historical method explicitly combines written archives with oral traditions, archaeology, and scientific findings rather than excluding African knowledge traditions from history.",
      "The Smithsonian's African Cosmos exhibition frames African cosmologies as deep intellectual and artistic traditions tied to sky, environment, and daily life.",
      "This library will distinguish established fact from theology, oral memory, and scholarly interpretation instead of flattening them into one category.",
    ],
    whyItMatters:
      "If a people are taught that their sacred inheritance was primitive, it becomes easier to sever them from memory, authority, and continuity. Recovering sacred worlds helps restore intellectual dignity.",
    caution:
      "Public sections should label tradition and theology honestly. Not every sacred claim is archaeology, but neither should sacred systems be dismissed because they are not written in European categories.",
    sources: [
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "UNESCO - 2025 General History of Africa release",
        url: "https://www.unesco.org/en/articles/unesco-releases-three-new-volumes-its-general-history-africa",
        type: "Open Access",
      },
      {
        label: "Smithsonian - African Cosmos: Stellar Arts",
        url: "https://africa.si.edu/exhibitions/african-cosmos-stellar-arts",
        type: "Museum",
      },
    ],
  },
  {
    id: "yoruba",
    kicker: "BLOCK 2D",
    title: "Yoruba Worldview",
    coverage: "Current coverage: Partial, now expanded",
    evidenceClass: "B",
    summary:
      "The Yoruba world deserves treatment as a serious intellectual, spiritual, artistic, and civic tradition. It should not appear on this library only as a side-note to diaspora religion or museum aesthetics.",
    commonlyTaught:
      "Many readers only encounter Yoruba traditions indirectly through diaspora religions, internet simplifications, or scattered references to deities without context.",
    missingContext:
      "Museum and scholarly sources describe Ifa as a Yoruba way of life involving spiritual belief, ethics, and moral behavior. They also document divination, urban life, sacred geography, and the historical importance of Ile-Ife.",
    evidence: [
      "The British Museum describes Ifa as a traditional Yoruba way of life that incorporates spiritual belief, ethics, and moral behavior.",
      "Smithsonian collection records note that babalawo used Ifa divination to consult Orunmila, identifying a formal knowledge practice rather than vague mysticism.",
      "Met and Smithsonian materials treat Ile-Ife as a major center of Yoruba history, art, and sacred memory, which helps connect worldview to city-building, trade, and political culture.",
    ],
    whyItMatters:
      "If the library is going to discuss Black identity, diaspora religion, or African continuity with seriousness, Yoruba thought has to be handled with respect, accuracy, and enough room to breathe.",
    caution:
      "Origin traditions about Oduduwa and Ile-Ife should be labeled as tradition or theology where appropriate, while archaeological and art-historical claims should be grounded separately.",
    sources: [
      {
        label: "British Museum - Creation narratives and feminine power",
        url: "https://www.britishmuseum.org/blog/creation-narratives-and-feminine-power",
        type: "Museum",
      },
      {
        label: "Smithsonian NMAfA - Divination cup",
        url: "https://africa.si.edu/collection/object/nmafa_92-10-1",
        type: "Museum",
      },
      {
        label: "Met - Ife (from ca. 6th Century)",
        url: "https://www.metmuseum.org/essays/ife-from-ca-6th-century",
        type: "Academic",
      },
      {
        label: "Smithsonian - Featured Artwork on Ifa divination",
        url: "https://africa.si.edu/collection/selected-artwork/2196",
        type: "Museum",
      },
    ],
  },
];

const block3Sections: HistorySection[] = [
  {
    id: "nile-valley",
    kicker: "BLOCK 3A",
    title: "Egypt, Kemet, and the Nile Valley Chronology",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Ancient Egypt developed in northeastern Africa within the Nile Valley. Its history spans predynastic communities, the early dynasties, the Old, Middle, and New Kingdoms, and later periods shaped by both continuity and outside rule.",
    commonlyTaught:
      "School often reduces Egypt to pyramids, mummies, and a few pharaohs detached from the wider African setting that helped shape the civilization.",
    missingContext:
      "The Nile Valley was an ecological corridor where flood cycles, agriculture, transport, papyrus, and river-based administration helped sustain one of the world's longest-lasting states. Egypt changed over millennia; it was never one frozen culture outside of time.",
    evidence: [
      "UNESCO's General History of Africa Volume II situates Egypt, Nubia, the Sahara, and neighboring regions within a long shared African historical field rather than isolating Egypt as a separate civilizational planet.",
      "Met scholarship organizes Egypt through predynastic and dynastic development, then the Old, Middle, New, and later periods, showing major political and cultural shifts across more than three thousand years.",
      "Papyrus, flood agriculture, and river transport were not side details: Met and UCL materials show how the Nile environment shaped administration, writing, storage, labor, and communication.",
    ],
    whyItMatters:
      "Readers need the Nile Valley first, not just monuments. Once Egypt is placed back into African geography and long chronology, it becomes easier to understand both its distinctiveness and its connections.",
    caution:
      "Public language should not imply that every period of Egyptian history looked the same or that one later dynasty automatically represents the entire civilization.",
    sources: [
      {
        label: "UNESCO - General History of Africa",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "Met - Egypt in the Old Kingdom",
        url: "https://www.metmuseum.org/essays/egypt-in-the-old-kingdom",
        type: "Museum",
      },
      {
        label: "Met - Egypt in the Middle Kingdom",
        url: "https://www.metmuseum.org/essays/egypt-in-the-middle-kingdom",
        type: "Museum",
      },
      {
        label: "Met - Egypt in the New Kingdom",
        url: "https://www.metmuseum.org/essays/egypt-in-the-new-kingdom",
        type: "Museum",
      },
      {
        label: "Met - Egypt in the Late Period",
        url: "https://www.metmuseum.org/essays/egypt-in-the-late-period-ca-712-332-b-c",
        type: "Museum",
      },
      {
        label: "Met - Papyrus in Ancient Egypt",
        url: "https://www.metmuseum.org/essays/papyrus-in-ancient-egypt",
        type: "Museum",
      },
    ],
  },
  {
    id: "kemet-maat-writing",
    kicker: "BLOCK 3B",
    title: "Kemet, Ma'at, Kingship, and the Scribal State",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "The Egyptian term often transliterated as kmt or Kemet is widely connected in Egyptology to the fertile 'black land' of the Nile zone, especially when contrasted with desert terminology. That linguistic discussion belongs alongside Ma'at, kingship, writing, and scribal culture because Egypt's self-understanding was ecological, political, and moral at once.",
    commonlyTaught:
      "Many readers hear Kemet used as a slogan online, but are rarely shown the textual or linguistic evidence, the desert contrast, or how moral order and state order were tied together in Egyptian thought.",
    missingContext:
      "Ma'at was not a bumper-sticker word for 'truth' alone. It referred to right order, justice, balance, and cosmic-social stability. Kingship was judged partly by how well it preserved that order, while scribes and institutions translated it into records, ritual, taxation, legal practice, and memory.",
    evidence: [
      "UCL's translations and language materials preserve Egyptian usage that contrasts the fertile black land with the red land of the desert, which is why many specialists gloss kmt as 'Black Land' rather than turning it into a modern racial label.",
      "The Met states that the king's preeminent task was preserving maat, including peace, political stability, justice, religious duties, and the economic needs of the people.",
      "Met and UCL sources show that hieroglyphs, hieratic, and later demotic supported a scribal culture in which only a minority of the population was literate, but that minority played an outsized role in state continuity, ritual memory, and administration.",
    ],
    whyItMatters:
      "This is where language, ecology, ethics, and government meet. It helps readers see Egypt as a civilizational system rather than a pile of artifacts and social-media slogans.",
    caution:
      "Kemet should not be presented as an uncontested proof of a modern racial identity. The linguistic evidence is stronger for land and ecology terminology than for modern political reinterpretations.",
    sources: [
      {
        label: "UCL - Hymn to Senusret III",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/literature/senusret3hymn.html",
        type: "Primary Sources",
      },
      {
        label: "Met - Kings and Queens of Egypt",
        url: "https://www.metmuseum.org/essays/kings-and-queens-of-egypt",
        type: "Museum",
      },
      {
        label: "Met - Papyrus in Ancient Egypt",
        url: "https://www.metmuseum.org/essays/papyrus-in-ancient-egypt",
        type: "Museum",
      },
      {
        label: "UCL - Hieratic",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/writing/hieratic.html",
        type: "Education",
      },
      {
        label: "UCL - Literacy",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/education/literacy.html",
        type: "Education",
      },
    ],
  },
  {
    id: "women-power",
    kicker: "BLOCK 3C",
    title: "Women, Property, and Political Power in Egypt",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Women in ancient Egypt did not hold equal power to men across every domain, but the evidence does show significant legal and economic rights, along with important cases of royal and political authority.",
    commonlyTaught:
      "Public retellings tend to swing between two distortions: either Egyptian women had no meaningful rights, or Egypt is treated as though every woman enjoyed full modern equality.",
    missingContext:
      "The better historical picture is differentiated. Women could own, inherit, sell, and bequeath property in important periods, yet the society remained patriarchal and elite women had access to forms of power that ordinary women did not.",
    evidence: [
      "The Met's Hatnefer essay states that women could inherit, buy, and sell property in their own right, keep property brought into marriage, make wills, and bring grievances before judges.",
      "Met materials on Hatshepsut show a female ruler who did not simply remain queen-consort, but declared herself king and used the full titulary and monument language of pharaonic rule.",
      "Royal women such as Ahhotep, Tiye, Nefertiti, Nefertari, and later Cleopatra VII should be taught in context rather than blended into one undifferentiated 'queen' category across very different political eras.",
    ],
    whyItMatters:
      "Gender history here reveals how law, household economy, religion, dynasty, and representation worked together. It also guards against using a few famous queens to flatten the lived variation inside Egyptian society.",
    caution:
      "Cleopatra VII belongs to the later Ptolemaic period and should not be used as a shortcut for earlier dynastic Egyptian womanhood.",
    sources: [
      {
        label: "Met - The Housemistress in New Kingdom Egypt: Hatnefer",
        url: "https://www.metmuseum.org/essays/the-housemistress-in-new-kingdom-egypt-hatnefer",
        type: "Museum",
      },
      {
        label: "Met - Seated Statue of Hatshepsut",
        url: "https://www.metmuseum.org/art/collection/search/544450",
        type: "Museum",
      },
      {
        label: "Met - Challenging Power through Gender Representation",
        url: "https://www.metmuseum.org/perspectives/hatshepsut-gender-representation",
        type: "Museum",
      },
    ],
  },
  {
    id: "nubia-kush",
    kicker: "BLOCK 3D",
    title: "Nubia and Kush Were Civilizations in Their Own Right",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Nubia should not appear only when Egypt moved south. The Nile Valley south of Egypt produced its own political centers, burial traditions, trade systems, and eventually the Kingdom of Kush, with major phases at Kerma, Napata, and Meroe.",
    commonlyTaught:
      "School often treats Nubia as either an Egyptian frontier or a brief backdrop for the 25th Dynasty, leaving the impression that its history mattered only when it intersected with Egypt.",
    missingContext:
      "The evidence shows a much deeper story: long-distance exchange, state formation, royal ideology, urban development, and regional continuity south of Egypt. Kerma, Napata, and Meroe deserve independent treatment, not just sidebars.",
    evidence: [
      "The Met's Land of Nubia essay describes a river system structured by cataracts, long-term trade and warfare, Middle Kingdom fortresses, New Kingdom domination, and later Kushite expansion north into Egypt.",
      "Penn Museum scholarship describes Kerma as the earliest known civilization in Africa outside Egypt and emphasizes local state formation in Upper Nubia rather than a derivative copy of Egypt.",
      "UCL's Meroitic materials show that the kingdom remained historically vital after Egyptian rule ended, with its own artistic developments, script traditions, and political life.",
    ],
    whyItMatters:
      "Once Nubia and Kush are restored as full civilizations, the Nile Valley story stops being a one-state story and becomes a history of exchange, conflict, imitation, adaptation, and parallel power.",
    caution:
      "Public writing should not imply Nubian history began with Kush or that every Nubian polity was identical. Terms such as A-Group and C-Group belong to archaeological classification, not living self-descriptions.",
    sources: [
      {
        label: "Met - The Land of Nubia",
        url: "https://www.metmuseum.org/essays/nubia",
        type: "Museum",
      },
      {
        label: "Penn Museum - Rise of Civilization in Upper Nubia",
        url: "https://www.penn.museum/sites/expedition/rise-of-civilization-in-upper-nubia/",
        type: "Museum",
      },
      {
        label: "UCL - The Meroitic Period",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/nubia/meroitic.html",
        type: "Education",
      },
    ],
  },
  {
    id: "kushite-power",
    kicker: "BLOCK 3E",
    title: "Kushite Rule, Taharqa, the Kandakes, and Meroitic Writing",
    coverage: "Current coverage: Newly expanded",
    evidenceClass: "B",
    summary:
      "Kushite history did not begin or end with rule over Egypt. The 25th Dynasty, Taharqa's conflicts with Assyria, Kandake authority, Amanirenas's confrontation with Rome, and Meroitic writing all show a civilization with durable institutions south of Egypt.",
    commonlyTaught:
      "The 25th Dynasty is often treated like a brief anomaly, and Kandakes or Meroitic literacy are usually absent from standard school narratives.",
    missingContext:
      "Piye, Shabaka, Shebitku, Taharqa, and Tanutamani ruled Egypt as Kushite pharaohs while still rooted in Nubian kingship. After Assyrian pressure ended Kushite control of Egypt, the kingdom remained powerful farther south. Later Meroitic rulers, including Kandakes such as Amanirenas and Amanishakheto, continued that history in their own political world.",
    evidence: [
      "The Met's Third Intermediate Period essay states that Piye invaded from Kush, began the 25th Dynasty, and that Kushite rulers governed as Egyptian pharaohs while highlighting their Nubian heritage before Assyrian invasions forced retreat south.",
      "The Met's Nubia essay and scholarship on Sudanese rulers identify Napatan and Meroitic royal lines, including Kandakes and the continuation of Kush after control of Egypt ended.",
      "UCL's Meroitic materials show that the script was used from roughly the second century BCE, that names and some forms are understood, and that longer texts remain only partly understood.",
    ],
    whyItMatters:
      "This is one of the clearest places where readers can see African political power shaping Egypt, confronting Assyria, negotiating with Rome, and leaving its own still-partly unread written record.",
    caution:
      "Older claims that Meroe should simply be called 'Africa's Birmingham' overstate the current evidence. Iron production was important, but public writing should avoid industrial analogies that outrun the scholarship.",
    sources: [
      {
        label: "Met - Egypt in the Third Intermediate Period",
        url: "https://www.metmuseum.org/essays/egypt-in-the-third-intermediate-period-ca-1070-664-b-c",
        type: "Museum",
      },
      {
        label: "Met - The Land of Nubia",
        url: "https://www.metmuseum.org/essays/nubia",
        type: "Museum",
      },
      {
        label: "Met - List of Rulers of Ancient Sudan",
        url: "https://www.metmuseum.org/toah/hd/ksud/hd_ksud.htm",
        type: "Museum",
      },
      {
        label: "UCL - The Meroitic Period",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/nubia/meroitic.html",
        type: "Education",
      },
      {
        label:
          "Journal of Ancient Egyptian Interconnections - Roman Egyptian-Nubian frontier",
        url: "https://journals.uair.arizona.edu/index.php/jaei/article/view/21489",
        type: "Academic",
      },
    ],
  },
];

const block3ClaimChecks: ClaimCheck[] = [
  {
    claim: "Ancient Egyptians were white.",
    truth:
      "Egypt was an African Nile Valley civilization whose population history reflected northeastern African location, long chronology, and outside connections.",
    uncertain:
      "Ancient DNA, skeletal studies, art, and texts can illuminate populations, but available samples remain uneven by period, region, status, and preservation.",
    unsupported:
      "Sweeping claims that all ancient Egyptians fit a modern white category are not supported by the total evidence.",
    whyItMatters:
      "This claim often strips Egypt from African history by projecting later racial politics backward as though they were objective ancient categories.",
  },
  {
    claim: "Ancient Egyptians were Black.",
    truth:
      "Egypt belonged to Africa and had deep relationships with Nubia, Kush, Libya, the Red Sea world, the Levant, and the wider Nile corridor. Many modern Black readers understandably claim Egypt as part of African history for that reason.",
    uncertain:
      "The category 'Black' can describe cultural-political solidarity today, but it does not map neatly onto every individual, region, or dynasty across more than three thousand years of ancient history.",
    unsupported:
      "No responsible evidence standard supports using one slogan to fix every Egyptian across all periods into a single modern U.S. racial box.",
    whyItMatters:
      "A stronger public history can affirm Africa's place in Egyptian history without flattening the complexity of ancient populations.",
  },
  {
    claim:
      "Race worked the same way in antiquity as it does in modern America.",
    truth:
      "Ancient societies marked difference through language, place, kinship, political allegiance, class, religion, and appearance, but not through a carbon-copy version of modern American race categories.",
    uncertain:
      "Scholars still debate how best to compare ancient identity systems with modern racial frameworks.",
    unsupported:
      "Treating today's racial boxes as timeless natural facts is historically inaccurate.",
    whyItMatters:
      "Readers need a better method than slogan warfare: keep Africa central, keep the evidence visible, and admit where modern categories do not travel cleanly.",
  },
];

const block3SchoolGaps: CurriculumGap[] = [
  {
    title: "Nubia and Kush as full civilizations",
    commonlyTaught:
      "Nubia appears briefly, usually as Egypt's southern neighbor or a note about gold and trade.",
    missingContext:
      "Kerma, Napata, and Meroe had their own political systems, royal traditions, urban centers, and historical trajectories.",
    evidence:
      "Met, Penn, and UCL materials all treat Nubia and Kush as independent historical subjects with their own chronology and institutions.",
    whyItMatters:
      "Without this, the Nile Valley becomes falsely one-sided and Africa south of Egypt disappears from the story.",
  },
  {
    title: "Kushite rule over Egypt",
    commonlyTaught:
      "The 25th Dynasty is rarely emphasized or is presented as a short interruption in Egyptian history.",
    missingContext:
      "Piye, Shabaka, Shebitku, Taharqa, and Tanutamani ruled Egypt as Kushite pharaohs and mattered in Mediterranean and Near Eastern politics.",
    evidence:
      "Met scholarship directly links Kushite expansion from Napata to Egyptian kingship and later Assyrian conflict.",
    whyItMatters:
      "It reverses the usual direction of the story by showing power moving north from Kush into Egypt.",
  },
  {
    title: "The Kandakes and Amanirenas",
    commonlyTaught:
      "Roman history gets taught, but Kushite queens and their diplomacy or warfare against Rome usually do not.",
    missingContext:
      "Kandake was a title, not a single personal name, and Amanirenas's conflict with Rome shows sustained Kushite political agency.",
    evidence:
      "Met, UCL, and specialist scholarship all point to the political significance of Kandake authority and the Roman frontier in Nubia.",
    whyItMatters:
      "This expands who counts as a major historical actor in classical-era narratives.",
  },
  {
    title: "Meroitic writing and what remains unknown",
    commonlyTaught:
      "Students may never hear that Kush had its own script traditions after Egypt, or they hear only overconfident online claims.",
    missingContext:
      "Meroitic script can be read phonetically in many cases, but the language is not fully understood and longer texts remain partly opaque.",
    evidence:
      "UCL's Meroitic materials stress both the importance of the script and the limits of current decipherment.",
    whyItMatters:
      "It teaches intellectual honesty: knowing the past sometimes means clearly naming what we still do not know.",
  },
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

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
          <Card
            kicker="WORKSTREAM 002"
            title="Research standard, coverage audit, and build order"
            icon={<BookOpen className="h-5 w-5 text-[#D4AF37]" />}
          >
            <p className="text-white/75">
              This library is no longer just a list of links. It is being
              expanded as a serious historical program. The current page remains
              the foundation, but each new block must be strong enough to stand
              on its own and honest enough to label what is fact,
              interpretation, tradition, and dispute.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Callout title="Current audit" tone="gold">
                The live library already works as a source gateway and a truth
                frame. It is still thin on many pre-captivity civilizations,
                African sacred systems, and Black American wealth history after
                emancipation.
              </Callout>
              <Callout title="Evidence rule" tone="emerald">
                We are prioritizing UNESCO, Smithsonian, major museums,
                archives, databases, and scholarly collections over internet
                summaries and recycled social content.
              </Callout>
              <Callout title="What comes next" tone="red">
                The current active build is Egypt, Nubia, Kush, and the Nile
                Valley. It treats chronology, writing, women, statecraft, and
                identity claims as core content rather than optional notes.
              </Callout>
            </div>
          </Card>

          <Card
            kicker="HISTORY ROADMAP"
            title="The program this library is growing into"
            icon={<Globe className="h-5 w-5 text-[#D4AF37]" />}
          >
            <div className="space-y-3">
              {historyJourneys.map((item) => (
                <div
                  key={item.block}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-white/45 font-extrabold">
                        {item.block}
                      </div>
                      <div className="mt-1 text-sm font-extrabold text-white">
                        {item.title}
                      </div>
                    </div>
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                        item.status === "Active now"
                          ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                          : item.status === "Completed checkpoint"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-white/5 text-white/55",
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card
            kicker="FIRST SUBSTANTIVE EXPANSION"
            title="Block 2: origins, Africa before captivity, sacred worlds, and Yoruba worldview"
            icon={<LibraryBig className="h-5 w-5 text-[#D4AF37]" />}
          >
            <p className="text-white/75">
              The library now begins where too many public histories do not:
              before captivity, before reduction, and before the lie that Black
              history only matters when it enters someone else&apos;s economy.
            </p>

            <div className="mt-5 space-y-4">
              {historySections.map((section) => (
                <section
                  key={section.id}
                  className="rounded-[28px] border border-white/10 bg-black/30 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-white/45 font-extrabold">
                        {section.kicker}
                      </div>
                      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                        {section.title}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-extrabold">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/65">
                          {section.coverage}
                        </span>
                        <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[#D4AF37]">
                          Evidence class {section.evidenceClass}
                        </span>
                      </div>
                    </div>

                    <div className="max-w-sm text-sm leading-relaxed text-white/70">
                      {section.summary}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-4">
                    <div className="space-y-4">
                      <Callout title="Commonly taught" tone="red">
                        {section.commonlyTaught}
                      </Callout>
                      <Callout title="Missing context" tone="gold">
                        {section.missingContext}
                      </Callout>
                      <Callout title="Why it matters" tone="emerald">
                        {section.whyItMatters}
                      </Callout>
                      {section.caution ? (
                        <Callout title="Evidence caution" tone="red">
                          {section.caution}
                        </Callout>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-widest text-white/45 font-extrabold">
                          The evidence
                        </div>
                        <List
                          items={section.evidence.map((item) => (
                            <>{item}</>
                          ))}
                        />
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-widest text-white/45 font-extrabold">
                          Source path
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          {section.sources.map((source) => (
                            <ExternalA
                              key={source.url}
                              href={source.url}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.06]"
                            >
                              <span className="min-w-0">
                                <span className="text-[#D4AF37] font-extrabold text-[12px]">
                                  {source.type}
                                </span>{" "}
                                <span className="text-white/80">-</span>{" "}
                                <span className="font-semibold">
                                  {source.label}
                                </span>
                              </span>
                              <ExternalLink className="h-4 w-4 shrink-0 text-white/50" />
                            </ExternalA>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card
            kicker="CURRENT ACTIVE BUILD"
            title="Block 3: Egypt, Kemet, the Nile Valley, Nubia, and Kush"
            icon={<Landmark className="h-5 w-5 text-[#D4AF37]" />}
          >
            <p className="text-white/75">
              This section keeps Egypt in Africa, keeps Nubia and Kush visible
              in their own right, and refuses the false choice between
              slogan-level racial claims and evidence-free detachment. The Nile
              Valley is treated here as chronology, ecology, language, power,
              and relationship.
            </p>

            <div className="mt-5 space-y-4">
              {block3Sections.map((section) => (
                <section
                  key={section.id}
                  className="rounded-[28px] border border-white/10 bg-black/30 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-white/45 font-extrabold">
                        {section.kicker}
                      </div>
                      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                        {section.title}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-extrabold">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/65">
                          {section.coverage}
                        </span>
                        <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[#D4AF37]">
                          Evidence class {section.evidenceClass}
                        </span>
                      </div>
                    </div>

                    <div className="max-w-sm text-sm leading-relaxed text-white/70">
                      {section.summary}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 xl:grid-cols-[0.92fr_1.08fr] gap-4">
                    <div className="space-y-4">
                      <Callout title="Commonly taught" tone="red">
                        {section.commonlyTaught}
                      </Callout>
                      <Callout title="Missing context" tone="gold">
                        {section.missingContext}
                      </Callout>
                      <Callout title="Why it matters" tone="emerald">
                        {section.whyItMatters}
                      </Callout>
                      {section.caution ? (
                        <Callout title="Evidence caution" tone="red">
                          {section.caution}
                        </Callout>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-widest text-white/45 font-extrabold">
                          The evidence
                        </div>
                        <List
                          items={section.evidence.map((item) => (
                            <>{item}</>
                          ))}
                        />
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-widest text-white/45 font-extrabold">
                          Source path
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          {section.sources.map((source) => (
                            <ExternalA
                              key={source.url}
                              href={source.url}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.06]"
                            >
                              <span className="min-w-0">
                                <span className="text-[#D4AF37] font-extrabold text-[12px]">
                                  {source.type}
                                </span>{" "}
                                <span className="text-white/80">-</span>{" "}
                                <span className="font-semibold">
                                  {source.label}
                                </span>
                              </span>
                              <ExternalLink className="h-4 w-4 shrink-0 text-white/50" />
                            </ExternalA>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.04fr_0.96fr] gap-4">
              <div className="rounded-[28px] border border-white/10 bg-black/30 p-5 sm:p-6">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/45 font-extrabold">
                  Myth, claim & evidence
                </div>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                  Egypt, Africa, and the limits of modern racial boxes
                </h3>
                <p className="mt-3 max-w-3xl text-white/70 leading-relaxed">
                  The evidence is strong enough to reject simplistic detachment
                  of Egypt from Africa and strong enough to reject lazy
                  overreach in the other direction. The better method is to keep
                  geography, chronology, and source limits visible.
                </p>
                <div className="mt-5 space-y-4">
                  {block3ClaimChecks.map((item) => (
                    <div
                      key={item.claim}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="text-sm font-extrabold text-[#D4AF37]">
                        {item.claim}
                      </div>
                      <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/75">
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
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-white/70">
                  Ancient DNA is part of this discussion, but it is not a magic
                  final answer. A 2025 Old Kingdom genome study and the earlier
                  2017 mummy-genome study both expand the evidence while also
                  underscoring sample limitations across region, era, and social
                  position.
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/30 p-5 sm:p-6">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/45 font-extrabold">
                  What school often left out
                </div>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                  Nile Valley context that changes the story
                </h3>
                <div className="mt-5 space-y-4">
                  {block3SchoolGaps.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="text-sm font-extrabold text-white">
                        {item.title}
                      </div>
                      <div className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
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
              </div>
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
