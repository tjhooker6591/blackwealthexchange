// pages/job-listings.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

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

  const applyToJob = async (jobId: string) => {
    try {
      await axios.post("/api/applicants/create", { jobId });
      alert("✅ Application submitted!");
      setSelectedJob(null);
    } catch (err) {
      console.error("Failed to apply", err);
      alert("❌ Failed to apply. Please try again.");
    }
  };

  const saveJob = async (jobId: string) => {
    try {
      await axios.post("/api/user/save-job", { jobId });
      alert("💾 Job saved!");
    } catch (err) {
      console.error("Failed to save job", err);
      alert("❌ Failed to save job. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* … header & intro … */}
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
                  }`}>
                  <h3 className="text-xl font-semibold text-blue-300">
                    {job.title} – {job.location}
                  </h3>
                  <p className="text-gray-300 mt-1">{job.company}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Type: {job.type} | {job.salary ? `💰 ${job.salary}` : "Salary not listed"}
                  </p>
                  <p className="text-gray-400 mt-2 line-clamp-3">
                    {job.description}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
                    >
                      View & Apply
                    </button>
                    <button
                      onClick={() => saveJob(job._id)}
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

      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 max-w-lg w-full relative">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-gold mb-2">
              {selectedJob.title}
            </h2>
            <p className="text-gray-300 mb-4">
              {selectedJob.company} — {selectedJob.location} — <em>{selectedJob.type}</em>
            </p>
            {selectedJob.salary && (
              <p className="text-gray-400 mb-4">💰 {selectedJob.salary}</p>
            )}

            <div className="prose prose-invert mb-6">
              <p>{selectedJob.description}</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition"
              >
                Close
              </button>
              <button
                onClick={() => applyToJob(selectedJob._id)}
                className="px-4 py-2 bg-gold text-black rounded hover:bg-yellow-500 transition"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
