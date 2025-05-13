// pages/job/[id]/index.tsx
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary?: string;
  createdAt?: string;
}

export default function JobDetail() {
  const { query } = useRouter();
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!query.id) return;
    fetch(`/api/jobs/${query.id}`)
      .then((res) => res.json())
      .then((data) => setJob(data.job))
      .catch(console.error);
  }, [query.id]);

  if (!job) return <p className="text-gray-400 p-8">Loading…</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-gold">{job.title}</h1>
      <p className="text-gray-300">
        {job.company} – {job.location} – {job.type}
      </p>
      {job.salary && (
        <p className="mt-2 text-gray-400">💰 {job.salary}</p>
      )}
      <hr className="my-6 border-gray-700" />
      <div className="prose prose-invert">
        {/* Show the full description */}
        <p>{job.description}</p>
      </div>

      <div className="mt-8">
        <Link href={`/job/${job._id}/apply`}>
          <button className="px-6 py-3 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
            Apply Now
          </button>
        </Link>
      </div>
    </div>
  );
}
