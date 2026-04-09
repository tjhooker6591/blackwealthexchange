import { useEffect, useState } from "react";
import Link from "next/link";

export default function ConsultantRequestInboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/consultants/contact-requests", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load inbox");
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load inbox");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Consultant inbox</p>
            <h1 className="mt-2 text-3xl font-extrabold">Employer Requests</h1>
            <p className="mt-2 text-sm text-zinc-300">View employer contact and interview requests tied to your consultant profile.</p>
          </div>
          <Link href="/dashboard/consultant/profile" className="text-sm text-cyan-200 underline">Back to profile</Link>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">{error}</div> : null}

        {loading ? (
          <p className="text-zinc-300">Loading requests...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-300">No requests yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <article key={r.id} className="rounded-xl border border-white/10 bg-zinc-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-100">
                    {r.requestType === "interview_request"
                      ? "Interview request"
                      : "Contact request"}
                  </p>
                  <span className="rounded-full border border-cyan-400/40 px-2 py-1 text-[11px] text-cyan-200">
                    Moderation: {r.moderationStatus}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{r.message}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  From: {r.employerEmail || "Employer"} • {new Date(r.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
