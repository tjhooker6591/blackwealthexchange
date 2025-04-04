import React from "react";
import Link from "next/link";

export default function EmployerDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Dashboard Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold mb-2">
            Welcome, Employer
          </h1>
          <p className="text-gray-300 text-lg">
            Manage your job listings, view applicants, and connect with top Black talent.
          </p>
        </header>

        {/* Quick Access Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Post a Job"
            description="Create a new job listing to attract qualified candidates."
            href="/post-job"
            color="bg-gold"
          />

          <DashboardCard
            title="View Listings"
            description="Manage and edit all the jobs you’ve posted on the platform."
            href="/employer/jobs"
            color="bg-blue-600"
          />

          <DashboardCard
            title="Applicants"
            description="View and organize applicants for each of your job listings."
            href="/employer/applicants"
            color="bg-green-600"
          />

          <DashboardCard
            title="Manage Company Profile"
            description="Update your business details, logo, and contact info."
            href="/business/profile"
            color="bg-purple-600"
          />

          <DashboardCard
            title="Promote a Job"
            description="Feature your job on the homepage or newsletter for more visibility."
            href="/advertise-with-us"
            color="bg-red-600"
          />

          <DashboardCard
            title="Upgrade to Premium"
            description="Access hiring tools, analytics, and boosted visibility."
            href="/pricing"
            color="bg-yellow-500 text-black"
          />
        </section>

        {/* Resources Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gold mb-4">
            Hiring Resources
          </h2>
          <p className="text-gray-300 mb-6">
            Improve your recruitment process with tips, templates, and hiring guides.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <ResourceCard
              title="Diversity Hiring Tips"
              href="/resources/diversity-hiring"
              description="Learn how to build a more inclusive hiring pipeline."
            />
            <ResourceCard
              title="Job Description Templates"
              href="/resources/job-templates"
              description="Use proven templates to craft clear, attractive job listings."
            />
            <ResourceCard
              title="Interview Best Practices"
              href="/resources/interviewing"
              description="Conduct equitable and insightful interviews."
            />
          </div>
        </section>

        {/* Support CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Need help or custom hiring support?{" "}
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

// Reusable Card Components
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
