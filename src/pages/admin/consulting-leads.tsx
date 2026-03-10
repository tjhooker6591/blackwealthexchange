import { useEffect, useState } from "react";
import Link from "next/link";

type Lead = {
  _id: string;
  collection: "consulting_interest" | "consulting_intake";
  name: string;
  businessName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: "pending" | "approved" | "rejected" | "flagged" | string;
  source?: string;
  intakeType?: string;
  createdAt?: string | null;
};

export default function ConsultingLeadsAdminPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  async function loadRows() {
    const res = await fetch("/api/admin/consulting-interests", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to load leads");
    setRows(Array.isArray(data?.interests) ? data.interests : []);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadRows();
      } catch (e: any) {
        setError(e?.message || "Failed to load leads");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function updateStatus(
    lead: Lead,
    status: "pending" | "approved" | "rejected" | "flagged",
  ) {
    setSavingId(lead._id);
    try {
      const res = await fetch("/api/admin/consulting-interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: lead._id,
          collection: lead.collection,
          status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to update status");
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-black text-[#D4AF37]">
            Consulting Leads
          </h1>
          <Link
            href="/admin/dashboard"
            className="text-sm text-[#D4AF37] hover:underline"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        {loading ? <p className="text-white/70">Loading…</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-sm">
              <thead className="text-left text-white/60">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Business</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Source</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="p-2 text-white/60" colSpan={8}>
                      No consulting leads yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r._id}
                      className="border-t border-white/10 align-top"
                    >
                      <td className="p-2">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2">{r.name || "-"}</td>
                      <td className="p-2">{r.businessName || "-"}</td>
                      <td className="p-2">{r.email || "-"}</td>
                      <td className="p-2">{r.service || "-"}</td>
                      <td className="p-2">{r.source || r.intakeType || "-"}</td>
                      <td className="p-2">{r.status || "new"}</td>
                      <td className="p-2">
                        <select
                          className="rounded border border-white/20 bg-black px-2 py-1 text-xs"
                          value={r.status || "pending"}
                          disabled={savingId === r._id}
                          onChange={(e) =>
                            updateStatus(
                              r,
                              e.target.value as
                                | "pending"
                                | "approved"
                                | "rejected"
                                | "flagged",
                            )
                          }
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="flagged">flagged</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </main>
  );
}
