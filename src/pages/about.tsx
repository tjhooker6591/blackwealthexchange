import React from "react";
import Link from "next/link";

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

export default function About() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-18">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
            About Black Wealth Exchange
          </p>
          <h1 className="max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Building Black ownership, economic power, and multi-generational
            growth.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/72 sm:text-lg">
            Black Wealth Exchange is a mission-driven platform designed to turn
            intention into outcomes. We focus on practical access to business,
            jobs, marketplace participation, and programs that increase mobility
            and ownership.
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
              Read the complete founding message
            </Link>
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
            We are committed to lawful, strategic, and high-integrity execution.
            This is not performative messaging. It is infrastructure,
            discipline, and accountability in service of community advancement.
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
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">Contact</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            For partnerships, serious inquiries, or strategic collaboration,
            contact us at
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
  );
}
