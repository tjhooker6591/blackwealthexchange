// src/pages/jobs.tsx
import Link from "next/link";

export default function JobsHubPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      {/* subtle glow */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-yellow-500/20" />
        <div className="absolute top-24 right-[-120px] h-[420px] w-[420px] rounded-full blur-3xl bg-yellow-400/10" />
      </div>

      <div className="relative max-w-5xl mx-auto bg-gray-900/70 border border-gray-800 p-8 rounded-2xl shadow-xl space-y-10 backdrop-blur">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Jobs & Careers <span className="text-yellow-400">Hub</span>
            </h1>
            <p className="text-gray-300 mt-2 max-w-2xl">
              Explore jobs, internships, freelance gigs, and mentorship
              opportunities built to uplift Black professionals and
              entrepreneurs.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/">
              <button className="px-4 py-2 rounded border border-gray-700 text-gray-200 hover:bg-gray-900 transition">
                ← Home
              </button>
            </Link>
            <Link href="/job-listings">
              <button className="px-4 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition">
                Browse Jobs
              </button>
            </Link>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HubCard
            title="Find a Job"
            description="Browse open roles from Black-owned businesses and inclusive companies."
            href="/job-listings"
            buttonLabel="Explore Jobs"
            variant="gold"
          />

          <HubCard
            title="Hire Black Talent"
            description="Post a job and connect with top Black professionals. Employer access required."
            href="/post-job"
            buttonLabel="Post a Job"
            variant="blue"
          />

          <HubCard
            title="Internships & College Opportunities"
            description="Find internships, apprenticeships, scholarships, and early-career programs."
            href="/internships"
            buttonLabel="View Internships"
            variant="green"
          />

          <HubCard
            title="Freelance & Gig Work"
            description="Discover flexible projects or hire for short-term gigs with skilled talent."
            href="/freelance"
            buttonLabel="Explore Gigs"
            variant="red"
          />
        </div>

        {/* Mentorship */}
        <div className="p-6 rounded-2xl border border-gray-800 bg-gradient-to-b from-purple-700/40 to-gray-950/40 shadow-lg space-y-3">
          <h2 className="text-xl font-bold text-yellow-400">
            Mentorship Program
          </h2>
          <p className="text-gray-200 text-sm">
            Get matched with mentors and industry leaders to support your growth
            and career direction.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/mentorship">
              <button className="px-5 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition">
                Become a Mentee
              </button>
            </Link>
            <Link href="/mentorship">
              <button className="px-5 py-2 rounded border border-gray-700 text-gray-200 hover:bg-gray-900 transition">
                Learn More
              </button>
            </Link>
          </div>
        </div>

        {/* Profile CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">
            Create Your Profile & Get Discovered
          </h2>
          <p className="text-gray-300">
            Save jobs, track applications, and unlock more opportunities across
            the platform.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/signup">
              <button className="px-6 py-3 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition">
                Create Profile
              </button>
            </Link>
            <Link href="/login">
              <button className="px-6 py-3 rounded border border-gray-700 text-gray-200 hover:bg-gray-900 transition">
                Login
              </button>
            </Link>
          </div>
        </div>

        {/* Premium Upgrade */}
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">
            Level Up Your Career
          </h2>
          <p className="text-gray-300">
            Access premium job leads, coaching, resume reviews, and more.
          </p>
          <Link href="/pricing">
            <button className="px-6 py-3 rounded bg-purple-600 text-white hover:bg-purple-700 transition">
              Upgrade to Premium
            </button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-800">
          <Link href="/">
            <button className="px-6 py-3 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function HubCard({
  title,
  description,
  href,
  buttonLabel,
  variant,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  variant: "gold" | "blue" | "green" | "red";
}) {
  const styles =
    variant === "gold"
      ? "border-yellow-400/30 hover:border-yellow-400/60"
      : variant === "blue"
        ? "border-blue-500/30 hover:border-blue-500/60"
        : variant === "green"
          ? "border-green-500/30 hover:border-green-500/60"
          : "border-red-500/30 hover:border-red-500/60";

  const badge =
    variant === "gold"
      ? "bg-yellow-400/15 text-yellow-300"
      : variant === "blue"
        ? "bg-blue-500/15 text-blue-300"
        : variant === "green"
          ? "bg-green-500/15 text-green-300"
          : "bg-red-500/15 text-red-300";

  return (
    <div
      className={[
        "p-6 rounded-2xl border bg-gray-950/40 shadow-lg transition",
        styles,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold">{title}</h3>
        <span className={["text-xs px-2 py-1 rounded", badge].join(" ")}>
          Hub
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-300">{description}</p>
      <Link href={href}>
        <button className="mt-4 px-5 py-2 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition">
          {buttonLabel}
        </button>
      </Link>
    </div>
  );
}
