import Link from "next/link";
import { useEffect, useState } from "react";
export default function My() {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/support/my-tickets", { credentials: "include" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setErr(d.message || "Login required");
          return;
        }
        setRows(d.rows || []);
      })
      .catch(() => setErr("Login required"));
  }, []);
  if (err)
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <p>{err}</p>
        <Link href="/login" className="underline text-yellow-300">
          Login
        </Link>
      </main>
    );
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-3">My Tickets</h1>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-zinc-400">
              <th className="p-2 text-left">Ticket</th>
              <th className="p-2 text-left">Subject</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.ticketId} className="border-t border-zinc-800">
                <td className="p-2">
                  <Link
                    className="underline text-yellow-300"
                    href={`/support/tickets/${encodeURIComponent(r.ticketId)}`}
                  >
                    {r.ticketId}
                  </Link>
                </td>
                <td className="p-2">{r.subject}</td>
                <td className="p-2">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
