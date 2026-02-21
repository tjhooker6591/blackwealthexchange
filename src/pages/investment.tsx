import Link from "next/link";
import Image from "next/legacy/image";
import Head from "next/head";
import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Building2,
  Landmark,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

// Define the props interface for the InvestmentCard component.
interface InvestmentCardProps {
  title: string;
  description: string;
  link: string;
  linkLabel: string;
  iconSrc?: string;
  ariaLabel: string;
  tag?: string;
  icon?: React.ReactNode;
  variant?: "gold" | "dark";
}

// Reusable Investment Card component (BWE-consistent)
function InvestmentCard({
  title,
  description,
  link,
  linkLabel,
  iconSrc,
  ariaLabel,
  tag,
  icon,
  variant = "dark",
}: InvestmentCardProps) {
  return (
    <div
      className={[
        "w-full md:w-[32%] p-6 rounded-2xl border shadow-xl transition hover:shadow-2xl hover:-translate-y-0.5",
        variant === "gold"
          ? "bg-yellow-500/10 border-yellow-500/25"
          : "bg-white/5 border-white/10",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={[
              "h-11 w-11 rounded-xl border flex items-center justify-center",
              variant === "gold"
                ? "border-yellow-500/25 bg-black/30"
                : "border-white/10 bg-black/30",
            ].join(" ")}
          >
            {icon ? icon : null}
            {!icon && iconSrc ? (
              <Image
                src={iconSrc}
                alt={`${title} icon`}
                width={26}
                height={26}
              />
            ) : null}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">{title}</h3>
            {tag ? (
              <div className="mt-1 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-xs font-semibold text-gray-200">
                {tag}
              </div>
            ) : null}
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-gray-400 mt-1" />
      </div>

      <p className="mt-3 text-sm text-gray-300">{description}</p>

      <div className="mt-5">
        <Link
          href={link}
          aria-label={ariaLabel}
          className={[
            "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition",
            variant === "gold"
              ? "bg-gold text-black hover:bg-yellow-500"
              : "border border-white/10 bg-black/40 text-white hover:bg-black/50",
          ].join(" ")}
        >
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold text-gold">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function CourseCard({
  title,
  description,
  href,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  badge?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl hover:bg-white/10 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-white">{title}</h3>
          {badge ? (
            <div className="mt-1 inline-flex rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-200">
              {badge}
            </div>
          ) : null}
        </div>
        <GraduationCap className="h-5 w-5 text-gold mt-1" />
      </div>
      <p className="mt-2 text-sm text-gray-300">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2 font-semibold text-black hover:bg-yellow-500 transition"
      >
        Enroll <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function Investment() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Investment & Financial Growth | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Explore startup funding, Black-owned stocks, real estate investing, and financial literacy courses designed to support long-term wealth-building."
        />
      </Head>

      {/* subtle gold glow */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.18]">
        <div className="absolute -top-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gold blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 space-y-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4 text-gold" />
            Home
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/financial-literacy"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
            >
              Financial Literacy
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 transition"
            >
              View Plans
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                <Sparkles className="h-4 w-4" />
                Wealth Building Hub
              </div>
              <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-gold">
                Investment & Financial Growth
              </h1>
              <p className="mt-2 text-gray-300">
                Empower Black businesses and individuals through strategic
                investments, funding, and practical wealth-building education.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/funding"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2 font-semibold text-black hover:bg-yellow-500 transition"
                >
                  Explore Funding <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/financial-literacy"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 py-2 font-semibold hover:bg-black/50 transition"
                >
                  Start Learning <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Educational content is not financial advice. We focus on
                literacy, access, and informed decision-making.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[26rem]">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-5 w-5 text-gold" />
                  Grow Your Portfolio
                </div>
                <p className="mt-1 text-sm text-gray-300">
                  Learn how investments work and how to evaluate risk.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Building2 className="h-5 w-5 text-gold" />
                  Fund Black Builders
                </div>
                <p className="mt-1 text-sm text-gray-300">
                  Support startups and community-based growth.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Landmark className="h-5 w-5 text-gold" />
                  Real Estate Pathways
                </div>
                <p className="mt-1 text-sm text-gray-300">
                  Understand strategies for long-term stability.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-5 w-5 text-gold" />
                  Trust + Education
                </div>
                <p className="mt-1 text-sm text-gray-300">
                  Learn the fundamentals before making moves.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Investment Areas */}
        <Section
          title="Key Investment Areas"
          subtitle="Start here based on your current goals."
        >
          <div className="flex flex-wrap justify-between gap-4">
            <InvestmentCard
              variant="gold"
              title="Startup Funding"
              description="Access funding opportunities, grants, venture resources, and community-backed pathways for Black founders."
              link="/funding"
              linkLabel="Explore Funding"
              icon={<Building2 className="h-5 w-5 text-gold" />}
              ariaLabel="Explore Startup Funding"
              tag="Capital + Grants"
            />
            <InvestmentCard
              title="Black-Owned Stocks"
              description="Discover publicly traded Black-led companies and learn how to evaluate stocks, ETFs, and long-term strategies."
              link="/stocks"
              linkLabel="View Stocks"
              icon={<TrendingUp className="h-5 w-5 text-gold" />}
              ariaLabel="View Stocks"
              tag="Markets"
            />
            <InvestmentCard
              title="Real Estate Investments"
              description="Learn real estate fundamentals, rent-to-own pathways, and long-term strategies that support generational wealth."
              link="/real-estate"
              linkLabel="Learn More"
              icon={<Landmark className="h-5 w-5 text-gold" />}
              ariaLabel="Learn More about Real Estate Investments"
              tag="Property"
            />
          </div>
        </Section>

        {/* Courses */}
        <Section
          title="Financial Literacy Courses"
          subtitle="Start with fundamentals, then build into investing and wealth strategy."
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CourseCard
              title="Personal Finance 101"
              description="Budgeting, saving, debt management, and habits that create stability."
              href="/course-enrollment"
              badge="Best starting point"
            />
            <CourseCard
              title="Investing for Beginners"
              description="Understand markets, long-term investing, diversification, and risk."
              href="/courses/investing-for-beginners"
            />
            <CourseCard
              title="Building Generational Wealth"
              description="Long-term planning, asset protection basics, and generational strategy."
              href="/courses/generational-wealth"
            />
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 mt-6">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-yellow-300 mt-0.5" />
              <div>
                <p className="text-gray-200 text-sm">
                  Want deeper strategies, tools, and premium learning tracks?
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  Premium can unlock advanced lessons, worksheets, and guided
                  pathways as they roll out.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2 font-semibold text-black hover:bg-yellow-500 transition"
              >
                Upgrade Options <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/financial-literacy"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 py-2 font-semibold hover:bg-black/50 transition"
              >
                Browse Lessons <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Section>

        {/* Literacy Topics */}
        <Section
          title="Financial Literacy for Black Investors"
          subtitle="Key topics we focus on to build confidence and clarity."
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <ul className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
              <li className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold mt-0.5" />
                  <div>
                    <strong className="text-white">
                      Wealth through assets
                    </strong>
                    <p className="mt-1 text-gray-300">
                      Understand stocks, real estate, businesses, and how they
                      can compound over time.
                    </p>
                  </div>
                </div>
              </li>

              <li className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold mt-0.5" />
                  <div>
                    <strong className="text-white">Budgeting + planning</strong>
                    <p className="mt-1 text-gray-300">
                      Build a system to manage cash flow and fund your goals.
                    </p>
                  </div>
                </div>
              </li>

              <li className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold mt-0.5" />
                  <div>
                    <strong className="text-white">Credit fundamentals</strong>
                    <p className="mt-1 text-gray-300">
                      Learn how credit works, how to improve it, and when to use
                      it responsibly.
                    </p>
                  </div>
                </div>
              </li>

              <li className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold mt-0.5" />
                  <div>
                    <strong className="text-white">Retirement planning</strong>
                    <p className="mt-1 text-gray-300">
                      Understand 401(k), IRA basics, and long-term planning.
                    </p>
                  </div>
                </div>
              </li>

              <li className="rounded-xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gold mt-0.5" />
                  <div>
                    <strong className="text-white">Debt management</strong>
                    <p className="mt-1 text-gray-300">
                      Strategies to reduce high-interest debt while increasing
                      savings and investment capacity.
                    </p>
                  </div>
                </div>
              </li>
            </ul>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/financial-literacy"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2 font-semibold text-black hover:bg-yellow-500 transition"
                aria-label="Learn more about Financial Literacy"
              >
                Learn More <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/course-enrollment"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 py-2 font-semibold hover:bg-black/50 transition"
              >
                Start Free Course <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Section>

        {/* Success Stories (more realistic + safe) */}
        <Section
          title="Success Stories"
          subtitle="Real stories will be featured as the community grows."
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <p className="text-gray-300">
              As members use Black Wealth Exchange to learn, invest, and grow,
              we’ll highlight verified stories from founders and everyday
              investors — focusing on lessons learned, strategies used, and the
              real outcomes.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-gray-300">
                <span className="text-gold font-semibold">Coming soon:</span>{" "}
                community spotlights, founder journeys, and financial
                accountability case studies.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
