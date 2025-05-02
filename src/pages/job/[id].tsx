// pages/job/[id].tsx
"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface Job {
  _id?: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description?: string;
  salary?: string;
  [key: string]: unknown; // ✅ Fixed ESLint error
}

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState<Job | null>(null);
  const [form, setForm] = useState({ name: "", email: "", resumeUrl: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/jobs/get?id=${id}`);
        const data = await res.json();
        if (res.ok) setJob(data.job);
        else setError("Job not found.");
      } catch {
        setError("Failed to fetch job.");
      }
    };
    fetchJob();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, jobId: id }),
      });
      if (res.ok) setSubmitted(true);
      else setError("Failed to apply.");
    } catch {
      setError("Server error. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-lg shadow">
        {!job ? (
          <p className="text-gray-400">{error || "Loading job details..."}</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gold mb-4">{job.title}</h1>
            <p className="text-gray-300 mb-2">{job.company}</p>
            <p className="text-gray-400 mb-6">
              {job.location} • {job.type}
            </p>

            {submitted ? (
              <p className="text-green-500 font-semibold">
                ✅ Application submitted successfully!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  name="name"
                  type="text"
                  placeholder="Your Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded bg-gray-800 border border-gray-600"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Your Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded bg-gray-800 border border-gray-600"
                />
                <input
                  name="resumeUrl"
                  type="url"
                  placeholder="Link to Resume (PDF, Google Drive, etc)"
                  value={form.resumeUrl}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded bg-gray-800 border border-gray-600"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition"
                >
                  Apply Now
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
