import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type Row = {
  _id: string;
  status: string;
  reviewStatus: "pending" | "approved" | "rejected" | "spam" | "deleted";
  adminNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  deletedAt: string | null;
  paymentStatus: string;
  depositPaid: boolean;
  name: string;
  business: string;
  email: string;
  option: string | null;
  durationDays: number | null;
  placement: string | null;
  scheduleWeeks: string[];
  scheduleQueueStatus: string | null;
  scheduleRolledOver: boolean;
  campaignLifecycle:
    | "pending"
    | "queued"
    | "scheduled"
    | "active"
    | "completed";
  selectedOptions: string[];
  budget: string | null;
  timeline: string | null;
  details: string;
  createdAt: string | null;
  paidAt: string | null;
  trustSignals: {
    ip: string | null;
    userAgent: string | null;
    duplicateEmailCount: number;
    duplicateIpCount: number;
    flags: string[];
  };
};

export default function AdvertisingRequestsAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "spam" | "deleted"
  >("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    "all" | "pending" | "queued" | "scheduled" | "active" | "completed"
  >("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  async function loadRows() {
    const res = await fetch("/api/admin/advertising-requests", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data?.error || "Failed to load advertising requests");
    setRows(Array.isArray(data?.requests) ? data.requests : []);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadRows();
      } catch (e: any) {
        if (mounted)
          setError(e?.message || "Failed to load advertising requests");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function applyReviewAction(
    row: Row,
    reviewStatus: "pending" | "approved" | "rejected" | "spam" | "deleted",
  ) {
    setSavingId(row._id);
    setError("");
    try {
      const res = await fetch("/api/admin/advertising-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: row._id,
          reviewStatus,
          adminNote: noteDrafts[row._id] ?? row.adminNote ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update request");
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to update request");
    } finally {
      setSavingId("");
    }
  }

  async function hardDelete(row: Row) {
    if (!confirm("Delete/remove this submission from active review queues?")) {
      return;
    }
    setSavingId(row._id);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/advertising-requests?id=${encodeURIComponent(row._id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete request");
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to delete request");
    } finally {
      setSavingId("");
    }
  }

  const filtered = useMemo(() => {
    let next = rows;
    if (filter === "paid") next = next.filter((r) => r.depositPaid);
    if (filter === "unpaid") next = next.filter((r) => !r.depositPaid);
    if (lifecycleFilter !== "all") {
      next = next.filter((r) => r.campaignLifecycle === lifecycleFilter);
    }
    if (statusFilter !== "all") {
      next = next.filter((r) => r.reviewStatus === statusFilter);
    }
    return next;
  }, [rows, filter, lifecycleFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gold">
              Advertising Requests
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Review + disposition queue (approve/reject/spam/delete) with trust
              signals.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/dashboard"
              className="rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {(["all", "paid", "unpaid"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded px-3 py-1 text-sm border ${
                filter === key
                  ? "border-gold bg-gold text-black"
                  : "border-gray-700 bg-gray-800 text-gray-200"
              }`}
            >
              {key === "all"
                ? "All"
                : key === "paid"
                  ? "Paid Deposit"
                  : "Unpaid Deposit"}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              "all",
              "pending",
              "approved",
              "rejected",
              "spam",
              "deleted",
            ] as const
          ).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded px-3 py-1 text-xs border ${
                statusFilter === key
                  ? "border-amber-300 bg-amber-400/20 text-amber-200"
                  : "border-gray-700 bg-gray-800 text-gray-300"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              "all",
              "pending",
              "queued",
              "scheduled",
              "active",
              "completed",
            ] as const
          ).map((key) => (
            <button
              key={key}
              onClick={() => setLifecycleFilter(key)}
              className={`rounded px-3 py-1 text-xs border ${
                lifecycleFilter === key
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  : "border-gray-700 bg-gray-800 text-gray-300"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded border border-gray-700 bg-gray-800 p-4">
            Loading…
          </div>
        ) : error ? (
          <div className="rounded border border-red-500/40 bg-red-900/30 p-4 text-red-200">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded border border-gray-700 bg-gray-800 p-4 text-gray-300">
            No advertising requests found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-700 bg-gray-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-700 text-gold">
                <tr>
                  <th className="p-3">Business / Contact</th>
                  <th className="p-3">Campaign</th>
                  <th className="p-3">Trust Signals</th>
                  <th className="p-3">Review Status</th>
                  <th className="p-3">Actions</th>
                  <th className="p-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-gray-700/60 align-top"
                  >
                    <td className="p-3">
                      <div className="font-semibold">{r.business || "—"}</div>
                      <div>{r.name || "—"}</div>
                      <div className="text-xs text-gray-400">
                        {r.email || "—"}
                      </div>
                      <div className="text-[11px] text-yellow-300 mt-1">
                        lifecycle: {r.campaignLifecycle}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-gray-200 space-y-1">
                      <div>Status: {r.status}</div>
                      <div>Option: {r.option || "custom"}</div>
                      <div>Placement: {r.placement || "—"}</div>
                      <div>Budget: {r.budget || "—"}</div>
                      <div>Timeline: {r.timeline || "—"}</div>
                      <div>
                        Deposit:{" "}
                        <span
                          className={
                            r.depositPaid ? "text-green-300" : "text-yellow-300"
                          }
                        >
                          {r.depositPaid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-gray-300">
                      <div>IP: {r.trustSignals?.ip || "—"}</div>
                      <div
                        className="truncate max-w-[220px]"
                        title={r.trustSignals?.userAgent || ""}
                      >
                        UA: {r.trustSignals?.userAgent || "—"}
                      </div>
                      <div>
                        Email dupes: {r.trustSignals?.duplicateEmailCount ?? 0}
                      </div>
                      <div>
                        IP dupes: {r.trustSignals?.duplicateIpCount ?? 0}
                      </div>
                      {(r.trustSignals?.flags || []).length ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(r.trustSignals?.flags || []).map((f) => (
                            <span
                              key={f}
                              className="rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-200"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-3 text-xs text-gray-200">
                      <div className="font-semibold capitalize">
                        {r.reviewStatus || "pending"}
                      </div>
                      {r.reviewedAt ? (
                        <div className="text-gray-400 mt-1">
                          {new Date(r.reviewedAt).toLocaleString()}
                        </div>
                      ) : null}
                      {r.reviewedBy ? (
                        <div className="text-gray-500">by {r.reviewedBy}</div>
                      ) : null}
                      <textarea
                        className="mt-2 w-full rounded border border-gray-700 bg-gray-900 p-1.5 text-[11px]"
                        rows={2}
                        placeholder="Internal admin note / reason"
                        value={noteDrafts[r._id] ?? r.adminNote ?? ""}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [r._id]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <button
                          disabled={savingId === r._id}
                          onClick={() => applyReviewAction(r, "approved")}
                          className="rounded bg-emerald-600/80 px-2 py-1 font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          disabled={savingId === r._id}
                          onClick={() => applyReviewAction(r, "rejected")}
                          className="rounded bg-orange-600/80 px-2 py-1 font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          disabled={savingId === r._id}
                          onClick={() => applyReviewAction(r, "spam")}
                          className="rounded bg-rose-700/80 px-2 py-1 font-semibold"
                        >
                          Mark Spam
                        </button>
                        <button
                          disabled={savingId === r._id}
                          onClick={() => hardDelete(r)}
                          className="rounded bg-red-700/80 px-2 py-1 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-gray-300">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString()
                        : "—"}
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
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/admin/advertising-requests",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      isAdmin?: boolean;
    };

    if (!(payload.isAdmin === true || payload.accountType === "admin")) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/advertising-requests",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/advertising-requests",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
