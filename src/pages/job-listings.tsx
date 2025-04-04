import React from "react";
import Link from "next/link";

export default function JobListingsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-gold">Job Listings</h1>
          <p className="text-gray-300 mt-2">
            Explore curated job opportunities from Black-owned businesses and
            employers committed to inclusive hiring. Whether you&rsquo;re an
            early-career applicant or a seasoned pro, this is your space to
            grow.
          </p>
        </header>

        {/* Why Use Our Platform */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-blue-400 mb-2">
            Why Use Our Platform?
          </h2>
          <ul className="list-disc ml-6 text-gray-300 space-y-2">
            <li>
              <strong>Diverse-First Hiring:</strong> We prioritize equity-driven
              employers who want to make a difference.
            </li>
            <li>
              <strong>Verified Employers:</strong> All job listings are reviewed
              and vetted by our team for accuracy and legitimacy.
            </li>
            <li>
              <strong>Opportunities That Match:</strong> From internships to
              executive roles, find jobs aligned with your goals.
            </li>
            <li>
              <strong>Community Backing:</strong> Join a network that values
              your voice, growth, and success.
            </li>
          </ul>
        </section>

        {/* How It Works */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-blue-400 mb-2">
            How It Works
          </h2>
          <ol className="list-decimal ml-6 text-gray-300 space-y-2">
            <li>
              Browse available job openings below or use the upcoming filter
              system.
            </li>
            <li>
              Click on a job to view full details and apply through the
              employers preferred method.
            </li>
            <li>
              Create a free account to save listings, track applications, and
              access mentorship tools.
            </li>
          </ol>
        </section>

        {/* 🔜 Job Board Coming Soon */}
        <section className="mt-10 bg-gray-700 p-4 rounded border border-gray-600 text-gray-100 text-sm">
          <p className="font-semibold">🚧 Job Board System Coming Soon</p>
          <p className="mt-2">
            We are currently building a fully searchable and filterable job
            board that will allow you to sort listings by location, job type,
            category, and more. Stay tuned!
          </p>
        </section>

        {/* Temporary CTA */}
        <section className="mt-10 text-center">
          <p className="text-gray-300 mb-4">
            In the meantime, employers are actively posting jobs through our
            platform.
          </p>
          <Link href="/signup">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Create a Free Account
            </button>
          </Link>
        </section>

        {/* Placeholder Job Listings (until real jobs API is integrated) */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gold mb-4">
            Featured Opportunities
          </h2>
          <div className="space-y-6">
            {[1, 2, 3].map((job) => (
              <div
                key={job}
                className="p-4 bg-gray-700 rounded shadow-md hover:shadow-xl transition"
              >
                <h3 className="text-xl font-semibold text-blue-300">
                  Marketing Specialist – Remote
                </h3>
                <p className="text-gray-300 mt-1">
                  Join a mission-driven startup focused on empowering Black
                  creators. Must have experience in social strategy & brand
                  development.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Location: Remote | Type: Full-Time
                </p>
                <Link href="/login">
                  <button className="mt-3 px-4 py-2 bg-gold text-black rounded font-semibold hover:bg-yellow-500 transition">
                    Apply Now
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
