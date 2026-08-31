"use client";

import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, BookOpen, Globe, Landmark, Shield } from "lucide-react";
import {
  Expandable,
  ResourceExplorer,
} from "@/components/history/black-history-ui";
import {
  chapterCards,
  type Region,
  type ResourceLink,
} from "@/lib/black-history-foundations";

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

const libraryItems: LibraryItem[] = [
  {
    id: 101,
    title: "African Government & Political Systems",
    summary:
      "Comparative starting points for kingdoms, councils, acephalous systems, title societies, and institutional diversity across the continent.",
    category: "Truth & Context",
    region: "Africa",
    links: [
      {
        label: "UNESCO overview (volumes & project)",
        url: "https://www.unesco.org/en/general-history-africa",
        type: "Open Access",
      },
      {
        label: "Met - Ways of Recording African History",
        url: "https://www.metmuseum.org/essays/ways-of-recording-african-history",
        type: "Museum",
      },
      {
        label: "Met - Origins and Empire: Benin, Owo, and Ijebu",
        url: "https://www.metmuseum.org/essays/origins-and-empire-the-benin-owo-and-ijebu-kingdoms",
        type: "Academic",
      },
    ],
  },
  {
    id: 102,
    title: "African Writing Systems & Manuscript Cultures",
    summary:
      "A research trail for Egyptian scripts, Meroitic, Ge'ez, Arabic manuscript cultures, Nsibidi, Libyco-Berber/Tifinagh, and later script innovation.",
    category: "Research Tools",
    region: "Africa",
    links: [
      {
        label: "UCL - The Meroitic Period",
        url: "https://www.ucl.ac.uk/museums-static/digitalegypt/nubia/meroitic.html",
        type: "Education",
      },
      {
        label: "Met - Monumental Architecture of the Aksumite Empire",
        url: "https://www.metmuseum.org/essays/monumental-architecture-and-stelae-of-the-aksumite-empire",
        type: "Museum",
      },
      {
        label: "Library of Congress - Islamic Manuscripts from Mali",
        url: "https://www.loc.gov/collections/islamic-manuscripts-from-mali/about-this-collection/",
        type: "Archive",
      },
      {
        label: "Met - Akwanshi Stone Monoliths and Nsibidi context",
        url: "https://www.metmuseum.org/essays/akwanshi-stone-monoliths",
        type: "Museum",
      },
      {
        label: "Library of Congress - Bamum Script Guide",
        url: "https://guides.loc.gov/bamum-script",
        type: "Education",
      },
    ],
  },
  {
    id: 103,
    title: "Benin Kingdom, Court Art, and 1897 Looting",
    summary:
      "Historical Edo statecraft, guild production, Portuguese contact, palace archives, and the violent dispersal of royal art in 1897.",
    category: "Colonialism & Extraction",
    region: "Africa",
    links: [
      {
        label: "Met - Benin Chronology",
        url: "https://www.metmuseum.org/essays/benin-chronology",
        type: "Museum",
      },
      {
        label: "Met - Idia, First Queen Mother of Benin",
        url: "https://www.metmuseum.org/essays/idia-the-first-queen-mother-of-benin",
        type: "Museum",
      },
      {
        label: "British Museum - Benin Bronzes",
        url: "https://www.britishmuseum.org/about-us/british-museum-story/contested-objects-collection/benin-bronzes",
        type: "Museum",
      },
    ],
  },
  {
    id: 104,
    title: "Igbo-Ukwu, Great Zimbabwe, and African Technology",
    summary:
      "Archaeology, trade, stone architecture, metallurgy, and the caution required when the evidence is strong but popular retellings overshoot it.",
    category: "Culture & Contribution",
    region: "Africa",
    links: [
      {
        label: "Met - Igbo-Ukwu",
        url: "https://www.metmuseum.org/essays/igbo-ukwu-ca-9th-century",
        type: "Museum",
      },
      {
        label: "UNESCO - Great Zimbabwe National Monument",
        url: "https://whc.unesco.org/en/list/364/",
        type: "Open Access",
      },
      {
        label: "Met - African Lost-Wax Casting",
        url: "https://www.metmuseum.org/essays/african-lost-wax-casting",
        type: "Museum",
      },
    ],
  },
  {
    id: 105,
    title: "West African Empires, Trade Networks, and State Power",
    summary:
      "A starting source path for Ghana or Wagadu, Mali, Songhai, caravan taxation, gold, salt, and the political geography of the western Sudan.",
    category: "Truth & Context",
    region: "Africa",
    links: [
      {
        label: "Met - The Empires of the Western Sudan",
        url: "https://www.metmuseum.org/essays/the-empires-of-the-western-sudan",
        type: "Museum",
      },
      {
        label: "Met - The Trans-Saharan Gold Trade",
        url: "https://www.metmuseum.org/essays/the-trans-saharan-gold-trade-7th-14th-century",
        type: "Academic",
      },
      {
        label: "Fordham - Internet African History Sourcebook",
        url: "https://sourcebooks.web.fordham.edu/africa/africasbook.asp",
        type: "Primary Sources",
      },
    ],
  },
  {
    id: 106,
    title: "Timbuktu, Manuscripts, and Scholarly Networks",
    summary:
      "A focused research trail for Timbuktu as market, manuscript center, legal culture, and educational network rather than a loose legend.",
    category: "Research Tools",
    region: "Africa",
    links: [
      {
        label: "UNESCO - Timbuktu",
        url: "https://whc.unesco.org/en/list/119/",
        type: "Open Access",
      },
      {
        label: "Library of Congress - Ancient Manuscripts from Timbuktu",
        url: "https://www.loc.gov/exhibits/mali/mali-exhibit.html",
        type: "Archive",
      },
      {
        label: "Library of Congress - Islamic Manuscripts from Mali",
        url: "https://www.loc.gov/collections/islamic-manuscripts-from-mali/about-this-collection/",
        type: "Archive",
      },
    ],
  },
  {
    id: 107,
    title: "Gao, Djenné, and Sahelian Urban History",
    summary:
      "Use this cluster for Askia, Gao, the Tomb of Askia, Djenné-Djeno, later Djenné, urban continuity, and Sudano-Sahelian architecture.",
    category: "Culture & Contribution",
    region: "Africa",
    links: [
      {
        label: "UNESCO - Tomb of Askia",
        url: "https://whc.unesco.org/en/list/1139/",
        type: "Open Access",
      },
      {
        label: "UNESCO - Old Towns of Djenne",
        url: "https://whc.unesco.org/en/list/116/",
        type: "Open Access",
      },
      {
        label: "Met - Sahel: Art and Empires on the Shores of the Sahara",
        url: "https://www.metmuseum.org/exhibitions/sahel-art-empire-sahara/inside-the-exhibition",
        type: "Museum",
      },
    ],
  },
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
      "Primary-source interviews that capture voices and memories of enslaved people in the United States.",
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
    title: "The National Archives (UK) — research guidance",
    summary:
      "Practical guidance for records shaped by empire, migration, and racialized documentation.",
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
    title: "International Slavery Museum — exhibitions & learning",
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
    title: "Digital Library of the Caribbean (dLOC)",
    summary:
      "A deep multi-institution collection across the Caribbean: slavery, emancipation, revolution, migration, and culture.",
    category: "Diaspora & Migration",
    region: "Caribbean",
    links: [
      {
        label: "dLOC collections",
        url: "https://dloc.com/",
        type: "Archive",
      },
      {
        label: "Early Caribbean Digital Archive",
        url: "https://dloc.com/collections/ecda",
        type: "Open Access",
      },
    ],
  },
  {
    id: 9,
    title: "South African History Online",
    summary:
      "Accessible historical materials on apartheid, resistance, and broader African political history.",
    category: "Apartheid & Global Racial Systems",
    region: "Africa",
    links: [
      {
        label: "SAHO Apartheid topic portal",
        url: "https://www.sahistory.org.za/topic/apartheid-1948-1994",
        type: "Education",
      },
    ],
  },
  {
    id: 10,
    title: "Apartheid Museum — learner materials",
    summary:
      "Education material connecting policy, propaganda, and racial control systems to lived reality.",
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
      "A collaborative data hub for the lives of enslaved people and descendants across institutions.",
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
    title: "UNESCO — The Slave Route",
    summary:
      "A UNESCO initiative focused on research, remembrance, and education around slavery and its legacies.",
    category: "Slavery & Abolition",
    region: "Global",
    links: [
      {
        label: "UNESCO Slave Route",
        url: "https://en.unesco.org/themes/fostering-rights-inclusion/slave-route",
        type: "Education",
      },
    ],
  },
  {
    id: 13,
    title: "Schomburg Center (NYPL)",
    summary:
      "One of the most important institutions for Black history: manuscripts, arts, photos, and research guides.",
    category: "Culture & Contribution",
    region: "United States",
    links: [
      {
        label: "Schomburg Center",
        url: "https://www.nypl.org/locations/schomburg",
        type: "Archive",
      },
    ],
  },
  {
    id: 14,
    title: "Pan-African & diaspora lens",
    summary:
      "Start with clear definitions: diaspora, displacement, migration, cultural retention, and global influence patterns.",
    category: "Diaspora & Migration",
    region: "Global",
    links: [
      {
        label: "African diaspora overview",
        url: "https://www.britannica.com/topic/African-diaspora",
        type: "Academic",
      },
    ],
  },
  {
    id: 15,
    title: "Racial capitalism & extraction",
    summary:
      "A lens for understanding how race and profit systems reinforce each other through labor, credit, housing, and media.",
    category: "Truth & Context",
    region: "Global",
    links: [
      {
        label: "Stanford Encyclopedia search",
        url: "https://plato.stanford.edu/search/searcher.py?query=racial+capitalism",
        type: "Academic",
      },
    ],
  },
  {
    id: 16,
    title: "Economics & Ownership",
    summary:
      "Learn the mechanics: business formation, capital access, supply chains, ownership models, and compounding.",
    category: "Economics & Ownership",
    region: "Global",
    links: [
      {
        label: "OECD financial literacy topic",
        url: "https://www.oecd.org/financial/education/",
        type: "Education",
      },
    ],
  },
  {
    id: 17,
    title: "Modern propaganda and media literacy",
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
    title: "Civil rights and global rights movements",
    summary:
      "Understand shared patterns across state power, legal systems, labor control, education, policing, and resistance.",
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
      "Museum essays connecting the Nile Valley chronologically: Old Kingdom, Middle Kingdom, New Kingdom, later Egypt, Nubia, and Kush.",
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
        label: "Nature — Old Kingdom Egyptian genome",
        url: "https://www.nature.com/articles/s41586-025-09195-5",
        type: "Academic",
      },
      {
        label: "Nature news coverage",
        url: "https://www.nature.com/articles/d41586-025-02102-y",
        type: "Academic",
      },
      {
        label: "Ancient Egyptian mummy genomes",
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

export default function LibraryOfBlackHistory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<
    (typeof ALL_CATEGORIES)[number] | "All"
  >("All");
  const [region, setRegion] = useState<Region | "All">("All");
  const [showFilters, setShowFilters] = useState(false);

  const filteredResources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return libraryItems.filter((item) => {
      const matchQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.links.some(
          (link) =>
            link.label.toLowerCase().includes(q) ||
            link.type.toLowerCase().includes(q),
        );

      const matchCategory = category === "All" || item.category === category;
      const matchRegion = region === "All" || item.region === region;

      return matchQ && matchCategory && matchRegion;
    });
  }, [category, query, region]);

  const visibleResources = useMemo(() => {
    if (query || category !== "All" || region !== "All") {
      return filteredResources;
    }

    return filteredResources.slice(0, 3);
  }, [category, filteredResources, query, region]);

  const filteredChapters = useMemo(() => {
    const q = query.trim().toLowerCase();

    return chapterCards.filter((chapter) => {
      if (!q) {
        return true;
      }

      return (
        chapter.eyebrow.toLowerCase().includes(q) ||
        chapter.title.toLowerCase().includes(q) ||
        chapter.summary.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Head>
        <title>Library of Black History | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Explore Black history through chapter-based reading, search, museums, archives, and source-led context."
        />
      </Head>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%)]" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-emerald-500/[0.08] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur sm:p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[12px] font-extrabold text-[#D4AF37]">
            <Globe className="h-4 w-4" />
            Searchable library • Chapter reading • Source-led history
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Library of <span className="text-[#D4AF37]">Black History</span>
          </h1>

          <p className="mt-4 max-w-4xl text-lg leading-8 text-white/78">
            Our history did not begin in captivity. Explore the civilizations,
            faiths, people, institutions, resistance, and economic histories
            that shaped the Black world.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[30px] border border-white/10 bg-black/30 p-5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/50">
                Search Black History
              </div>
              <p className="mt-2 text-sm leading-7 text-white/70">
                Find chapters, people, themes, regions, and source paths without
                scrolling through the full archive on one page.
              </p>
              <div className="mt-4">
                <ResourceExplorer
                  query={query}
                  setQuery={setQuery}
                  filtered={visibleResources}
                  category={category}
                  setCategory={setCategory}
                  region={region}
                  setRegion={setRegion}
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                  allCategories={ALL_CATEGORIES}
                  allRegions={ALL_REGIONS}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[30px] border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
                  <Shield className="h-4 w-4" />
                  Featured Learning Tool
                </div>
                <h2 className="mt-3 text-2xl font-extrabold text-white">
                  What we were taught vs what the evidence shows
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  The Truth Mirror stays here as a guide for reading history
                  with better questions, not as the first wall of text on
                  mobile.
                </p>
                <div className="mt-4">
                  <Expandable label="Open the Truth Mirror">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="rounded-3xl border border-red-500/20 bg-red-500/8 p-4">
                        <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-red-300">
                          What many people were taught
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/80">
                          A short version of history can make slavery look
                          finished, reduce progress to a few heroes, and turn
                          culture into a substitute for institutions and
                          ownership.
                        </p>
                      </div>
                      <div className="rounded-3xl border border-[#D4AF37]/20 bg-[#D4AF37]/8 p-4">
                        <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
                          Missing context
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/80">
                          The full story includes systems, law, finance, trade,
                          propaganda, resistance, and the long afterlife of
                          wealth extraction across Africa and the diaspora.
                        </p>
                      </div>
                      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                        <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-emerald-300">
                          Why it matters
                        </div>
                        <p className="mt-3 text-sm leading-7 text-white/80">
                          Once readers understand the pattern, they can stop
                          mistaking damage for destiny and start recognizing the
                          institutions, choices, and structures that shaped it.
                        </p>
                      </div>
                    </div>
                  </Expandable>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
                  <BookOpen className="h-4 w-4" />
                  Reading Paths
                </div>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  Move through the library by chapter. Each path keeps the story
                  first and the evidence layers available when you want them.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
                Major Pathways
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Read the library by chapter
              </h2>
            </div>
            {query ? (
              <div className="text-sm font-extrabold text-white/55">
                {filteredChapters.length} chapter matches
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredChapters.map((chapter) => (
              <article
                key={chapter.slug}
                className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
              >
                <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
                  {chapter.eyebrow}
                </div>
                <h3 className="mt-3 text-2xl font-extrabold text-white">
                  {chapter.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  {chapter.summary}
                </p>
                <Link
                  href={`/library-of-black-history/${chapter.slug}`}
                  className="mt-5 inline-flex items-center text-sm font-extrabold text-[#D4AF37] transition hover:text-yellow-300"
                >
                  Open chapter <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
              <Landmark className="h-4 w-4" />
              Ancient Africa
            </div>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Egypt, Nubia, Kush, Ma&apos;at, royal women, Taharqa, the
              Kandakes, and the limits of modern racial projection.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
              <BookOpen className="h-4 w-4" />
              Kingdoms & Knowledge
            </div>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Government, writing systems, oral knowledge, education, Benin,
              Igbo-Ukwu, Great Zimbabwe, and science with evidence boundaries.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#D4AF37]">
              <Globe className="h-4 w-4" />
              West African Civilizations
            </div>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Ghana or Wagadu, Mali, Mansa Musa, Timbuktu, manuscripts, Songhai,
              cities, gold, salt, and trans-Saharan networks.
            </p>
          </div>
        </section>

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
      </div>
    </div>
  );
}
