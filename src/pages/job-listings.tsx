"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary?: string;
  isFeatured?: boolean;
  createdAt?: string;
}

export default function JobListingsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs/list")
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch jobs", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-gold">Job Listings</h1>
          <p className="text-gray-300 mt-2">
            Explore curated job opportunities from Black-owned businesses and
            employers committed to inclusive hiring. Whether you&apos;re an
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

        {/* Real-Time Job Feed */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gold mb-4">
            Featured Opportunities
          </h2>
          {loading ? (
            <p className="text-gray-400">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-gray-400">No jobs available at the moment.</p>
          ) : (
            <div className="space-y-6">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className={`p-4 bg-gray-700 rounded shadow-md hover:shadow-xl transition ${
                    job.isFeatured ? "border-2 border-yellow-400" : ""
                  }`}
                >
                  <h3 className="text-xl font-semibold text-blue-300">
                    {job.title} – {job.location}
                  </h3>
                  <p className="text-gray-300 mt-1">{job.company}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Type: {job.type} |{" "}
                    {job.salary ? `💰 ${job.salary}` : "Salary not listed"}
                  </p>
                  <p className="text-gray-400 mt-2 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <Link href={`/job/${job._id}`}>
                      <button className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                        View & Apply
                      </button>
                    </Link>
                    <button
                      onClick={() => alert("Login to save jobs")}
                      className="px-4 py-2 border border-gold text-gold rounded hover:bg-gold hover:text-black transition"
                    >
                      Save Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <p className="text-gray-300 mb-4">
            Want to save jobs and track applications?
          </p>
          <Link href="/signup">
            <button className="px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
              Create a Free Account
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
}
