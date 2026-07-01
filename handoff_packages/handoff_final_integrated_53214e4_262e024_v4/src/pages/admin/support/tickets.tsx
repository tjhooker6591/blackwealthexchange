import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function TicketsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [search, setSearch] = useState("");
  const [unassigned, setUnassigned] = useState(false);
  const [escalated, setEscalated] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams({
      status,
      category,
      priority,
      assignedTo,
      search,
      unassigned: unassigned ? "1" : "",
      escalated: escalated ? "1" : "",
    });
    fetch(`/api/admin/support?${q.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []));
  }, [status, category, priority, assignedTo, search, unassigned, escalated]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-[96rem] mx-auto space-y-3">
        <h1 className="text-3xl text-yellow-400 font-bold">Support Tickets</h1>
        <div className="grid md:grid-cols-4 gap-2">
          <input
            className="p-2 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <input
            className="p-2 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          <input
            className="p-2 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            className="p-2 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="Assigned to"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
          <input
            className="p-2 bg-zinc-900 border border-zinc-700 rounded md:col-span-2"
            placeholder="Search ticket/email/subject/related IDs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={unassigned}
              onChange={(e) => setUnassigned(e.target.checked)}
            />
            Unassigned
          </label>
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={escalated}
              onChange={(e) => setEscalated(e.target.checked)}
            />
            Escalated
          </label>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-zinc-400">
                <th className="p-2 text-left">Ticket ID</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Priority</th>
                <th className="p-2 text-left">Category</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Assigned</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Updated</th>
                <th className="p-2 text-left">Age/SLA</th>
                <th className="p-2 text-left">Last Reply</th>
                <th className="p-2 text-left">Needs Response</th>
                <th className="p-2 text-left">Subject</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.ticketId} className="border-t border-zinc-800">
                  <td className="p-2">
                    <Link
                      className="underline text-yellow-300"
                      href={`/admin/support/tickets/${encodeURIComponent(r.ticketId)}`}
                    >
                      {r.ticketId}
                    </Link>
                  </td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.priority}</td>
                  <td className="p-2">{r.category}</td>
                  <td className="p-2">
                    {r.name || "-"}
                    <br />
                    {r.email || "-"}
                  </td>
                  <td className="p-2">{r.assignedTo || "-"}</td>
                  <td className="p-2">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-2">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "-"}
                  </td>
                  <td className="p-2">
                    {r.ageHours ?? "-"}h/{r.sla}
                  </td>
                  <td className="p-2">{r.lastReplyDirection || "-"}</td>
                  <td className="p-2">{r.needsResponse ? "YES" : "NO"}</td>
                  <td className="p-2">{r.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/support/tickets",
);
