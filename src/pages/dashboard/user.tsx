import React from "react";
import Link from "next/link";

export default function UserDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Dashboard Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-300 text-lg">
            Your central hub for discovering opportunities, managing your
            career, and building a successful future.
          </p>
        </header>

        {/* Quick Access Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Job Search */}
          <DashboardCard
            title="Find a Job"
            description="Browse current job openings tailored for your skills and interests."
            href="/job-listings"
            color="bg-gold"
          />

          {/* Saved Jobs */}
          <DashboardCard
            title="Saved Jobs"
            description="View and manage jobs you've saved for future applications."
            href="/saved-jobs"
            color="bg-blue-600"
          />

          {/* Application Tracker */}
          <DashboardCard
            title="Application Tracker"
            description="Keep tabs on the jobs you've applied for and their status."
            href="/applications"
            color="bg-green-600"
          />

          {/* Resume Builder */}
          <DashboardCard
            title="Resume & Profile"
            description="Create a standout resume and build a career-ready profile."
            href="/profile"
            color="bg-purple-600"
          />

          {/* Mentorship Access */}
          <DashboardCard
            title="Mentorship"
            description="Connect with experienced professionals who can guide your journey."
            href="/mentorship"
            color="bg-red-600"
          />

          {/* Premium Access */}
          <DashboardCard
            title="Premium Tools"
            description="Get resume reviews, mock interviews, and exclusive listings."
            href="/pricing"
            color="bg-yellow-600 text-black"
          />
        </section>

        {/* Personalized Career Resources */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gold mb-4">
            Career Growth Resources
          </h2>
          <p className="text-gray-300 mb-6">
            Tap into educational guides, industry insights, and financial
            wellness content made just for you.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <ResourceCard
              title="Financial Literacy"
              href="/financial-literacy"
              description="Learn how to budget, save, and invest for your future."
            />
            <ResourceCard
              title="Internship Opportunities"
              href="/internships"
              description="Access early career pathways in tech, business, and more."
            />
            <ResourceCard
              title="Freelance Gigs"
              href="/freelance"
              description="Browse flexible work and get paid for your skills."
            />
          </div>
        </section>

        {/* Final CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Need help or have questions?{" "}
            <Link
              href="/contact"
              className="text-blue-400 underline hover:text-blue-300"
            >
              Contact our support team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// DashboardCard Component
function DashboardCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`p-6 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer ${color}`}
      >
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm">{description}</p>
      </div>
    </Link>
  );
}

// ResourceCard Component
function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-gray-700 p-4 rounded-lg hover:shadow-lg transition">
        <h4 className="text-lg font-semibold text-gold mb-2">{title}</h4>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </Link>
  );
}
