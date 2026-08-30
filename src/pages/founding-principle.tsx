"use client";

import React from "react";
import Head from "next/head";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const platformLanes = [
  "Discovery through the business directory, search, and public category/state pages.",
  "Ownership and trust through claim, verification, and profile management workflows.",
  "Commerce through marketplace, sponsor, advertising, and future growth pathways.",
  "Support and accountability through public contact, support, and release-history surfaces.",
];

export default function About() {
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
            "Read the founder story and founding principle behind Black Wealth Exchange, founded by Thomas James Hooker Sr.",
          )}
        />
        <link rel="canonical" href={canonical} />
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(founderSchema)}
      </script>
      <div className="min-h-screen bg-black text-white">
        <section className="container mx-auto px-4 py-16 text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gold mb-8">
            Founder Story and Founding Principle
          </h1>

          <div className="space-y-6 text-lg text-gray-300 max-w-4xl">
            <p>
              Black Wealth Exchange was founded by{" "}
              <strong className="text-gold">Thomas James Hooker Sr.</strong> as
              a founder-led platform built to help Black-owned businesses become
              easier to discover, easier to trust, and easier to support.
            </p>

            <p>
              The founding principle is straightforward: Black-owned businesses,
              consumers, and partners need stronger economic infrastructure than
              scattered listings and vague promises. BWE was created to connect
              discovery, ownership, commerce, and growth in one practical
              system.
            </p>

            <p>
              That means helping a business get found in the directory, helping
              the rightful owner claim and strengthen the profile, helping
              customers discover products and offers, and building trust through
              clear public information, responsive support, and honest platform
              behavior.
            </p>

            <p>
              BWE operates as a{" "}
              <strong className="text-gold">
                mission-driven for-profit business
              </strong>
              . It is not a nonprofit, not a government program, and not a
              faceless template site. The platform exists to build durable
              value, create useful economic pathways, and earn trust by being
              factual about what is live now.
            </p>

            <p>
              The goal is not to overstate scale or pretend every future feature
              already exists. The goal is to keep building a platform where
              Black business discovery, claim and ownership, commerce,
              sponsorship, and growth tools fit together in a credible, useful
              way.
            </p>

            <p className="italic text-gold">
              Black Wealth Exchange — Black-Owned Business Discovery and Growth
              Platform
            </p>

            <p>
              Trust grows when people can see who built the platform, understand
              what it offers, and reach real support when they need help. That
              is why the founder is named publicly, why the platform description
              stays clear, and why BWE only describes features that visitors can
              actually use today.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gold mb-6">Our Values</h2>
          <ul className="space-y-4 text-gray-300 text-lg list-disc list-inside max-w-4xl">
            <li>
              <strong>Economic Justice:</strong> Building structures that
              correct the historical denial of access to wealth and ownership.
            </li>
            <li>
              <strong>Integrity and Accountability:</strong> Operating
              transparently, lawfully, and with unwavering commitment to
              community trust.
            </li>
            <li>
              <strong>Generational Prosperity:</strong> Laying foundations not
              just for today, but for the prosperity of future Black
              generations.
            </li>
            <li>
              <strong>Strategic Empowerment:</strong> Creating opportunities
              intentionally, with clear strategy and measurable outcomes.
            </li>
            <li>
              <strong>Constitutional and Legal Affirmation:</strong> Asserting
              our rightful place in the economy under the protections afforded
              by law.
            </li>
          </ul>
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gold mb-6">Leadership</h2>
          <p className="text-lg text-gray-300 max-w-4xl">
            Black Wealth Exchange is led by{" "}
            <strong className="text-white">Thomas James Hooker Sr.</strong>. He
            leads the platform&apos;s direction, public accountability, and
            long-term growth.
            <br />
            <br />
            BWE is built to serve businesses, consumers, sponsors, partners, and
            future investors who want a clear understanding of who is leading
            the company and what the platform is here to do.
          </p>
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gold mb-6">
            Organizational Status
          </h2>
          <p className="text-lg text-gray-300 max-w-4xl">
            Black Wealth Exchange operates as a for-profit, mission-driven
            organization. Profit supports the business model, while the mission
            remains focused on strengthening Black business ownership,
            visibility, opportunity, and long-term economic participation.
          </p>
        </section>

        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gold mb-6">
            What BWE Is Building
          </h2>
          <div className="grid gap-4 max-w-4xl md:grid-cols-2">
            {platformLanes.map((lane) => (
              <div
                key={lane}
                className="rounded-xl border border-white/10 bg-white/5 p-5 text-base text-gray-300"
              >
                {lane}
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gold mb-4">Contact Us</h2>
          <p className="text-gray-400 mb-6">
            For serious inquiries, partnerships, or collaborations, please
            contact us at:
            <br />
            <strong className="text-white">info@blackwealthexchange.com</strong>
          </p>
        </section>

        <footer className="bg-black text-center py-6">
          <div className="text-gray-500 text-sm space-y-2" />
        </footer>
      </div>
    </>
  );
}
