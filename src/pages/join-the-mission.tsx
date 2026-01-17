import React from "react";
import Link from "next/link";

export default function JoinTheMissionPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Nav / Back */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent p-8 shadow-lg">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-yellow-400">
            Build Black Wealth Exchange With Us
          </h1>
          <p className="mt-4 text-lg text-white/85 leading-relaxed max-w-3xl">
            Black Wealth Exchange is a Black-owned digital platform designed to
            create economic power, ownership, jobs, and financial opportunity
            for Black communities worldwide.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="https://www.blackwealthexchange.com"
              className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow"
            >
              Visit Black Wealth Exchange
            </a>

            <a
              href="#apply"
              className="inline-flex justify-center rounded-xl border border-yellow-500 px-6 py-3 font-bold text-yellow-400 hover:bg-yellow-500/10 transition"
            >
              Apply to Join the Team
            </a>
          </div>
        </div>
      </section>

      {/* Mission + Who */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold text-yellow-400">Our Mission</h2>
            <p className="mt-3 text-white/85 leading-relaxed">
              We are building technology that connects Black businesses, Black
              professionals, Black students, Black consumers, and Black
              investors.
            </p>
            <p className="mt-3 text-white/85 leading-relaxed">
              We are not building a startup for sale. We are building{" "}
              <span className="text-yellow-400 font-semibold">
                economic infrastructure
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold text-yellow-400">
              Who We are Looking For
            </h2>
            <p className="mt-3 text-white/85 leading-relaxed">
              Mission-driven interns and contributors who want to build
              technology, community, and opportunity for Black people
              everywhere.
            </p>
            <p className="mt-3 text-white/85 leading-relaxed">
              You don not need decades of experience — you need commitment,
              integrity, and a desire to grow.
            </p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <h2 className="text-3xl font-extrabold text-yellow-400">Open Roles</h2>
        <p className="mt-2 text-white/80 max-w-3xl">
          Choose a lane, contribute consistently, and build something that
          lasts.
        </p>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <RoleCard
            title="Frontend Developer Intern"
            bullets={[
              "Marketplace pages, dashboards, job boards",
              "React / Next.js UI improvements",
              "Clean, responsive layouts + components",
            ]}
            skills={["React", "Next.js", "UI/UX basics"]}
          />

          <RoleCard
            title="Backend Developer Intern"
            bullets={[
              "API routes, authentication, data models",
              "Marketplace + job system features",
              "Validation, security, and clean patterns",
            ]}
            skills={["Node.js", "MongoDB", "REST APIs"]}
          />

          <RoleCard
            title="AI & Data Intern"
            bullets={[
              "AI assistant + smart search",
              "Matching (jobs, businesses, resources)",
              "Data analysis + recommendations",
            ]}
            skills={["Python or JS", "AI interest", "Data mindset"]}
          />

          <RoleCard
            title="Community & Content Intern"
            bullets={[
              "Social media posts + content calendar",
              "Business spotlights + success stories",
              "Community engagement + outreach",
            ]}
            skills={["Writing", "Social", "Communication"]}
          />

          <RoleCard
            title="Research & Partnerships Intern"
            bullets={[
              "Grant research + partnerships",
              "Outreach lists (HBCUs, orgs, businesses)",
              "Market research + strategy support",
            ]}
            skills={["Research", "Writing", "Organization"]}
          />
        </div>
      </section>

      {/* What You Get */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold text-yellow-400">What You Get</h2>

          <ul className="mt-4 grid md:grid-cols-2 gap-3 text-white/85">
            <li className="rounded-xl border border-white/10 bg-black/30 p-4">
              ✅ Resume + LinkedIn references
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 p-4">
              ✅ Public recognition & portfolio credit
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 p-4">
              ✅ Real production experience
            </li>
            <li className="rounded-xl border border-white/10 bg-black/30 p-4">
              ✅ Mentorship + community
            </li>
          </ul>

          <p className="mt-4 text-white/80 leading-relaxed">
            As the platform grows, future paid roles and leadership
            opportunities will be created from this team.
          </p>
        </div>
      </section>

      {/* Trust / Control */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/5 p-6">
          <h2 className="text-2xl font-bold text-yellow-400">
            How We Protect the Mission
          </h2>
          <p className="mt-3 text-white/85 leading-relaxed">
            Contributors do not receive production access. Work is done through
            controlled tasks and reviewed before merging to protect the
            platform.
          </p>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold text-yellow-400">How to Join</h2>

          <p className="mt-3 text-white/85 leading-relaxed">
            Submit your name, skills, the role you want, and why you want to
            help build Black Wealth Exchange.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            {/* Internal application route */}
            <Link
              href="/apply"
              className="inline-flex justify-center rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 transition shadow"
            >
              Apply Now
            </Link>

            {/* Fallback email option */}
            <a
              href="mailto:blackwealth24@gmail.com?subject=Join%20the%20Mission%20-%20Black%20Wealth%20Exchange"
              className="inline-flex justify-center rounded-xl border border-yellow-500 px-6 py-3 font-bold text-yellow-400 hover:bg-yellow-500/10 transition"
            >
              Email Us Instead
            </a>
          </div>

          <p className="mt-4 text-sm text-white/60">
            Tip: Include links to your GitHub, portfolio, LinkedIn, or sample
            work.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-6 text-white/60 text-sm flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Black Wealth Exchange</span>
          <span className="text-white/60">
            Built for community. Built for legacy.
          </span>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({
  title,
  bullets,
  skills,
}: {
  title: string;
  bullets: string[];
  skills: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition shadow">
      <h3 className="text-xl font-bold text-yellow-400">{title}</h3>

      <ul className="mt-4 space-y-2 text-white/85">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-yellow-400">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2">
        {skills.map((s) => (
          <span
            key={s}
            className="rounded-full border border-yellow-500/25 bg-black/30 px-3 py-1 text-sm text-yellow-300"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
