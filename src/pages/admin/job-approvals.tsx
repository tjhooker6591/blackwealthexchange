import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type Job = {
  _id: string;
  title: string;
  company: string;
  category?: string;
  status: string;
  location?: string;
  createdAt?: string;
};

type MeResponse = {
  user?: {
    email?: string;
    accountType?: string;
    role?: string;
    isAdmin?: boolean;
    roles?: string[];
  };
};

function userIsAdmin(user?: MeResponse["user"]) {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (user.accountType === "admin") return true;
  if (user.role === "admin") return true;
  if (Array.isArray(user.roles) && user.roles.includes("admin")) return true;
  return false;
}

const JobApprovals = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const fetchUnapproved = useCallback(async () => {
    const res = await axios.get("/api/admin/get-unapproved-jobs", {
      withCredentials: true,
    });
    setJobs(Array.isArray(res.data?.jobs) ? res.data.jobs : []);
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkAdminAndFetch = async () => {
      try {
        setError("");
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          router.replace("/login?redirect=/admin/job-approvals");
          return;
        }

        const sessionData: MeResponse = await sessionRes
          .json()
          .catch(() => ({}));

        if (!userIsAdmin(sessionData.user)) {
          router.replace("/");
          return;
        }

        await fetchUnapproved();
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.response?.data?.error || err?.message || "Failed to load jobs",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAdminAndFetch();
    return () => {
      mounted = false;
    };
  }, [fetchUnapproved, router]);

  const refreshData = async () => {
    try {
      setRefreshing(true);
      setError("");
      setActionMessage("");
      await fetchUnapproved();
    } catch (err: any) {
      setError(
        err?.response?.data?.error || err?.message || "Failed to refresh jobs",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async (jobId: string) => {
    setBusyId(jobId);
    setError("");
    setActionMessage("");
    try {
      await axios.put(
        `/api/admin/approve-job/${jobId}`,
        {},
        { withCredentials: true },
      );
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      setActionMessage("Job approved.");
    } catch (err: any) {
      console.error("Approval failed", err);
      setError(err?.response?.data?.error || "Failed to approve job.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (jobId: string) => {
    const reason = window.prompt("Optional rejection reason:", "") || "";
    setBusyId(jobId);
    setError("");
    setActionMessage("");
    try {
      await axios.put(
        `/api/admin/reject-job/${jobId}`,
        { reason },
        { withCredentials: true },
      );
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      setActionMessage("Job rejected.");
    } catch (err: any) {
      console.error("Rejection failed", err);
      setError(err?.response?.data?.error || "Failed to reject job.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gold">
            💼 Job Post Approvals
          </h1>
          <div className="flex gap-2">
            <button
              onClick={refreshData}
              disabled={refreshing || loading}
              className="rounded-lg border border-gold/30 bg-zinc-900 px-4 py-2 text-sm text-gold hover:bg-zinc-800 disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 p-3 text-red-200">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 p-3 text-emerald-200">
            {actionMessage}
          </div>
        ) : null}

        {loading ? (
          <p className="text-center text-gray-400">
            Loading job moderation queue...
          </p>
        ) : jobs.length === 0 ? (
          <p className="text-center text-gray-400">
            No job posts awaiting approval.
          </p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="bg-gray-800 p-4 rounded shadow">
                <h2 className="text-xl text-gold">{job.title}</h2>
                <p>Company: {job.company}</p>
                {job.category && <p>Category: {job.category}</p>}
                {job.location && <p>Location: {job.location}</p>}
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
      </div>
    </div>
  );
};

export default JobApprovals;

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/job-approvals",
          permanent: false,
        },
      };
    }

    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      role?: string;
      isAdmin?: boolean;
      roles?: string[];
    };

    const isAdmin =
      payload.isAdmin === true ||
      payload.accountType === "admin" ||
      payload.role === "admin" ||
      (Array.isArray(payload.roles) && payload.roles.includes("admin"));

    if (!isAdmin) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/job-approvals",
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/job-approvals",
        permanent: false,
      },
    };
  }
};
