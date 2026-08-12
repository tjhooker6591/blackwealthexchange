import React from "react";
import Link from "next/link";
import Head from "next/head";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const pillars = [
  {
    title: "Economic Empowerment",
    body: "Build practical pathways to ownership, income growth, and long-term financial resilience.",
  },
  {
    title: "Ownership and Enterprise",
    body: "Accelerate Black-owned businesses, creators, and founders through structured visibility and demand.",
  },
  {
    title: "Lawful and Strategic Action",
    body: "Operate with discipline, transparency, and legal alignment while advancing measurable outcomes.",
  },
  {
    title: "Generational Prosperity",
    body: "Translate today’s momentum into lasting assets, institutions, and opportunities for tomorrow.",
  },
];

const commitments = [
  "Keep the platform focused on utility, trust, and execution.",
  "Convert spending power into ownership pathways.",
  "Strengthen community outcomes through disciplined collaboration.",
  "Build with standards that scale across the diaspora.",
];

const founderStory = [
  {
    title: "Who founded BWE",
    body: "Black Wealth Exchange was founded by Thomas James Hooker Sr., Founder of Black Wealth Exchange.",
  },
  {
    title: "Why it exists",
    body: "BWE exists to make it easier to discover Black-owned businesses, strengthen business visibility, and create clearer paths for commerce, ownership, and long-term growth.",
  },
  {
    title: "How the platform works",
    body: "The platform connects discovery, claim and ownership workflows, marketplace activity, jobs, learning resources, and sponsor visibility so businesses and consumers can take practical next steps in one place.",
  },
  {
    title: "Why trust matters",
    body: "BWE is a founder-led, mission-driven for-profit platform built to help people discover Black-owned businesses, understand what the platform offers today, and reach the team through clear support and contact options.",
  },
];

const trustSignals = [
  "Founder identified publicly as Thomas James Hooker Sr.",
  "Mission-driven for-profit platform, not a nonprofit or government program.",
  "Public support, contact, directory, marketplace, and claim routes are live on the site.",
  "Platform claims are limited to functionality that is actually available now.",
];

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
            "Learn about Black Wealth Exchange, the founder behind it, and how the platform connects Black-owned business discovery, ownership, commerce, and growth.",
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
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-18">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              About Black Wealth Exchange
            </p>
            <h1 className="max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">
              Black Wealth Exchange is a founder-led platform built to help
              Black-owned businesses get discovered, claimed, trusted, and
              supported.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/72 sm:text-lg">
              <span className="font-semibold text-white">
                Black Wealth Exchange — Black-Owned Business Discovery and
                Growth Platform.
              </span>{" "}
              Founded by Thomas James Hooker Sr., BWE is a mission-driven
              for-profit platform focused on discovery, ownership, commerce, and
              growth pathways that can help Black businesses and consumers take
              real action.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black transition hover:brightness-105"
              >
                Join Black Wealth Exchange
              </Link>
              <Link
                href="/join-the-mission"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D4AF37]/60 px-5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37]"
              >
                Join the Mission
              </Link>
            </div>
            <div className="mt-4">
              <Link
                href="/founding-principle"
                className="text-sm font-medium text-[#D4AF37] underline-offset-4 hover:underline"
              >
                Read the founder story and founding principle
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
                Founder Identity
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Thomas James Hooker Sr. is the founder of Black Wealth Exchange.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/72 sm:text-base">
                BWE is not presented as an anonymous directory or generic
                community template. It is a real founder-led platform with a
                public mission: help Black-owned businesses get discovered,
                strengthen trust through ownership and claim workflows, support
                commerce through marketplace and sponsor surfaces, and build
                toward stronger growth infrastructure over time.
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {founderStory.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-black/40 p-5"
                >
                  <h3 className="text-base font-semibold text-[#D4AF37]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/72">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Our Pillars</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pillars.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                >
                  <h3 className="text-base font-semibold text-[#D4AF37]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/72">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.01]">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              Our Commitment
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-white/72 sm:text-base">
              We are committed to lawful, strategic, and high-integrity
              execution. This is not performative messaging. It is practical
              platform building in service of Black business visibility,
              ownership, commerce, and long-term trust.
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-white/80 sm:grid-cols-2">
              {commitments.map((point) => (
                <li
                  key={point}
                  className="rounded-lg border border-white/10 bg-black/40 px-4 py-3"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
              Public Trust Signals
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {trustSignals.map((point) => (
                <div
                  key={point}
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/80"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-14">
            <h2 className="text-2xl font-bold sm:text-3xl">Contact</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
              For partnerships, serious business inquiries, media questions, or
              strategic collaboration related to Black Wealth Exchange, contact
              us at
            </p>
            <a
              href="mailto:info@blackwealthexchange.com"
              className="mt-3 inline-block text-base font-semibold text-[#D4AF37] hover:underline"
            >
              info@blackwealthexchange.com
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
