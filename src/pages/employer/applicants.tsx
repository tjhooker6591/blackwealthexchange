// pages/employer/applicants.tsx
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Applicant {
  _id: string;
  name: string;
  email: string;
  resumeUrl: string;
  appliedDate: string;
}

export default function EmployerApplicantsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!jobId) return;

      try {
        const res = await fetch(`/api/applicants/by-job?jobId=${jobId}`);
        const data = await res.json();
        if (res.ok) {
          setApplicants(data.applicants);
        } else {
          console.error("Error fetching applicants:", data);
        }
      } catch (error) {
        console.error("Failed to load applicants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gold">
            Applicants for Job #{jobId}
          </h1>
          <Link href="/employer/jobs">
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
              Back to Jobs
            </button>
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading applicants...</p>
        ) : applicants.length === 0 ? (
          <p className="text-gray-400">No applicants found for this job yet.</p>
        ) : (
          <div className="space-y-6">
            {applicants.map((applicant) => (
              <div
                key={applicant._id}
                className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
              >
                <h2 className="text-xl font-bold text-gold">
                  {applicant.name}
                </h2>
                <p className="text-gray-300">{applicant.email}</p>
                <p className="text-sm text-gray-400 mb-2">
                  Applied:{" "}
                  {new Date(applicant.appliedDate).toLocaleDateString()}
                </p>
                <a
                  href={applicant.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  View Resume
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
