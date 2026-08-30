import React from "react";
import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import {
  blackUnityParagraphs,
  closingDeclarationLines,
  diasporaUnityParagraphs,
  foundingHeroHeadline,
  foundingHeroLead,
  foundingPrincipleClosing,
  foundingPrincipleParagraphs,
  generationalProsperityParagraphs,
  legalAffirmationParagraphs,
  missionParagraphs,
  proOurselvesStatement,
} from "@/lib/foundingContent";

function LongformSection({
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
        <div className="mt-6 space-y-5 text-[1.06rem] leading-8 text-white/78 sm:text-[1.12rem]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FoundingPrinciplePage() {
  const canonical = canonicalUrl("/founding-principle");
  const founderSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Thomas James Hooker Sr.",
    jobTitle: "Founder, Black Wealth Exchange",
    worksFor: {
      "@type": "Organization",
      name: "Black Wealth Exchange",
      url: canonicalUrl("/"),
      description:
        "Black Wealth Exchange — Black-Owned Business Discovery and Growth Platform",
    },
  };

  return (
    <>
      <Head>
        <title>Founding Principle | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Read the founder-authored founding declaration and philosophy behind Black Wealth Exchange.",
          )}
        />
        <link rel="canonical" href={canonical} />
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(founderSchema)}
      </script>
      <main className="min-h-screen bg-black text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_40%)]">
          <div className="mx-auto max-w-[54rem] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              Founding Principle
            </p>
            <h1 className="mt-4 max-w-[13ch] text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.05em] text-white sm:text-[3.4rem] lg:text-[4rem]">
              <span className="block">{foundingHeroHeadline[0]}</span>
              <span className="mt-3 block text-[#F0D06A]">
                {foundingHeroHeadline[1]}
              </span>
            </h1>
            <p className="mt-8 max-w-[44rem] text-[1.12rem] leading-8 text-white/84 sm:text-[1.32rem] sm:leading-9 lg:text-[1.48rem] lg:leading-10">
              {foundingHeroLead}
            </p>
          </div>
        </section>

        <LongformSection
          eyebrow="Mission"
          title="Mission"
          paragraphs={missionParagraphs}
        />
        <LongformSection
          eyebrow="Black Unity"
          title="Black Unity"
          paragraphs={blackUnityParagraphs}
        />
        <LongformSection
          eyebrow="Diaspora Unity"
          title="Diaspora Unity"
          paragraphs={diasporaUnityParagraphs}
        />

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Foundation Declaration
            </p>
            <div className="mt-5 border-l-2 border-[#D4AF37]/60 pl-5 sm:pl-7">
              <div className="space-y-3 text-[1.55rem] font-semibold leading-tight tracking-[-0.03em] text-[#F0D06A] sm:text-[2rem]">
                <p>{proOurselvesStatement[0]}</p>
                <p>{proOurselvesStatement[1]}</p>
              </div>
            </div>
          </div>
        </section>

        <LongformSection
          eyebrow="Constitutional and Legal Affirmation"
          title="Constitutional and Legal Affirmation"
          paragraphs={legalAffirmationParagraphs}
        />

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Generational Prosperity
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white sm:text-[2rem]">
              Generational Prosperity
            </h2>
            <div className="mt-6 space-y-7">
              <div className="space-y-2 text-[1.2rem] font-semibold uppercase leading-tight tracking-[0.08em] text-[#F0D06A] sm:text-[1.45rem]">
                <p>{generationalProsperityParagraphs[0]}</p>
              </div>
              <div className="space-y-2 text-[1.2rem] font-semibold uppercase leading-tight tracking-[0.08em] text-white sm:text-[1.45rem]">
                <p>{generationalProsperityParagraphs[1]}</p>
              </div>
              <p className="max-w-[44rem] text-[1.06rem] leading-8 text-white/78 sm:text-[1.12rem]">
                {generationalProsperityParagraphs[2]}
              </p>
            </div>
          </div>
        </section>

        <LongformSection
          eyebrow="Full Founding Principle"
          title="Founding Principle"
          paragraphs={foundingPrincipleParagraphs}
        />

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Declaration
            </p>
            <div className="mt-5 space-y-2 text-[1.25rem] font-semibold uppercase leading-tight tracking-[0.08em] text-[#F0D06A] sm:text-[1.55rem]">
              {foundingPrincipleClosing.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/8">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Closing Declaration
            </p>
            <div className="mt-5 max-w-[42rem] space-y-4 border-l-2 border-[#D4AF37]/50 pl-5 text-[1.15rem] font-medium leading-8 text-white/88 sm:pl-7 sm:text-[1.3rem] sm:leading-9">
              {closingDeclarationLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[#D4AF37]">
              Black Wealth Exchange
            </p>
          </div>
        </section>

        <section className="border-t border-white/8 bg-white/[0.02]">
          <div className="mx-auto max-w-[50rem] px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Related Paths
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Link
                href="/about"
                className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-semibold text-white/78 transition hover:border-[#D4AF37]/40 hover:text-white"
              >
                <span className="block text-[11px] uppercase tracking-[0.16em] text-[#D4AF37]">
                  About BWE
                </span>
                <span className="mt-2 block text-base text-white">
                  Read who BWE is, how it operates today, and how the mission is
                  organized.
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
      </main>
    </>
  );
}
