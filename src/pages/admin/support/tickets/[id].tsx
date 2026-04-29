import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function TicketDetailPage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const [t, setT] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/support/${encodeURIComponent(id)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setT(d.ticket); setStatus(d.ticket?.status || "new"); });
  }, [id]);

  async function save() {
    await fetch(`/api/admin/support/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, internalNote: note }),
    });
    location.reload();
  }

  if (!t) return <main className="min-h-screen bg-black text-white p-8">Loading...</main>;
  return <main className="min-h-screen bg-black text-white p-8"><div className="max-w-3xl mx-auto space-y-3"><h1 className="text-3xl text-yellow-400 font-bold">{t.ticketId}</h1><div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-sm space-y-1"><div>Category: {t.category}</div><div>Priority: {t.priority}</div><div>Status: {t.status}</div><div>Subject: {t.subject}</div><div>Message: {t.message}</div><div>Order: {t.relatedOrderId || "-"}</div><div>Payment: {t.relatedPaymentId || "-"}</div><div>Business: {t.relatedBusinessId || "-"}</div><div>Product: {t.relatedProductId || "-"}</div></div><div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-2"><input className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded" value={status} onChange={e=>setStatus(e.target.value)} /><textarea className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded min-h-24" value={note} onChange={e=>setNote(e.target.value)} placeholder="Internal note" /><button onClick={save} className="px-3 py-2 bg-yellow-500 text-black rounded">Update Ticket</button></div></div></main>;
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps("/admin/support/tickets/[id]");
