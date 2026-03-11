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
  const [busyId, setBusyId] = useState<string | null>(null);

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
    setBusyId(jobId);
    try {
      await axios.put(`/api/admin/approve-job/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      console.error("Approval failed", err);
      alert("Failed to approve job. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (jobId: string) => {
    const reason = window.prompt("Optional rejection reason:", "") || "";
    setBusyId(jobId);
    try {
      await axios.put(`/api/admin/reject-job/${jobId}`, { reason });
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      console.error("Rejection failed", err);
      alert("Failed to reject job. Please try again.");
    } finally {
      setBusyId(null);
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
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleApprove(job._id)}
                  disabled={busyId === job._id}
                  className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition disabled:opacity-60"
                >
                  {busyId === job._id ? "Working..." : "Approve"}
                </button>
                <button
                  onClick={() => handleReject(job._id)}
                  disabled={busyId === job._id}
                  className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-500 transition disabled:opacity-60"
                >
                  {busyId === job._id ? "Working..." : "Reject"}
                </button>
              </div>
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
