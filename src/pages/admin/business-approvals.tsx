// src/pages/admin/business-approvals.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

type Business = {
  _id: string;
  businessName: string;
  ownerName?: string;
  email?: string;
  submittedAt?: string;
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

export default function BusinessApprovals() {
  const router = useRouter();

  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchPending = useCallback(async () => {
    const res = await fetch("/api/admin/get-pending-businesses", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Failed to load pending businesses");
    }

    setPendingBusinesses(
      Array.isArray(data?.businesses) ? data.businesses : [],
    );
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
          router.replace("/login?redirect=/admin/business-approvals");
          return;
        }

        const sessionData: MeResponse = await sessionRes
          .json()
          .catch(() => ({}));

        if (!userIsAdmin(sessionData.user)) {
          router.replace("/");
          return;
        }

        await fetchPending();
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Failed to load pending businesses");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAdminAndFetch();

    return () => {
      mounted = false;
    };
  }, [fetchPending, router]);

  const refreshData = async () => {
    try {
      setRefreshing(true);
      setError("");
      await fetchPending();
    } catch (err: any) {
      setError(err?.message || "Failed to refresh businesses");
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this business?")) return;

    try {
      setError("");

      const res = await fetch("/api/admin/approve-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId: id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to approve business");
      }

      setPendingBusinesses((prev) => prev.filter((biz) => biz._id !== id));
    } catch (err: any) {
      setError(err?.message || "Approval failed");
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject this business?")) return;

    try {
      setError("");

      const res = await fetch(`/api/admin/rejectBusiness/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to reject business");
      }

      setPendingBusinesses((prev) => prev.filter((biz) => biz._id !== id));
    } catch (err: any) {
      setError(err?.message || "Rejection failed");
    }
  };

  return (
    <>
      <Head>
        <title>Admin | Business Approvals</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gold">
                Business Approvals
              </h1>
              <p className="text-sm text-gray-400">
                Review and approve pending business submissions.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="rounded-lg border border-gold/30 bg-zinc-900 px-4 py-2 text-sm text-gold hover:bg-zinc-800 disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                href="/admin/directory-duplicates"
                className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/20"
              >
                Duplicates Queue
              </Link>
              <Link
                href="/admin/dashboard"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Back to Admin Dashboard
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <p>Loading pending businesses...</p>
            </div>
          ) : (
            <>
              {error ? (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200">
                  {error}
                </div>
              ) : null}

              {pendingBusinesses.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
                  No pending business approvals. 🎉
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-gold">
                        <th className="p-3">Business Name</th>
                        <th className="p-3">Owner</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Submitted</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingBusinesses.map((biz) => (
                        <tr
                          key={biz._id}
                          className="border-b border-zinc-800 last:border-b-0"
                        >
                          <td className="p-3">{biz.businessName}</td>
                          <td className="p-3">{biz.ownerName || "N/A"}</td>
                          <td className="p-3">{biz.email || "N/A"}</td>
                          <td className="p-3">
                            {biz.submittedAt
                              ? new Date(biz.submittedAt).toLocaleDateString()
                              : "Unknown"}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(biz._id)}
                                className="rounded bg-green-600 px-3 py-1 font-semibold text-black hover:bg-green-500 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(biz._id)}
                                className="rounded bg-red-600 px-3 py-1 font-semibold text-black hover:bg-red-500 transition"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
