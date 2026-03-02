// src/pages/economic-freedom.tsx
"use client";

import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  BookOpen,
  Store,
  Landmark,
  LineChart,
  Users,
  ArrowRight,
  Flame,
  Brain,
  Tv2,
  Megaphone,
  Repeat,
} from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** -----------------------------
 *  SMALL UI HELPERS (mobile-friendly)
 *  ----------------------------- */

function Pill({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[12px] font-extrabold text-[#D4AF37]">
      {icon}
      {children}
    </span>
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

function List({
  items,
  dense,
}: {
  items: Array<React.ReactNode>;
  dense?: boolean;
}) {
  return (
    <ul className={cx("mt-3", dense ? "space-y-1.5" : "space-y-2")}>
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#D4AF37]/70" />
          <span className={cx("text-white/75", dense ? "text-[13px]" : "")}>
            {t}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Collapsible content for mobile: shows a short preview, user taps “Show more”.
 * Default is collapsed to prevent overload on small screens.
 */
function ReadMore({
  preview,
  children,
  defaultOpen = false,
}: {
  preview: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-3">
      <div className="text-white/75 leading-relaxed">{preview}</div>

      <div
        className={cx(
          "overflow-hidden transition-[max-height,opacity] duration-300",
          open ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="pt-3 text-white/75 leading-relaxed">{children}</div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-extrabold text-white/80 transition hover:bg-white/[0.06]"
      >
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

function Card({
  id,
  title,
  icon,
  kicker,
  children,
}: {
  id?: string;
  title: string;
  icon?: React.ReactNode;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 md:p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur"
    >
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

      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActionTile({
  icon,
  title,
  desc,
  bullets,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white font-extrabold">{title}</div>
          <div className="mt-1 text-white/65 text-sm">{desc}</div>
        </div>
      </div>
      <List items={bullets.map((b) => b)} dense />
    </div>
  );
}

function Toc() {
  const items = useMemo(
    () => [
      { id: "intro", label: "Introduction" },
      { id: "history", label: "Historical Context" },
      { id: "culture", label: "Cultural Exploitation" },
      { id: "psych", label: "Psychological & Media Conditioning" },
      { id: "cycle", label: "Breaking the Cycle" },
      { id: "bwe", label: "Role of Black Wealth Exchange" },
      { id: "close", label: "Conclusion" },
    ],
    [],
  );

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-[11px] uppercase tracking-widest text-white/50 font-extrabold">
        Jump to a section
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] font-extrabold text-white/75 transition hover:bg-white/[0.06]"
          >
            {it.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function EconomicFreedom() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Head>
        <title>Economic Freedom | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Breaking the chains of modern economic slavery through ownership, reinvestment, group economics, financial literacy, and mental reprogramming."
        />
      </Head>

      {/* index-style glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[820px] w-[820px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 right-[-10rem] h-[560px] w-[560px] rounded-full bg-emerald-500/[0.05] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-8 md:py-12">
        {/* HERO */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 md:p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <Pill icon={<Sparkles className="h-4 w-4" />}>
                Economic Freedom • Ownership • Action
              </Pill>

              <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                Breaking the Chains of{" "}
                <span className="text-[#D4AF37]">Modern Economic Slavery</span>
              </h1>

              <p className="mt-3 max-w-3xl text-white/70 leading-relaxed text-sm sm:text-base">
                This is one of the most important messages on Black Wealth
                Exchange: <span className="text-white font-bold">spending</span>{" "}
                without <span className="text-white font-bold">ownership</span>{" "}
                creates dependency. Ownership creates power. Power creates
                stability. Stability creates legacy.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill icon={<Target className="h-4 w-4" />}>
                  Build local ownership loops
                </Pill>
                <Pill icon={<TrendingUp className="h-4 w-4" />}>
                  Turn dollars into assets
                </Pill>
                <Pill icon={<Shield className="h-4 w-4" />}>
                  Protect future generations
                </Pill>
              </div>

              <Toc />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/business-directory"
                className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-2.5 text-[13px] font-extrabold text-black transition hover:bg-yellow-500"
              >
                Explore Directory <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/financial-literacy"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.06]"
              >
                Learn Financial Power <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2.5 text-[13px] font-extrabold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
              >
                Create Account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Callout title="The core truth" tone="gold">
              A community can’t “spend” its way to freedom. Freedom is built
              through{" "}
              <span className="text-white font-extrabold">ownership</span> —
              businesses, land, skills, institutions, and investments.
            </Callout>
            <Callout title="The modern trap" tone="red">
              When most spending exits the community quickly, it limits business
              survival, job creation, and the ability to fund schools, property,
              and generational wealth.
            </Callout>
            <Callout title="The win condition" tone="emerald">
              Redirect even a small portion of spending into Black-owned systems
              — and wealth starts to circulate, compound, and build resilience.
            </Callout>
          </div>

          <div className="mt-6 text-white/60 text-xs sm:text-sm">
            Note: Buying power estimates vary by source and year (often cited
            around ~$1.9T to ~$2.1T+). Use the exact number you want — the point
            remains the same: the leverage is massive.
          </div>
        </div>

        {/* INTRO */}
        <div className="mt-8">
          <Card
            id="intro"
            kicker="INTRODUCTION"
            title="Where does the money go — and what does that cost us?"
            icon={<Flame className="h-5 w-5 text-[#D4AF37]" />}
          >
            <ReadMore
              preview={
                <>
                  <p className="text-sm sm:text-base">
                    African Americans spend{" "}
                    <span className="text-red-300 font-extrabold">$1.9T+</span>{" "}
                    annually — more than the GDP of many nations. But ask
                    yourself:{" "}
                    <span className="text-[#D4AF37] font-extrabold">
                      where does this money go
                    </span>
                    ?
                  </p>
                  <p className="mt-3 text-sm sm:text-base">
                    The issue isn’t spending. The issue is spending without a
                    plan for{" "}
                    <span className="text-white font-bold">circulation</span>{" "}
                    and <span className="text-white font-bold">ownership</span>.
                  </p>
                </>
              }
            >
              <p className="text-sm sm:text-base">
                Instead of strengthening our own communities, too much of it
                flows outward into companies and systems we don’t own,
                continuing a cycle of dependency and economic disparity. That’s
                why this feels like modern economic slavery: we work, we earn,
                we spend — but the wealth we generate doesn’t stay long enough
                to build power.
                <span className="text-red-300 font-extrabold">
                  {" "}
                  This stops now.
                </span>
              </p>

              <Callout title="What’s really happening" tone="gold">
                If dollars don’t circulate, businesses can’t scale. If
                businesses can’t scale, jobs don’t multiply. If jobs don’t
                multiply, ownership stays low. And the cycle repeats.
              </Callout>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Callout title="The simple shift" tone="emerald">
                  Small changes repeated consistently create compounding
                  results. We don’t need perfection — we need direction and
                  routine.
                </Callout>
                <Callout title="The goal" tone="gold">
                  Build an “ownership loop” where your regular purchases help
                  build local jobs, stability, and legacy.
                </Callout>
              </div>
            </ReadMore>
          </Card>
        </div>

        {/* HISTORY */}
        <div className="mt-8">
          <Card
            id="history"
            kicker="1. HISTORICAL CONTEXT"
            title="Economic oppression didn’t happen by accident"
            icon={<BookOpen className="h-5 w-5 text-[#D4AF37]" />}
          >
            <ReadMore
              preview={
                <>
                  <p className="text-sm sm:text-base text-white/75">
                    If people don’t understand the history, they mistake
                    symptoms for “personal failure.” The truth is deeper:
                    policies, violence, and exclusion repeatedly disrupted Black
                    ownership, stability, and capital formation.
                  </p>
                </>
              }
            >
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="text-white font-extrabold">
                    Post-Emancipation Challenges
                  </div>
                  <List
                    items={[
                      <>
                        <span className="text-white font-bold">
                          Freedmen’s Bureau:
                        </span>{" "}
                        Established in 1865 to help formerly enslaved Black
                        Americans. It was systematically defunded and dismantled
                        before it could fully support economic independence.
                      </>,
                      <>
                        <span className="text-white font-bold">
                          Jim Crow Laws:
                        </span>{" "}
                        Enforced segregation, blocked access to opportunity and
                        credit, and created long-lasting disparities.
                      </>,
                      <>
                        <span className="text-white font-bold">
                          Capital denial:
                        </span>{" "}
                        Limited lending + biased underwriting made it harder to
                        start, scale, and sustain Black-owned enterprises.
                      </>,
                    ]}
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="text-white font-extrabold">
                    Destruction of Prosperous Black Communities
                  </div>
                  <List
                    items={[
                      <>
                        <span className="text-red-300 font-extrabold">
                          1921: Tulsa’s Black Wall Street
                        </span>{" "}
                        — a thriving community was burned; wealth was erased.
                      </>,
                      <>
                        <span className="text-red-300 font-extrabold">
                          Rosewood, Florida (1923)
                        </span>{" "}
                        — a self-sufficient town was destroyed through racial
                        violence.
                      </>,
                      <>
                        <span className="text-red-300 font-extrabold">
                          Wilmington, North Carolina (1898)
                        </span>{" "}
                        — a violent coup crushed Black political + economic
                        power.
                      </>,
                      <>
                        <span className="text-white font-bold">Result:</span>{" "}
                        interrupted wealth transfer → fewer institutions → less
                        local ownership today.
                      </>,
                    ]}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Callout title="Why this matters today" tone="gold">
                  When wealth is repeatedly disrupted, the gap isn’t just money
                  — it’s institutions: fewer owned businesses, fewer banks,
                  fewer properties, fewer suppliers, fewer pipelines. Economic
                  freedom requires rebuilding systems.
                </Callout>
              </div>
            </ReadMore>
          </Card>
        </div>

        {/* CULTURE */}
        <div className="mt-8">
          <Card
            id="culture"
            kicker="2. CULTURAL EXPLOITATION"
            title="The world profits off Black culture — but ownership is the missing piece"
            icon={<Users className="h-5 w-5 text-[#D4AF37]" />}
          >
            <ReadMore
              preview={
                <p className="text-sm sm:text-base text-white/75">
                  Culture is powerful, but without ownership it becomes
                  extraction: influence fuels industries, while wealth
                  accumulates elsewhere.
                </p>
              }
            >
              <List
                items={[
                  <>
                    <span className="text-[#D4AF37] font-extrabold">
                      Music & Entertainment:
                    </span>{" "}
                    Black creators define global sound and style — but
                    intermediaries and corporations often collect the largest
                    share of long-term profits.
                  </>,
                  <>
                    <span className="text-[#D4AF37] font-extrabold">
                      Fashion & Beauty:
                    </span>{" "}
                    Black trends drive spending, yet Black-owned brands still
                    fight harder for shelf space, funding, and distribution.
                  </>,
                  <>
                    <span className="text-[#D4AF37] font-extrabold">
                      Tech & Platforms:
                    </span>{" "}
                    Attention is monetized at scale — but ownership of the
                    platforms, data, and infrastructure is often outside our
                    control.
                  </>,
                ]}
              />

              <div className="mt-4">
                <Callout
                  title="The solution isn’t less culture — it’s more ownership"
                  tone="emerald"
                >
                  Economic freedom means owning the brands, the distribution,
                  the supply chain, the real estate, the rights, and the
                  platforms — not just contributing the energy.
                </Callout>
              </div>
            </ReadMore>
          </Card>
        </div>

        {/* PSYCHOLOGICAL + MEDIA */}
        <div className="mt-8">
          <Card
            id="psych"
            kicker="3. PSYCHOLOGICAL & MEDIA CONDITIONING"
            title="How the mind gets trained — and how we take it back"
            icon={<Brain className="h-5 w-5 text-[#D4AF37]" />}
          >
            <ReadMore
              preview={
                <>
                  <p className="text-sm sm:text-base text-white/75">
                    This part matters: economics isn’t only money — it’s
                    identity, stress, belonging, and what we’ve been taught to
                    value. Media and marketing don’t just sell products — they
                    shape what feels “normal,” “safe,” and “worthy.”
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Callout title="Television & feeds" tone="gold">
                      <span className="inline-flex items-center gap-2">
                        <Tv2 className="h-4 w-4" />
                        Repetition → normalization
                      </span>
                    </Callout>
                    <Callout title="Marketing" tone="gold">
                      <span className="inline-flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        Desire → impulse
                      </span>
                    </Callout>
                    <Callout title="Habits" tone="gold">
                      <span className="inline-flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Routine → pipeline
                      </span>
                    </Callout>
                  </div>
                </>
              }
            >
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Callout title="The extraction loop" tone="red">
                  We are taught to chase status through consumption, but
                  ownership is delayed. Stress + scarcity thinking increases
                  impulsive spending. Meanwhile, brands and systems we don’t own
                  capture the margin — and the cycle stays in place.
                </Callout>

                <Callout title="The counter-program" tone="emerald">
                  We rebuild the mind: identity rooted in ownership, not labels.
                  We replace impulse with plan. We replace convenience with
                  strategy. We turn spending into a tool — not a trap.
                </Callout>
              </div>

              {/* TRUTH MIRROR (NEW) */}
              <div className="mt-6">
                <Callout
                  title="Truth Mirror (no shame — just clarity)"
                  tone="gold"
                >
                  <p className="text-white/85">
                    Many of us were trained to treat certain brands and
                    lifestyles as “normal” — and anything Black-owned as
                    “secondary,” “risky,” or “lesser.” That isn’t a personal
                    defect. It’s the result of decades of conditioning,
                    repetition, and reward systems built into media, marketing,
                    and social pressure.
                  </p>

                  <p className="mt-3 text-white/85">
                    The mirror question is simple:{" "}
                    <span className="text-white font-extrabold">
                      who gets wealthier from my routine?
                    </span>{" "}
                    Because every dollar is a vote. Every routine is a contract.
                    Every habit is a pipeline — either feeding ownership
                    somewhere else or building it here.
                  </p>

                  <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-white font-extrabold text-[12px] uppercase tracking-widest">
                      Ask yourself this week
                    </div>
                    <ul className="mt-2 space-y-2">
                      {[
                        "If my spending had a mission, what would it be funding?",
                        "What do I buy for status that I could buy for ownership instead?",
                        "Where do I default out of convenience — and what does that cost long-term?",
                        "If my paycheck is real, why is my ownership still minimal?",
                        "What would change if I treated Black-owned as the default — not the exception?",
                      ].map((q) => (
                        <li key={q} className="flex items-start gap-3">
                          <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#D4AF37]/70" />
                          <span className="text-white/75 text-sm">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-3 text-white/85">
                    This isn’t about perfection. It’s about direction. We don’t
                    need everyone to do everything — we need millions of people
                    to do{" "}
                    <span className="text-white font-extrabold">
                      something consistently
                    </span>
                    . That’s how the system starts to shift.
                  </p>
                </Callout>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="text-white font-extrabold">
                    What to unlearn
                  </div>
                  <List
                    items={[
                      "“Buying expensive = winning.” (Ownership is winning.)",
                      "“Black-owned is lower quality.” (That’s a conditioned myth.)",
                      "“My choice doesn’t matter.” (Millions of small choices become a system.)",
                      "“Convenience is harmless.” (Convenience can be a wealth leak.)",
                    ]}
                    dense
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="text-white font-extrabold">What to build</div>
                  <List
                    items={[
                      "Identity rooted in purpose + legacy.",
                      "A spending plan tied to ownership goals.",
                      "Community routines: referrals, reviews, group buys.",
                      "A calm money mindset: less impulse, more strategy.",
                    ]}
                    dense
                  />
                </div>
              </div>
            </ReadMore>
          </Card>
        </div>

        {/* BREAKING THE CYCLE */}
        <div className="mt-8">
          <Card
            id="cycle"
            kicker="4. BREAKING THE CYCLE"
            title="Strategies that compound (because they’re repeatable)"
            icon={<TrendingUp className="h-5 w-5 text-[#D4AF37]" />}
          >
            <ReadMore
              preview={
                <p className="text-sm sm:text-base text-white/75">
                  We don’t need motivation — we need a system. These strategies
                  work because they turn small behavior into compounding
                  outcomes.
                </p>
              }
            >
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <ActionTile
                  icon={<Store className="h-5 w-5 text-[#D4AF37]" />}
                  title="Reinvest in Black Businesses"
                  desc="Spend where it builds the community — and builds jobs."
                  bullets={[
                    "Pick 3 categories you spend in monthly (food, grooming, services).",
                    "Identify a Black-owned option for each category.",
                    "Make it automatic: same shop, same provider, same supplier.",
                  ]}
                />
                <ActionTile
                  icon={<Landmark className="h-5 w-5 text-[#D4AF37]" />}
                  title="Practice Group Economics"
                  desc="Circulate dollars so businesses can scale and hire."
                  bullets={[
                    "Buy from businesses that source from Black-owned suppliers.",
                    "Promote local businesses publicly (reviews + shares).",
                    "Organize family spending: events + services → Black-owned.",
                  ]}
                />
                <ActionTile
                  icon={<LineChart className="h-5 w-5 text-[#D4AF37]" />}
                  title="Push Financial Literacy"
                  desc="Knowledge becomes power when it turns into action."
                  bullets={[
                    "Learn investing basics (risk, time horizon, compounding).",
                    "Prioritize property/asset ownership strategies.",
                    "Teach children money language early: save, invest, own.",
                  ]}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Callout title="The Ownership Flywheel" tone="gold">
                  Spend → business revenue grows → business hires → community
                  income rises → more spending stays local → business expands →
                  more ownership opportunities → repeat.
                </Callout>

                <Callout title="Keep it measurable" tone="emerald">
                  Track it weekly: Black-owned purchases, referrals/reviews,
                  dollars moved into savings/investments, and how many
                  businesses you helped gain a real customer.
                </Callout>
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-white font-extrabold">
                  A practical 90-day blueprint
                </div>
                <List
                  items={[
                    <>
                      <span className="text-white font-bold">Days 1–30:</span>{" "}
                      Replace 2 spending categories + create an “ownership
                      fund.”
                    </>,
                    <>
                      <span className="text-white font-bold">Days 31–60:</span>{" "}
                      Add 2 more categories + recruit 3 friends/family members
                      to do the same.
                    </>,
                    <>
                      <span className="text-white font-bold">Days 61–90:</span>{" "}
                      Start investing consistently + support one Black-owned
                      brand monthly.
                    </>,
                  ]}
                />
              </div>
            </ReadMore>
          </Card>
        </div>

        {/* BWE ROLE */}
        <div className="mt-8">
          <Card
            id="bwe"
            kicker="5. BLACK WEALTH EXCHANGE"
            title="Not just a platform — a system for ownership and opportunity"
            icon={<Shield className="h-5 w-5 text-[#D4AF37]" />}
          >
            <ReadMore
              preview={
                <p className="text-sm sm:text-base text-white/75">
                  Black Wealth Exchange is not just a platform — it’s a
                  movement. The mission is to create a trusted space for wealth,
                  knowledge, and opportunity that turns everyday actions into
                  legacy.
                </p>
              }
            >
              <List
                items={[
                  <>
                    <span className="text-white font-bold">
                      Redirect Spending
                    </span>{" "}
                    — prioritize Black-owned businesses.
                  </>,
                  <>
                    <span className="text-white font-bold">
                      Build Financial Power
                    </span>{" "}
                    — through investments, education, and ownership.
                  </>,
                  <>
                    <span className="text-white font-bold">
                      Create Sustainable Wealth
                    </span>{" "}
                    — for our children and future generations.
                  </>,
                ]}
              />

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Callout title="Discovery → Customers" tone="gold">
                  A trusted directory + search experience helps businesses get
                  found, which is the first step to recurring revenue and
                  hiring.
                </Callout>
                <Callout title="Learning → Action" tone="emerald">
                  Financial literacy turns fear into execution: budgeting,
                  saving, investing, ownership strategy, and long-term planning.
                </Callout>
                <Callout title="Jobs → Mobility" tone="gold">
                  Careers and opportunities increase income, and income fuels
                  ownership. Opportunity is part of the wealth engine.
                </Callout>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/business-directory"
                  className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] px-5 py-2.5 text-[13px] font-extrabold text-black transition hover:bg-yellow-500"
                >
                  Browse Directory <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-extrabold text-white/80 transition hover:bg-white/[0.06]"
                >
                  Shop Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/financial-literacy"
                  className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2.5 text-[13px] font-extrabold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
                >
                  Build Financial Literacy{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </ReadMore>
          </Card>
        </div>

        {/* CONCLUSION */}
        <div className="mt-8">
          <Card
            id="close"
            kicker="CONCLUSION"
            title="It’s time to reclaim our financial power"
            icon={<Target className="h-5 w-5 text-[#D4AF37]" />}
          >
            <p className="text-white font-extrabold text-center text-base sm:text-lg">
              It’s time to reclaim our financial power.
            </p>
            <p className="mt-3 text-white/75 text-center font-semibold text-sm sm:text-base">
              Our wealth is being drained. Our culture is being monetized. Our
              communities are being left behind. But together, we have the power
              to change that.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Callout title="The question isn’t “can we?”" tone="gold">
                The question is whether we’ll choose systems over convenience.
                One decision repeated becomes a lifestyle. A lifestyle becomes a
                legacy.
              </Callout>
              <Callout title="Make it real this week" tone="emerald">
                Choose one category. Choose one Black-owned alternative. Commit
                for 30 days. Then expand. That’s how compounding starts.
              </Callout>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-[14px] font-extrabold text-white shadow-lg transition hover:bg-red-700"
              >
                Take Action Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/join-the-mission"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-[14px] font-extrabold text-white/80 transition hover:bg-white/[0.06]"
              >
                Join the Mission <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </Card>
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
            href="/business-directory"
            className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 font-extrabold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
          >
            Directory
          </Link>
          <Link
            href="/marketplace"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 font-extrabold text-white/75 transition hover:bg-white/[0.06]"
          >
            Marketplace
          </Link>
          <Link
            href="/financial-literacy"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 font-extrabold text-white/75 transition hover:bg-white/[0.06]"
          >
            Financial Literacy
          </Link>
        </div>

        <div className="mt-8 pb-6 text-center text-white/45 text-sm">
          © {new Date().getFullYear()} Black Wealth Exchange — Economic Freedom
        </div>
      </div>
    </div>
  );
}
