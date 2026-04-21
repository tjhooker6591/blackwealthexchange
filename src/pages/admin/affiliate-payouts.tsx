import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

interface Payout {
  _id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  amount: number;
  payoutMethod: string;
  payoutDetails: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
}

export default function AffiliatePayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setError("");
        const res = await fetch("/api/admin/get-payouts", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load payout records");
        }
        setPayouts(Array.isArray(data?.payouts) ? data.payouts : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load payout records");
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, []);

  const handleComplete = async (payoutId: string) => {
    setBusyId(payoutId);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/complete-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payoutId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to complete payout",
        );
      }

      setPayouts((prev) =>
        prev.map((p) =>
          p._id === payoutId
            ? {
                ...p,
                status: "completed",
                processedAt: new Date().toISOString(),
              }
            : p,
        ),
      );
      setMessage(data?.message || "Payout marked completed.");
    } catch (err: any) {
      setError(err?.message || "Failed to complete payout");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-1">
              Affiliate Payout Requests
            </h1>
            <p className="text-sm text-white/70">
              Process pending affiliate payouts and track completion status.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Back to Dashboard
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-900/20 p-3 text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-900/20 p-3 text-emerald-200">
            {message}
          </div>
        ) : null}

        {loading ? (
          <p>Loading...</p>
        ) : payouts.length === 0 ? (
          <p>No payout records found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gold border-b border-gray-700 bg-gray-900">
                  <th className="p-3">Affiliate</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Requested</th>
                  <th className="p-3">Completed</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr
                    key={payout._id}
                    className="border-b border-gray-800 bg-black"
                  >
                    <td className="p-3">{payout.affiliateName}</td>
                    <td className="p-3">{payout.affiliateEmail}</td>
                    <td className="p-3">${payout.amount}</td>
                    <td className="p-3">{payout.payoutMethod}</td>
                    <td className="p-3">{payout.payoutDetails}</td>
                    <td
                      className={`p-3 ${payout.status === "completed" ? "text-green-400" : "text-yellow-400"}`}
                    >
                      {payout.status}
                    </td>
                    <td className="p-3">
                      {new Date(payout.requestedAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {payout.processedAt
                        ? new Date(payout.processedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      {payout.status === "pending" ? (
                        <button
                          onClick={() => handleComplete(payout._id)}
                          disabled={busyId === payout._id}
                          className="bg-gold text-black px-3 py-1 rounded hover:bg-yellow-400 disabled:opacity-50"
                        >
                          {busyId === payout._id
                            ? "Working..."
                            : "Mark Completed"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/affiliate-payouts",
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
          destination: "/login?redirect=/admin/affiliate-payouts",
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/affiliate-payouts",
        permanent: false,
      },
    };
  }
};
