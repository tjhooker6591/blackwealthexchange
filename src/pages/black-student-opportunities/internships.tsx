// /pages/black-student-opportunities/internships.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Clock,
  AlertTriangle,
  Rss,
} from "lucide-react";

type FeedItem = {
  title: string;
  link: string;
  source?: string;
  publishedAt?: string;
  summary?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Card({
  title,
  icon: Icon,
  children,
  className,
}: {
  title?: string;
  icon?: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-[26rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-[-5rem] h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

      {(title || Icon) && (
        <div className="relative mb-3 flex items-center gap-2">
          {Icon ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30">
              <Icon className="h-5 w-5 text-[#D4AF37]" />
            </span>
          ) : null}
          {title ? (
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              {title}
            </h2>
          ) : null}
        </div>
      )}

      <div className="relative">{children}</div>
    </section>
  );
}

function ActionLink({
  href,
  label,
  sublabel,
  variant = "primary",
}: {
  href: string;
  label: string;
  sublabel?: string;
  variant?: "primary" | "ghost";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "group inline-flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
        variant === "primary"
          ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/15"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
      )}
    >
      <div className="min-w-0">
        <div className="truncate font-extrabold text-white">
          {label}{" "}
          <span className="text-[#D4AF37] group-hover:text-[#D4AF37]">→</span>
        </div>
        {sublabel ? (
          <div className="mt-0.5 truncate text-[12px] text-white/60">
            {sublabel}
          </div>
        ) : null}
      </div>

      <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30">
        <ExternalLink className="h-4 w-4 text-white/70" />
      </span>
    </a>
  );
}

