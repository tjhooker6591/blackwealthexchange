import { useRouter } from "next/router";
import { useEffect, useState } from "react";
export default function T() {
  const r = useRouter();
  const id = String(r.query.id || "");
  const [t, setT] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!id || !email) return;
    fetch(
      `/api/support/tickets/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`,
    )
      .then((x) => x.json())
      .then((d) => setT(d.ticket));
  }, [id, email]);
  async function reply() {
    await fetch(`/api/support/tickets/${encodeURIComponent(id)}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, message: msg }),
    });
    setMsg("");
  }
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto space-y-3">
        <h1 className="text-2xl font-bold text-yellow-400">Ticket Detail</h1>
        <input
          className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded"
          placeholder="Email used on ticket"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {t ? (
          <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-1 text-sm">
            <div>
              <b>{t.ticketId}</b>
            </div>
            <div>{t.subject}</div>
            <div>
              {t.category} • {t.priority}
            </div>
            <div>Status: {t.status}</div>
            <div>{t.message}</div>
          </div>
        ) : (
          <p className="text-zinc-400">Enter your email to view this ticket.</p>
        )}
        <textarea
          className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Add follow-up"
        />
        <button
          onClick={reply}
          className="px-3 py-2 bg-yellow-500 text-black rounded"
        >
          Send follow-up
        </button>
      </div>
    </main>
  );
}
