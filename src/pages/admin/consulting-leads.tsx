import { useEffect, useState } from "react";
import Link from "next/link";

type Lead = {
  _id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  source?: string;
  intakeType?: string;
  createdAt?: string | null;
};

export default function ConsultingLeadsAdminPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/consulting-interests", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load leads");
        setRows(Array.isArray(data?.interests) ? data.interests : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load leads");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-black text-[#D4AF37]">Consulting Leads</h1>
          <Link href="/admin/dashboard" className="text-sm text-[#D4AF37] hover:underline">
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
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="p-2 text-white/60" colSpan={7}>
                      No consulting leads yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r._id} className="border-t border-white/10 align-top">
                      <td className="p-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                      <td className="p-2">{r.name || "-"}</td>
                      <td className="p-2">{r.businessName || "-"}</td>
                      <td className="p-2">{r.email || "-"}</td>
                      <td className="p-2">{r.service || "-"}</td>
                      <td className="p-2">{r.source || r.intakeType || "-"}</td>
                      <td className="p-2">{r.status || "new"}</td>
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
