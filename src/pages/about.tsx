import React from "react";
import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import {
  contactParagraph,
  foundingDeclarationParagraphs,
  leadershipParagraphs,
  missionParagraphs,
  organizationalStatusParagraphs,
  ourValues,
} from "@/lib/foundingContent";

const bweTodayCards = [
  {
    title: "Founder",
    body: "Thomas James Hooker Sr. is the founder of Black Wealth Exchange.",
  },
  {
    title: "Why BWE exists",
    body: foundingDeclarationParagraphs[0],
  },
  {
    title: "Current BWE functionality",
    body: "The current platform includes business discovery, claim and ownership routes, marketplace participation, jobs, learning content, support, and public trust surfaces.",
  },
  {
    title: "Mission-driven for-profit status",
    body: "BWE operates as a mission-driven for-profit business. Profit supports the business model; the mission remains Black ownership, visibility, opportunity, and durable economic participation.",
  },
] as const;

function ReadingSection({
  eyebrow,
  title,
  paragraphs,
}: {
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
}) {
  return (
    <section className="border-t border-white/8">
      <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white sm:text-[2rem]">
          {title}
        </h2>
        <div className="mt-6 space-y-5 text-[1.04rem] leading-8 text-white/78 sm:text-[1.1rem]">
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
            "Read who Black Wealth Exchange is, why it exists, who founded it, and how the current platform connects mission to action.",
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
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_40%)]">
          <div className="mx-auto max-w-[54rem] px-4 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              About BWE
            </p>
            <h1 className="mt-4 max-w-[12ch] text-[2.45rem] font-extrabold leading-[1.03] tracking-[-0.05em] text-white sm:text-[3.25rem] lg:text-[3.9rem]">
              A founder-led platform for Black ownership, visibility, and
              economic growth.
            </h1>
            <p className="mt-7 max-w-[43rem] text-[1.08rem] leading-8 text-white/82 sm:text-[1.22rem] sm:leading-9">
              Black Wealth Exchange exists to help people discover Black-owned
              businesses, support them with intention, and build stronger paths
              for ownership, commerce, and long-term economic participation.
            </p>
          </div>
        </section>

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Why BWE Exists
            </p>
            <div className="mt-5 border-l-2 border-[#D4AF37]/55 pl-5 sm:pl-7">
              <p className="max-w-[44rem] text-[1.06rem] leading-8 text-white/84 sm:text-[1.16rem] sm:leading-9">
                {foundingDeclarationParagraphs[0]}
              </p>
            </div>
          </div>
        </section>

        <ReadingSection
          eyebrow="Mission"
          title="Mission"
          paragraphs={missionParagraphs}
        />
        <ReadingSection
          eyebrow="Leadership"
          title="Leadership"
          paragraphs={leadershipParagraphs}
        />

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Our Values
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white sm:text-[2rem]">
              Our Values
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {ourValues.map((value) => (
                <article
                  key={value.title}
                  className="border-t border-white/10 pt-4"
                >
                  <h3 className="text-lg font-semibold text-[#D4AF37]">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-white/72 sm:text-base">
                    {value.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/8 bg-white/[0.02]">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              BWE Today
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white sm:text-[2rem]">
              Founder and Current Platform
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {bweTodayCards.map((card) => (
                <article
                  key={card.title}
                  className="border-t border-white/10 pt-4"
                >
                  <h3 className="text-lg font-semibold text-[#D4AF37]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-white/72 sm:text-base">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ReadingSection
          eyebrow="Organizational Status"
          title="Organizational Status"
          paragraphs={organizationalStatusParagraphs}
        />

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Related Paths
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Link
                href="/founding-principle"
                className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white/78 transition hover:border-[#D4AF37]/40 hover:text-white"
              >
                <span className="block text-[11px] uppercase tracking-[0.16em] text-[#D4AF37]">
                  Full Founding Principle
                </span>
                <span className="mt-2 block text-base text-white">
                  Read the complete founder-authored declaration and philosophy.
                </span>
              </Link>
              <Link
                href="/library-of-black-history"
                className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white/78 transition hover:border-[#D4AF37]/40 hover:text-white"
              >
                <span className="block text-[11px] uppercase tracking-[0.16em] text-[#D4AF37]">
                  Library of Black History
                </span>
                <span className="mt-2 block text-base text-white">
                  Continue into the broader historical and educational body that
                  connects BWE to Black history and economic restoration.
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-[50rem] px-4 py-12 text-center sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Contact
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white sm:text-[2rem]">
              Contact
            </h2>
            <p className="mx-auto mt-5 max-w-[40rem] text-[1.02rem] leading-8 text-white/74 sm:text-[1.08rem]">
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
      </main>
    </>
  );
}
