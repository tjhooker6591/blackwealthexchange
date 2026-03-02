import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Users,
  Star,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const FreelancePage: React.FC = () => {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1)
      router.back();
    else router.push("/job-listings");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Freelance & Gig Work | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Find project-based work or hire skilled Black freelancers. Explore gigs, build trust through profiles and reviews, and join the waitlist for premium tools."
        />
      </Head>

      {/* subtle gold glow */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.18]">
        <div className="absolute -top-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gold blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4 text-gold" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/explore-gigs"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
            >
              Explore Gigs
            </Link>
            <Link
              href="/subscribe?product=freelance"
              className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 transition"
            >
              Join Waitlist
            </Link>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                <Sparkles className="h-4 w-4" />
                Freelance & Gigs (Expanding)
              </div>

              <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-gold">
                Freelance & Gig Work
              </h1>

              <p className="mt-2 text-gray-300">
                Find short-term projects, contract roles, and project-based work
                — or hire skilled Black freelancers across industries.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/explore-gigs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2 font-semibold text-black hover:bg-yellow-500 transition"
                >
                  Explore Gigs <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/subscribe?product=freelance"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 py-2 font-semibold hover:bg-black/50 transition"
                >
                  Join Freelance Waitlist <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Note: Premium tools (advanced matching, outreach, and enhanced
                visibility) are rolling out in phases.
              </p>
            </div>

            {/* Quick value cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[26rem]">
              <MiniCard
                icon={<Briefcase className="h-5 w-5 text-gold" />}
                title="For Freelancers"
                text="Showcase skills, land gigs, build recurring clients."
              />
              <MiniCard
                icon={<Users className="h-5 w-5 text-gold" />}
                title="For Clients"
                text="Find specialists quickly with clear profiles."
              />
              <MiniCard
                icon={<Star className="h-5 w-5 text-gold" />}
                title="Reputation"
                text="Ratings and reviews to build trust."
              />
              <MiniCard
                icon={<ShieldCheck className="h-5 w-5 text-gold" />}
                title="Safer Marketplace"
                text="Reporting + policy enforcement as we scale."
              />
            </div>
          </div>
        </div>

        {/* Overview */}
        <Section
          title="Overview"
          subtitle="A clearer, trust-first freelance experience."
        >
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-gray-300">
            The freelance economy gives professionals flexibility and gives
            businesses fast access to specialized skills. Black Wealth Exchange
            is building a dedicated space for Black freelancers and the clients
            who want to hire them — with identity, credibility, and trust at the
            center.
          </div>
        </Section>

        {/* How it works */}
        <Section title="How It Works" subtitle="Simple steps for both sides.">
          <div className="grid gap-4 md:grid-cols-3">
            <StepCard
              n="1"
              title="Create a profile or post work"
              text="Freelancers highlight skills + portfolio. Clients describe the project and requirements."
            />
            <StepCard
              n="2"
              title="Browse and connect"
              text="Search gigs or talent and connect directly using the platform tools as they roll out."
            />
            <StepCard
              n="3"
              title="Deliver and build reputation"
              text="Complete the project and leave feedback to strengthen trust for future work."
            />
          </div>
        </Section>

        {/* Membership / Waitlist (not confusing) */}
        <Section
          title="Premium Tools (Coming Soon)"
          subtitle="This is specifically for Freelance & Gigs — not the entire site."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <FeatureCard
              title="What premium will unlock"
              items={[
                "Enhanced freelancer visibility and priority discovery",
                "Advanced filters and direct outreach tools",
                "Featured gigs and boosted listings",
                "Verified profile signals (phase-based rollout)",
              ]}
            />
            <FeatureCard
              title="What’s live today"
              items={[
                "Freelance hub + structured experience",
                "Explore Gigs page (foundation for listings)",
                "Waitlist enrollment for early access",
                "Incremental rollout with transparency",
              ]}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-yellow-300 mt-0.5" />
              <p className="text-sm text-gray-200">
                <span className="font-semibold text-white">Important:</span>{" "}
                joining the waitlist here only applies to the{" "}
                <span className="text-gold font-semibold">
                  Freelance & Gig Work
                </span>{" "}
                feature. It does not subscribe you to anything else on the
                platform.
              </p>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/subscribe?product=freelance"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2 font-semibold text-black hover:bg-yellow-500 transition"
              >
                Join Freelance Waitlist <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/explore-gigs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 py-2 font-semibold hover:bg-black/50 transition"
              >
                Explore Gigs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Section>

        {/* Quality */}
        <Section
          title="How We Ensure Quality"
          subtitle="Trust is non-negotiable."
        >
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <ul className="list-disc ml-6 text-gray-300 space-y-2">
              <li>
                <strong className="text-white">
                  Ratings & Reviews (Planned):
                </strong>{" "}
                Two-way feedback to build reputation and accountability.
              </li>
              <li>
                <strong className="text-white">Profiles & Portfolios:</strong>{" "}
                Clear skill presentation and proof of work.
              </li>
              <li>
                <strong className="text-white">Reporting & Support:</strong>{" "}
                Tools to report abuse and violations; enforcement improves as we
                scale.
              </li>
              <li>
                <strong className="text-white">
                  Protected Payments (Roadmap):
                </strong>{" "}
                Platform-protected payments/escrow will be introduced in future
                phases.
              </li>
            </ul>
          </div>
        </Section>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-gold">Get Started</h3>
              <p className="text-sm text-gray-300 mt-1">
                Explore gigs now and join the waitlist for premium freelance
                tools.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/explore-gigs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-5 py-2 font-semibold hover:bg-black/50 transition"
              >
                Explore Gigs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/subscribe?product=freelance"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2 font-semibold text-black hover:bg-yellow-500 transition"
              >
                Join Waitlist <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Small footer note */}
        <p className="text-xs text-gray-500">
          Black Wealth Exchange is building this feature in phases. We’ll keep
          the experience transparent so users know what’s live and what’s coming
          next.
        </p>
      </div>
    </div>
  );
};

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

function MiniCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center gap-2 font-semibold text-white">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-sm text-gray-300">{text}</p>
    </div>
  );
}

function StepCard({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 font-extrabold">
        {n}
      </div>
      <h3 className="mt-3 text-lg font-extrabold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-300">{text}</p>
    </div>
  );
}

function FeatureCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <h3 className="text-lg font-extrabold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-300">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-yellow-300 mt-0.5" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FreelancePage;
