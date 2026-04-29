import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function TicketsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    const q = new URLSearchParams({ status, category, priority });
    fetch(`/api/admin/support?${q.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []));
  }, [status, category, priority]);

  return <main className="min-h-screen bg-black text-white p-8"><div className="max-w-6xl mx-auto space-y-3"><h1 className="text-3xl text-yellow-400 font-bold">Support Tickets</h1><div className="grid md:grid-cols-3 gap-2"><input className="p-2 bg-zinc-900 border border-zinc-700 rounded" placeholder="status" value={status} onChange={e=>setStatus(e.target.value)} /><input className="p-2 bg-zinc-900 border border-zinc-700 rounded" placeholder="category" value={category} onChange={e=>setCategory(e.target.value)} /><input className="p-2 bg-zinc-900 border border-zinc-700 rounded" placeholder="priority" value={priority} onChange={e=>setPriority(e.target.value)} /></div><div className="rounded border border-zinc-800 bg-zinc-950 p-4"><table className="min-w-full text-sm"><thead><tr className="text-zinc-400"><th className="text-left p-2">Ticket</th><th className="text-left p-2">Category</th><th className="text-left p-2">Priority</th><th className="text-left p-2">Status</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.ticketId} className="border-t border-zinc-800"><td className="p-2"><Link className="underline text-yellow-300" href={`/admin/support/tickets/${encodeURIComponent(r.ticketId)}`}>{r.ticketId}</Link></td><td className="p-2">{r.category}</td><td className="p-2">{r.priority}</td><td className="p-2">{r.status}</td></tr>)}</tbody></table></div></div></main>;
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps("/admin/support/tickets");
