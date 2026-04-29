import { useState } from "react";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Submitting...");
    const r = await fetch("/api/support/create-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description, email }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d?.message || "Failed to submit ticket");
      return;
    }
    setMsg(`Ticket submitted: ${d.ticketId}`);
    setSubject("");
    setDescription("");
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-yellow-400">Support</h1>
        <p className="text-zinc-300">Create a support ticket.</p>
        <form onSubmit={submit} className="space-y-3 rounded border border-zinc-800 p-4 bg-zinc-950">
          <input className="w-full bg-zinc-900 border border-zinc-700 rounded p-2" placeholder="Email (optional)" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full bg-zinc-900 border border-zinc-700 rounded p-2" placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} required />
          <textarea className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 min-h-32" placeholder="Describe your issue" value={description} onChange={(e)=>setDescription(e.target.value)} required />
          <button className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold" type="submit">Submit Ticket</button>
        </form>
        {msg && <p className="text-sm text-zinc-300">{msg}</p>}
      </div>
    </main>
  );
}
