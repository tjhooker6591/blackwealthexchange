import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

type Job = {
  _id: string;
  title: string;
  company: string;
  category?: string;
  status: string;
};

const JobApprovals = () => {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchUnapproved = async () => {
      try {
        const res = await axios.get("/api/admin/get-unapproved-jobs");
        setJobs(res.data.jobs); // ✅ FIXED
      } catch (err) {
        console.error("Failed to fetch jobs", err);
      }
    };
    fetchUnapproved();
  }, []);

  const handleApprove = async (jobId: string) => {
    try {
      await axios.put(`/api/admin/approve-job/${jobId}`);
      setJobs(jobs.filter((j) => j._id !== jobId));
    } catch (err) {
      console.error("Approval failed", err);
      alert("Failed to approve job. Please try again.");
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gold text-center">
        💼 Job Post Approvals
      </h1>
      {jobs.length === 0 ? (
        <p className="text-center text-gray-400">
          No job posts awaiting approval.
        </p>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {jobs.map((job) => (
            <div key={job._id} className="bg-gray-800 p-4 rounded shadow">
              <h2 className="text-xl text-gold">{job.title}</h2>
              <p>Company: {job.company}</p>
              {job.category && <p>Category: {job.category}</p>}
              <p>Status: {job.status}</p>
              <button
                onClick={() => handleApprove(job._id)}
                className="mt-3 bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition"
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/admin/dashboard"
        className="block text-gold text-center mt-8 hover:underline"
      >
        ← Back to Admin Dashboard
      </Link>
    </div>
  );
};

export default JobApprovals;
