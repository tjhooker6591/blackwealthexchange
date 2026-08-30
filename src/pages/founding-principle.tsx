import React from "react";
import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import {
  blackUnityParagraphs,
  closingDeclarationLines,
  diasporaUnityParagraphs,
  foundingDeclarationParagraphs,
  foundingPrincipleClosing,
  foundingPrincipleParagraphs,
  generationalProsperityParagraphs,
  legalAffirmationParagraphs,
  missionParagraphs,
  proOurselvesStatement,
} from "@/lib/foundingContent";

function ParagraphGroup({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: readonly string[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-white/76 sm:text-lg">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
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
            "Read the founder-authored founding declaration and principle behind Black Wealth Exchange.",
          )}
        />
        <link rel="canonical" href={canonical} />
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(founderSchema)}
      </script>
      <main className="min-h-screen bg-black text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_36%)]">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-18">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              Founding Principle
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">
              {foundingDeclarationParagraphs[0]}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/76 sm:text-lg">
              This route preserves the founder-authored declaration at the core
              of BWE and keeps it separate from the platform&apos;s broader
              history library.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black transition hover:brightness-105"
              >
                Return to About
              </Link>
              <Link
                href="/library-of-black-history"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D4AF37]/60 px-5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37]"
              >
                Open Black History Library
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:py-12">
          <ParagraphGroup title="Mission" paragraphs={missionParagraphs} />
          <ParagraphGroup
            title="Black Unity"
            paragraphs={blackUnityParagraphs}
          />
          <ParagraphGroup
            title="Diaspora Unity"
            paragraphs={diasporaUnityParagraphs}
          />

          <section className="rounded-3xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-6 py-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Foundation
            </h2>
            <div className="mt-4 text-xl font-semibold italic text-[#F3D36D] sm:text-2xl">
              <p>{proOurselvesStatement[0]}</p>
              <p className="mt-2">{proOurselvesStatement[1]}</p>
            </div>
          </section>

          <ParagraphGroup
            title="Constitutional and Legal Affirmation"
            paragraphs={legalAffirmationParagraphs}
          />
          <ParagraphGroup
            title="Generational Prosperity"
            paragraphs={generationalProsperityParagraphs}
          />
          <ParagraphGroup
            title="Founding Principle"
            paragraphs={foundingPrincipleParagraphs}
          />

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-7">
            <div className="space-y-2 text-2xl font-bold text-[#F3D36D] sm:text-3xl">
              {foundingPrincipleClosing.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-7">
            <div className="space-y-3 text-lg font-semibold text-[#F3D36D] sm:text-xl">
              {closingDeclarationLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>Black Wealth Exchange</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
