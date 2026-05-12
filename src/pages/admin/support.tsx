import type { GetServerSideProps } from "next";
import { requireAdminPageProps } from "@/lib/adminPageGuard";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const adminNavLinks = [
  ["Command Center", "/admin/command-center"],
  ["Financial Review", "/admin/financial-review"],
  ["Dashboard", "/admin/dashboard"],
  ["Support", "/admin/support"],
  ["Revenue", "/admin/revenue"],
  ["Growth", "/admin/growth"],
  ["Partnerships", "/admin/partnerships"],
] as const;

function AdminHubNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {adminNavLinks.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="text-xs border border-zinc-700 px-3 py-1.5 rounded"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
export default function AdminSupportPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    const q = new URLSearchParams({ status, category, priority });
    fetch(`/api/admin/support?${q.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d?.rows || []))
      .catch(() => setRows([]));
  }, [status, category, priority]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <AdminHubNav />

        {router.query.source === "command-center" ? (
          <div className="rounded border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            Opened from Command Center
            {router.query.focus
              ? ` • Focus: ${String(router.query.focus)}`
              : ""}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">
            Admin Support Operations
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin/support-review"
              className="text-sm border border-zinc-700 px-3 py-2 rounded"
            >
              Support Review
            </Link>
            <Link
              href="/admin/dashboard"
              className="text-sm border border-zinc-700 px-3 py-2 rounded"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        <section className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm">
          <span className="text-zinc-300 mr-3">Related actions:</span>
          <Link
            href="/admin/revenue?source=command-center&focus=support-impact"
            className="underline text-yellow-300"
          >
            View related revenue impact
          </Link>
        </section>

        <div className="grid md:grid-cols-3 gap-2">
          <input
            className="p-2 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <input
            className="p-2 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            className="p-2 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-zinc-400">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Ticket</th>
                <th className="text-left p-2">Subject</th>
                <th className="text-left p-2">Category</th>
                <th className="text-left p-2">Priority</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Assigned</th>
                <th className="text-left p-2">Escalation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.ticketId || String(i)}
                  className="border-t border-zinc-800"
                >
                  <td className="p-2">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-2">
                    <Link
                      className="underline text-yellow-300"
                      href={`/admin/support/tickets/${encodeURIComponent(r.ticketId)}`}
                    >
                      {r.ticketId}
                    </Link>
                  </td>
                  <td className="p-2">{r.subject || "-"}</td>
                  <td className="p-2">{r.category || "-"}</td>
                  <td className="p-2">{r.priority || "normal"}</td>
                  <td className="p-2">{r.status || "new"}</td>
                  <td className="p-2">{r.assignedTo || "-"}</td>
                  <td className="p-2">{r.escalationLevel || "none"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/support");
