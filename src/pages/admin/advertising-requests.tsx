import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  _id: string;
  status: string;
  paymentStatus: string;
  depositPaid: boolean;
  name: string;
  business: string;
  email: string;
  option: string | null;
  durationDays: number | null;
  placement: string | null;
  selectedOptions: string[];
  budget: string | null;
  timeline: string | null;
  details: string;
  createdAt: string | null;
  paidAt: string | null;
};

export default function AdvertisingRequestsAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/advertising-requests", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data?.error || "Failed to load advertising requests");
        if (mounted)
          setRows(Array.isArray(data?.requests) ? data.requests : []);
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

  const filtered = useMemo(() => {
    if (filter === "paid") return rows.filter((r) => r.depositPaid);
    if (filter === "unpaid") return rows.filter((r) => !r.depositPaid);
    return rows;
  }, [rows, filter]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gold">
              Advertising Requests
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Custom campaign requests with deposit visibility for sales
              follow-up.
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

        <div className="mb-4 flex gap-2">
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
                  <th className="p-3">Business</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Option / Placement</th>
                  <th className="p-3">Budget/Timeline</th>
                  <th className="p-3">Deposit</th>
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
                      <div className="text-xs text-gray-400">{r.status}</div>
                    </td>
                    <td className="p-3">
                      <div>{r.name || "—"}</div>
                      <div className="text-xs text-gray-400">
                        {r.email || "—"}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-gray-200 space-y-1">
                      <div>Option: {r.option || "custom"}</div>
                      <div>Duration: {r.durationDays ? `${r.durationDays} days` : "—"}</div>
                      <div>Placement: {r.placement || "—"}</div>
                      {(r.selectedOptions || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {(r.selectedOptions || []).map((o) => (
                            <span
                              key={o}
                              className="rounded bg-black/40 border border-gray-700 px-2 py-0.5 text-xs"
                            >
                              {o}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-3 text-xs text-gray-300">
                      <div>Budget: {r.budget || "—"}</div>
                      <div>Timeline: {r.timeline || "—"}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${r.depositPaid ? "bg-green-600 text-black" : "bg-yellow-600 text-black"}`}
                      >
                        {r.depositPaid ? "Paid" : "Unpaid"}
                      </span>
                      {r.paidAt ? (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(r.paidAt).toLocaleString()}
                        </div>
                      ) : null}
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
