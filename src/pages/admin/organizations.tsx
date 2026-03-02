// src/pages/admin/organizations.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Org = {
  _id: string;
  name?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  status?: string;
  orgType?: string;
  source?: string;
  completenessScore?: number;
  missingFields?: string[];
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const DEFAULT_SOURCE = "church_seed_20260211_032803";

export default function AdminOrganizationsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("pending");
  const [orgType, setOrgType] = useState("church");
  const [source, setSource] = useState(DEFAULT_SOURCE);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [items, setItems] = useState<Org[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>("");

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (orgType.trim()) params.set("orgType", orgType.trim());
    if (source.trim()) params.set("source", source.trim());
    params.set("page", String(page));
    params.set("limit", String(limit));
    return params.toString();
  }, [q, status, orgType, source, page, limit]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setMsg("");
      try {
        const res = await fetch(`/api/searchOrganizations?${queryString}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load");
        if (!alive) return;

        setItems(data.items || []);
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
        setSelected({});
      } catch (e: any) {
        if (!alive) return;
        setMsg(e?.message || "Error loading organizations.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [queryString]);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) items.forEach((it) => it._id && (next[it._id] = true));
    setSelected(next);
  };

  const approveSelected = async () => {
    if (selectedIds.length === 0) return;
    setMsg("");
    try {
      const res = await fetch("/api/admin/organizations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Approve failed");
      setMsg(`Approved ${data.modifiedCount || 0} organizations.`);
      // refresh
      const refresh = await fetch(`/api/searchOrganizations?${queryString}`);
      const refreshed = await refresh.json();
      setItems(refreshed.items || []);
      setTotal(refreshed.total || 0);
      setHasMore(Boolean(refreshed.hasMore));
      setSelected({});
    } catch (e: any) {
      setMsg(e?.message || "Approve failed");
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold">
              Organizations Queue
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Review and approve organizations (church seed batch included).
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="bg-gray-800 hover:bg-gray-700 transition px-4 py-2 rounded"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search name/city/state..."
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />

            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="all">all</option>
            </select>

            <input
              value={orgType}
              onChange={(e) => {
                setPage(1);
                setOrgType(e.target.value);
              }}
              placeholder="orgType (e.g. church)"
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />

            <input
              value={source}
              onChange={(e) => {
                setPage(1);
                setSource(e.target.value);
              }}
              placeholder="source (seed batch id)"
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center justify-between mt-4 gap-3">
            <div className="text-sm text-gray-300">
              Total: <span className="text-gold font-semibold">{total}</span>
              <span className="mx-2">•</span>
              Page: <span className="text-gold font-semibold">{page}</span>
              <span className="mx-2">•</span>
              Limit:
              <select
                className="ml-2 bg-gray-900 border border-gray-700 rounded px-2 py-1"
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(parseInt(e.target.value, 10));
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={approveSelected}
                disabled={selectedIds.length === 0}
                className={cx(
                  "px-4 py-2 rounded font-semibold transition",
                  selectedIds.length === 0
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gold text-black hover:bg-yellow-400",
                )}
              >
                Approve Selected ({selectedIds.length})
              </button>
              <a
                className="px-4 py-2 rounded bg-gray-900 border border-gray-700 hover:bg-gray-700 transition"
                href={`/api/searchOrganizations?${queryString}`}
                target="_blank"
                rel="noreferrer"
              >
                Open API
              </a>
            </div>
          </div>

          {msg && (
            <div className="mt-3 p-2 rounded bg-gray-900 border border-gray-700 text-sm">
              {msg}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded p-4">
          {loading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-400">No results.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-300">
                    <th className="py-2 px-2">
                      <input
                        type="checkbox"
                        onChange={(e) => toggleAll(e.target.checked)}
                        checked={
                          items.length > 0 &&
                          selectedIds.length === items.length
                        }
                      />
                    </th>
                    <th className="py-2 px-2">Name</th>
                    <th className="py-2 px-2">City</th>
                    <th className="py-2 px-2">State</th>
                    <th className="py-2 px-2">Phone</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Score</th>
                    <th className="py-2 px-2">Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it._id} className="border-t border-gray-700">
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={Boolean(selected[it._id])}
                          onChange={(e) =>
                            setSelected((p) => ({
                              ...p,
                              [it._id]: e.target.checked,
                            }))
                          }
                        />
                      </td>
                      <td className="py-2 px-2 font-semibold text-gold">
                        {it.name || "--"}
                      </td>
                      <td className="py-2 px-2">{it.city || "--"}</td>
                      <td className="py-2 px-2">{it.state || "--"}</td>
                      <td className="py-2 px-2">{it.phone || "--"}</td>
                      <td className="py-2 px-2">{it.status || "--"}</td>
                      <td className="py-2 px-2">
                        {it.completenessScore ?? "--"}
                      </td>
                      <td className="py-2 px-2">
                        {(it.missingFields || []).join(", ") || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <button
              className="px-3 py-2 rounded bg-gray-900 border border-gray-700 hover:bg-gray-700 transition disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <button
              className="px-3 py-2 rounded bg-gray-900 border border-gray-700 hover:bg-gray-700 transition disabled:opacity-50"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
