import React from "react";
import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import {
  blackUnityParagraphs,
  closingDeclarationLines,
  contactParagraph,
  diasporaUnityParagraphs,
  economicHistoryParagraphs,
  foundingDeclarationParagraphs,
  foundingPrincipleClosing,
  foundingPrincipleParagraphs,
  generationalProsperityParagraphs,
  leadershipParagraphs,
  legalAffirmationParagraphs,
  missionParagraphs,
  organizationalStatusParagraphs,
  ourValues,
  proOurselvesStatement,
} from "@/lib/foundingContent";

const bweTodayCards = [
  {
    title: "Founder / Current Platform",
    body: "Thomas James Hooker Sr. is the founder of Black Wealth Exchange, and the platform remains founder-led in its public identity and strategic direction.",
  },
  {
    title: "Current BWE functionality",
    body: "The current platform includes business discovery, claim and ownership routes, marketplace participation, jobs, learning content, support, and public trust surfaces.",
  },
  {
    title: "Mission-driven for-profit status",
    body: "BWE operates as a mission-driven for-profit business. Profit supports the business model; the mission remains Black ownership, visibility, opportunity, and durable economic participation.",
  },
  {
    title: "History and restoration",
    body: "The Library of Black History exists as a separate destination because BWE's purpose is inseparable from the history of what Black people built, what was taken, and what must be rebuilt now.",
  },
] as const;

function SectionBlock({
  eyebrow,
  title,
  paragraphs,
}: {
  eyebrow?: string;
  title: string;
  paragraphs: readonly string[];
}) {
  return (
    <section className="border-t border-white/8">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h2>
        <div className="mt-5 space-y-5 text-base leading-relaxed text-white/78 sm:text-lg">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function About() {
  const canonical = canonicalUrl("/about");
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Black Wealth Exchange",
    url: canonicalUrl("/"),
    description:
      "Black Wealth Exchange — Black-Owned Business Discovery and Growth Platform",
    founder: {
      "@type": "Person",
      name: "Thomas James Hooker Sr.",
      jobTitle: "Founder, Black Wealth Exchange",
    },
  };

  const founderSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Thomas James Hooker Sr.",
    jobTitle: "Founder, Black Wealth Exchange",
    worksFor: {
      "@type": "Organization",
      name: "Black Wealth Exchange",
      url: canonicalUrl("/"),
    },
  };

  return (
    <>
      <Head>
        <title>About Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Read the founding declaration, mission, values, leadership, and current platform direction behind Black Wealth Exchange.",
          )}
        />
        <link rel="canonical" href={canonical} />
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(founderSchema)}
      </script>
      <main className="min-h-screen bg-black text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_34%)]">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-18">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              About Black Wealth Exchange
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">
              {foundingDeclarationParagraphs[0]}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/76 sm:text-lg">
              The founder-authored declaration remains the foundation of Black
              Wealth Exchange. BWE today is a founder-led, mission-driven
              for-profit platform built to support Black business discovery,
              trust, ownership, commerce, and long-term economic growth.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/founding-principle"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black transition hover:brightness-105"
              >
                Read Founding Principle
              </Link>
              <Link
                href="/library-of-black-history"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D4AF37]/60 px-5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37]"
              >
                Explore Black History Library
              </Link>
            </div>
          </div>
        </section>

        <SectionBlock
          eyebrow="Founding Declaration"
          title="The declaration that established BWE"
          paragraphs={foundingDeclarationParagraphs}
        />
        <SectionBlock
          eyebrow="Mission"
          title="Mission"
          paragraphs={missionParagraphs}
        />
        <SectionBlock
          eyebrow="Black Unity"
          title="Black Unity"
          paragraphs={blackUnityParagraphs}
        />
        <SectionBlock
          eyebrow="Diaspora Unity"
          title="Diaspora Unity"
          paragraphs={diasporaUnityParagraphs}
        />

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              Foundation
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              We are relentlessly pro-ourselves
            </h2>
            <div className="mt-5 rounded-3xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-6 py-6 text-xl font-semibold italic text-[#F3D36D] sm:text-2xl">
              <p>{proOurselvesStatement[0]}</p>
              <p className="mt-2">{proOurselvesStatement[1]}</p>
            </div>
          </div>
        </section>

        <SectionBlock
          eyebrow="Constitutional / Legal Affirmation"
          title="Constitutional and Legal Affirmation"
          paragraphs={legalAffirmationParagraphs}
        />
        <SectionBlock
          eyebrow="Economic History"
          title="Economic History"
          paragraphs={economicHistoryParagraphs}
        />
        <SectionBlock
          eyebrow="Generational Prosperity"
          title="Generational Prosperity"
          paragraphs={generationalProsperityParagraphs}
        />

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              Our Values
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Our Values</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {ourValues.map((value) => (
                <article
                  key={value.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <h3 className="text-lg font-semibold text-[#D4AF37]">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/72 sm:text-base">
                    {value.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SectionBlock
          eyebrow="Leadership"
          title="Leadership"
          paragraphs={leadershipParagraphs}
        />
        <SectionBlock
          eyebrow="Organizational Status"
          title="Organizational Status"
          paragraphs={organizationalStatusParagraphs}
        />
        <SectionBlock
          eyebrow="Founding Principle"
          title="Founding Principle"
          paragraphs={foundingPrincipleParagraphs}
        />

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <div className="rounded-3xl border border-[#D4AF37]/20 bg-white/[0.02] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
                Founding Principle Closing
              </p>
              <div className="mt-4 space-y-2 text-2xl font-bold text-[#F3D36D] sm:text-3xl">
                {foundingPrincipleClosing.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/8 bg-white/[0.02]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              BWE Today
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Founder / Current Platform
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {bweTodayCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5"
                >
                  <h3 className="text-lg font-semibold text-[#D4AF37]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/72 sm:text-base">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              Contact
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Contact</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/72 sm:text-lg">
              {contactParagraph}
            </p>
            <a
              href="mailto:info@blackwealthexchange.com"
              className="mt-4 inline-block text-lg font-semibold text-[#D4AF37] hover:underline"
            >
              info@blackwealthexchange.com
            </a>
          </div>
        </section>

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              Closing Declaration
            </p>
            <div className="mt-4 space-y-3 text-lg font-semibold text-[#F3D36D] sm:text-xl">
              {closingDeclarationLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>Black Wealth Exchange</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
