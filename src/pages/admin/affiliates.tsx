// src/pages/admin/affiliates.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

interface Affiliate {
  _id: string;
  name: string;
  email: string;
  status: string;
  clicks: number;
  conversions: number;
  lifetimeEarnings: number;
  rejectedAt?: string | null;
}

interface MeResponse {
  user?: {
    email?: string;
    accountType?: string;
    role?: string;
    isAdmin?: boolean;
    roles?: string[];
  };
}

interface ApiErrorShape {
  code?: string;
  message?: string;
  error?: string;
}

type ParsedApiError = {
  code: string;
  message: string;
};

function parseApiError(
  data: ApiErrorShape | null | undefined,
  fallback: string,
): ParsedApiError {
  const code = typeof data?.code === "string" ? data.code.trim() : "";
  const message =
    typeof data?.message === "string"
      ? data.message
      : typeof data?.error === "string"
        ? data.error
        : fallback;

  return { code, message };
}

function toApiErrorText(parsed: ParsedApiError) {
  return parsed.code ? `${parsed.code}: ${parsed.message}` : parsed.message;
}

function userIsAdmin(user?: MeResponse["user"]) {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (user.accountType === "admin") return true;
  if (user.role === "admin") return true;
  if (Array.isArray(user.roles) && user.roles.includes("admin")) return true;
  return false;
}

export default function AdminAffiliates() {
  const router = useRouter();

  const [pending, setPending] = useState<Affiliate[]>([]);
  const [active, setActive] = useState<Affiliate[]>([]);
  const [rejected, setRejected] = useState<Affiliate[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");

  const loadAffiliateData = useCallback(async () => {
    const res = await fetch("/api/admin/affiliates/list", {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const parsed = parseApiError(data, "Failed to load affiliates");
      const err = new Error(toApiErrorText(parsed));
      (err as any).apiCode = parsed.code;
      throw err;
    }

    setPending(Array.isArray(data?.pending) ? data.pending : []);
    setActive(Array.isArray(data?.active) ? data.active : []);
    setRejected(Array.isArray(data?.rejected) ? data.rejected : []);
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkAdminAndFetch = async () => {
      try {
        setError("");
        setErrorCode("");

        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          router.replace("/login?redirect=/admin/affiliates");
          return;
        }

        const sessionData: MeResponse = await sessionRes
          .json()
          .catch(() => ({}));

        if (!userIsAdmin(sessionData.user)) {
          router.replace("/");
          return;
        }

        await loadAffiliateData();
      } catch (err: any) {
        if (mounted) {
          setErrorCode(typeof err?.apiCode === "string" ? err.apiCode : "");
          setError(err?.message || "Failed to load affiliates");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAdminAndFetch();

    return () => {
      mounted = false;
    };
  }, [loadAffiliateData, router]);

  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");
      setErrorCode("");
      await loadAffiliateData();
    } catch (err: any) {
      setErrorCode(typeof err?.apiCode === "string" ? err.apiCode : "");
      setError(err?.message || "Failed to refresh affiliates");
    } finally {
      setRefreshing(false);
    }
  }, [loadAffiliateData]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      setError("");
      setErrorCode("");

      const res = await fetch(`/api/admin/affiliates/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ affiliateId: id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const parsed = parseApiError(data, `Failed to ${action} affiliate`);
        const err = new Error(toApiErrorText(parsed));
        (err as any).apiCode = parsed.code;
        throw err;
      }

      await refreshData();
    } catch (err: any) {
      setErrorCode(typeof err?.apiCode === "string" ? err.apiCode : "");
      setError(err?.message || `Failed to ${action} affiliate`);
    }
  };

  return (
    <>
      <Head>
        <title>Admin | Manage Affiliates</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6 md:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gold mb-2">
                Affiliate Management
              </h1>
              <p className="text-sm text-gray-400">
                Review pending affiliate applications and monitor approved
                partners.
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
                href="/admin/dashboard"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Back to Admin Dashboard
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <p>Loading affiliates...</p>
            </div>
          ) : (
            <>
              {error ? (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200">
                  {errorCode ? (
                    <div className="mb-1 text-xs text-red-300/90">
                      Code:{" "}
                      <span className="whitespace-nowrap font-mono tracking-normal">
                        {errorCode}
                      </span>
                    </div>
                  ) : null}
                  <div>{error}</div>
                </div>
              ) : null}

              {/* Pending Applications */}
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-semibold text-gold">
                  Pending Applications
                </h2>

                {pending.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">
                    No affiliate applications are awaiting review.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pending.map((a) => (
                      <div
                        key={a._id}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-white">{a.name}</p>
                          <p className="text-sm text-zinc-400">{a.email}</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(a._id, "approve")}
                            className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400 font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(a._id, "reject")}
                            className="px-4 py-2 bg-red-500 text-black rounded hover:bg-red-400 font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Active Affiliates */}
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-semibold text-gold">
                  Active Affiliates
                </h2>

                {active.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">
                    No affiliates are currently active.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 text-gold">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Clicks</th>
                          <th className="px-4 py-3">Conversions</th>
                          <th className="px-4 py-3">Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.map((a) => (
                          <tr
                            key={a._id}
                            className="border-b border-zinc-800 last:border-b-0"
                          >
                            <td className="px-4 py-3">{a.name}</td>
                            <td className="px-4 py-3">{a.email}</td>
                            <td className="px-4 py-3">{a.clicks}</td>
                            <td className="px-4 py-3">{a.conversions}</td>
                            <td className="px-4 py-3">
                              ${Number(a.lifetimeEarnings || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Rejected Affiliates */}
              <section>
                <h2 className="mb-4 text-2xl font-semibold text-gold">
                  Rejected Affiliates
                </h2>

                {rejected.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300">
                    No rejected affiliates are recorded in this view.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 text-gold">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Rejected At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejected.map((a) => (
                          <tr
                            key={a._id}
                            className="border-b border-zinc-800 last:border-b-0"
                          >
                            <td className="px-4 py-3">{a.name}</td>
                            <td className="px-4 py-3">{a.email}</td>
                            <td className="px-4 py-3">
                              {a.rejectedAt
                                ? new Date(a.rejectedAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/affiliates",
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
          destination: "/login?redirect=/admin/affiliates",
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/affiliates",
        permanent: false,
      },
    };
  }
};