export default function Internships() {
  const year = 2026;

  // Optional live feed
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedStatus, setFeedStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setFeedStatus("loading");
        const res = await fetch("/api/feeds/internships?limit=8", {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("feed unavailable");
        const data = await res.json();

        const items: FeedItem[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];

        if (alive) {
          setFeedItems(items.slice(0, 8));
          setFeedStatus(items.length ? "ready" : "error");
        }
      } catch {
        if (alive) setFeedStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const featuredPrograms = useMemo(
    () => [
      {
        title: "USAJOBS Pathways (Federal Internships)",
        desc:
          "Paid internships across U.S. federal agencies. Great for students who want stable, résumé-building experience.",
        eligibility: "Varies by listing (student status required).",
        link: "https://www.usajobs.gov/Help/working-in-government/unique-hiring-paths/students/",
        tags: ["Paid", "Federal", "Many fields"],
      },
      {
        title: "NIH Summer Internship Program (SIP)",
        desc:
          "Research-focused internships at NIH. Strong option for STEM, health, and biomedical students.",
        eligibility: "Varies by program (often undergraduate/grad).",
        link: "https://www.training.nih.gov/programs/sip/",
        tags: ["Research", "STEM", "Prestige"],
      },
      {
        title: "NSF REU (Research Experiences for Undergraduates)",
        desc:
          "Paid summer research at universities/labs across the U.S. Excellent for building grad-school-ready experience.",
        eligibility: "Undergraduates (requirements vary by site).",
        link: "https://www.nsf.gov/crssprgm/reu/",
        tags: ["Paid", "Research", "Summer"],
      },
      {
        title: "Google Careers — Student & Internship Roles",
        desc:
          "Search current student internships (engineering, design, business, and more).",
        eligibility: "Varies by role/location.",
        link: "https://careers.google.com/jobs",
        tags: ["Tech", "Students", "Global"],
      },
      {
        title: "Thurgood Marshall College Fund (TMCF) Opportunities",
        desc:
          "Career, internship, and leadership opportunities strongly aligned with HBCU students and Black excellence.",
        eligibility: "Varies by opportunity.",
        link: "https://www.tmcf.org/students-alumni/",
        tags: ["HBCU", "Career", "Network"],
      },
      {
        title: "HBCUConnect Internship & Job Board",
        desc:
          "A consistent place to find internships plus employer outreach to HBCU talent.",
        eligibility: "Varies by listing.",
        link: "https://hbcuconnect.com/",
        tags: ["HBCU", "Board", "Recruiting"],
      },
    ],
    [],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Background layers (index-style) */}
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/70 to-black/90" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[850px] w-[850px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[560px] w-[560px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <main className="relative z-10">
        {/* Top nav / breadcrumb */}
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold text-white/80 transition hover:bg-white/[0.06]"
            >
              <Image
                src="/favicon.png"
                alt="BWE Logo"
                width={26}
                height={26}
                className="rounded"
              />
              Black Wealth Exchange
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/black-student-opportunities"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold text-white/75 transition hover:bg-white/[0.06]"
              >
                Student Opportunities
              </Link>
            </div>
          </div>

          {/* Hero */}
          <header className="mt-8 text-center">
            <div className="mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <span className="font-semibold tracking-wide">
                Updated for {year} • Trusted Opportunities
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Internships for Black Students
              <span className="text-[#D4AF37]">.</span>
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-white/70">
              Internships are a fast path to career clarity, mentorship, and
              real experience. Use trusted sources, apply early, and keep your
              résumé ready year-round.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/60">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                Résumé-ready checklist
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                Trusted sources first
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                No-fee safety rules
              </span>
            </div>
          </header>

          {/* Content grid */}
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {/* Left: Featured Programs */}
            <div className="lg:col-span-2 space-y-6">
              <Card title="Featured Programs & Trusted Sources" icon={Briefcase}>
                <p className="text-sm text-white/70">
                  Deadlines change often — these links point to official hubs or
                  stable boards where you can filter by{" "}
                  <span className="text-white/85 font-bold">
                    internship + student
                  </span>{" "}
                  roles.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {featuredPrograms.map((p) => (
                    <div
                      key={p.title}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-extrabold text-white truncate">
                            {p.title}
                          </div>
                          <div className="mt-1 text-[12px] text-white/65">
                            {p.desc}
                          </div>
                        </div>
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                          title="Open"
                        >
                          <ExternalLink className="h-4 w-4 text-white/70" />
                        </a>
                      </div>

                      <div className="mt-3 text-[12px] text-white/60">
                        <span className="font-bold text-white/75">
                          Eligibility:
                        </span>{" "}
                        {p.eligibility}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/65"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* How to win in 2026 */}
              <Card title={`How to Win Internships in ${year}`} icon={Clock}>
                <ul className="list-disc space-y-3 pl-5 text-sm text-white/70">
                  <li>
                    Apply early: many programs open months before summer. Keep a
                    running list of 10–20 targets.
                  </li>
                  <li>
                    Tailor fast: keep 2–3 résumé versions (Tech, Business, Public
                    Service) and adjust bullets per role.
                  </li>
                  <li>
                    Use proof: add 2–3 quantified outcomes (projects, metrics,
                    leadership) so you stand out in seconds.
                  </li>
                  <li>
                    Build a “Portfolio Page” (even simple): GitHub, Notion, or a
                    personal site with your best work + 1-minute intro.
                  </li>
                  <li>
                    Ask for referrals: professors, career center, alumni groups,
                    and HBCU networks move applications faster.
                  </li>
                </ul>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ActionLink
                    href="https://www.usajobs.gov/Help/"
                    label="USAJOBS Help Center"
                    sublabel="Learn how to apply the right way"
                    variant="ghost"
                  />
                  <ActionLink
                    href="https://www2.ed.gov/about/contacts/state/index.html"
                    label="Find state education resources"
                    sublabel="State agencies + programs"
                    variant="ghost"
                  />
                </div>
              </Card>
            </div>

            {/* Right: Live feed + Safety + Navigation */}
            <div className="space-y-6">
              <Card title="Live Internship Feed (Optional)" icon={Rss}>
                <p className="text-sm text-white/70">
                  This section can pull from RSS/feeds via{" "}
                  <span className="font-bold text-white/80">
                    /api/feeds/internships
                  </span>
                  . If you haven’t built it yet, no problem — the page stays
                  clean.
                </p>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  {feedStatus === "loading" && (
                    <div className="text-sm text-white/60">
                      Loading live feed…
                    </div>
                  )}

                  {feedStatus === "ready" && feedItems.length > 0 && (
                    <div className="space-y-3">
                      {feedItems.map((it) => (
                        <a
                          key={it.link}
                          href={it.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:bg-white/[0.05]"
                        >
                          <div className="text-sm font-extrabold text-white line-clamp-2">
                            {it.title}
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-white/55">
                            <span className="truncate">
                              {it.source || "Source"}
                            </span>
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {feedStatus === "error" && (
                    <div className="text-sm text-white/60">
                      Live feed is not connected yet. (Optional upgrade)
                      <div className="mt-3 space-y-2">
                        <ActionLink
                          href="https://www.usajobs.gov/"
                          label="Browse USAJOBS"
                          sublabel="Filter by internships + students"
                          variant="primary"
                        />
                        <ActionLink
                          href="https://hbcuconnect.com/"
                          label="Browse HBCUConnect"
                          sublabel="Internships & recruiting board"
                          variant="primary"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-[11px] text-white/50">
                  If you want, we’ll add an API route that aggregates trusted
                  feeds and caches results so it stays fast in production.
                </div>
              </Card>

              <Card title="Safety: Avoid Internship Scams" icon={ShieldCheck}>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
                    <div className="text-sm text-white/75">
                      Never pay a “registration fee” for an internship. Use
                      official sites, verify emails/domains, and keep everything
                      documented.
                    </div>
                  </div>
                </div>

                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
                  <li>
                    Prefer official portals (company careers pages, USAJOBS, NIH,
                    NSF, etc.).
                  </li>
                  <li>Confirm the role exists on the employer’s real site.</li>
                  <li>
                    Do not share sensitive info (SSN, bank info) until you’ve
                    verified legitimacy.
                  </li>
                </ul>
              </Card>

              <Card title="Quick Navigation">
                <div className="grid gap-2">
                  <Link
                    href="/black-student-opportunities/scholarships"
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-extrabold text-white/80 transition hover:bg-white/[0.06]"
                  >
                    Scholarships →
                  </Link>
                  <Link
                    href="/black-student-opportunities/grants"
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-extrabold text-white/80 transition hover:bg-white/[0.06]"
                  >
                    Grants →
                  </Link>
                  <Link
                    href="/black-student-opportunities/mentorship"
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-extrabold text-white/80 transition hover:bg-white/[0.06]"
                  >
                    Mentorship →
                  </Link>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href="/"
                    className="flex-1 rounded-xl bg-[#D4AF37] px-4 py-3 text-center text-sm font-extrabold text-black shadow transition hover:bg-yellow-500"
                  >
                    Back to Home
                  </Link>
                  <Link
                    href="/black-student-opportunities"
                    className="flex-1 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-3 text-center text-sm font-extrabold text-[#D4AF37] transition hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/15"
                  >
                    Back to Student Hub
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          {/* Footer spacing */}
          <div className="h-14" />
        </div>
      </main>
    </div>
  );
}
