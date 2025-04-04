// pages/employer/jobs.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  datePosted: string;
  applicants: number;
}

const mockJobs: Job[] = [
  {
    id: "1",
    title: "Full Stack Developer",
    company: "BlkTech Solutions",
    location: "Remote",
    type: "Full-Time",
    datePosted: "2025-04-01",
    applicants: 12,
  },
  {
    id: "2",
    title: "Social Media Intern",
    company: "Uplift Creators",
    location: "Atlanta, GA",
    type: "Internship",
    datePosted: "2025-03-28",
    applicants: 7,
  },
];

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Replace with API call later
    setJobs(mockJobs);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gold">Your Job Listings</h1>
          <Link href="/post-job">
            <button className="bg-gold text-black font-semibold px-4 py-2 rounded hover:bg-yellow-500 transition">
              Post New Job
            </button>
          </Link>
        </div>

        {jobs.length === 0 ? (
          <p className="text-gray-400">You haven’t posted any jobs yet.</p>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-gold">{job.title}</h2>
                  <span className="text-sm text-gray-400">
                    Posted: {job.datePosted}
                  </span>
                </div>
                <p className="text-gray-300">
                  {job.company} • {job.location} • {job.type}
                </p>
                <p className="text-gray-400 mt-2">
                  {job.applicants} applicant{job.applicants !== 1 && "s"}
                </p>
                <div className="mt-4 flex gap-3">
                  <Link href={`/employer/applicants?jobId=${job.id}`}>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                      View Applicants
                    </button>
                  </Link>
                  <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
                    Edit
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
