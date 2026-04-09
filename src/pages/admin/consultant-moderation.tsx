import { useEffect, useState } from "react";
import Link from "next/link";

type QueueItem = {
  id: string;
  eventType: string;
  consultantId: string;
  employerId: string;
  moderationReasons: string[];
  source: string;
  sourceVariant: string;
  pageRoute: string;
  createdAt: string | null;
};

export default function ConsultantModerationPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/consultant-moderation-queue", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load queue");
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load queue");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              Admin moderation
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">
              Consultant Request Moderation Queue
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Blocked/flagged employer-to-consultant request events for review.
            </p>
          </div>
          <Link href="/admin/dashboard" className="text-sm text-cyan-200 underline">
            Back to admin dashboard
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-zinc-300">Loading moderation queue...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-300">
            No blocked/flagged request events found.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-zinc-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-100">{item.eventType}</p>
                  <span className="rounded-full border border-amber-400/40 px-2 py-1 text-[11px] text-amber-200">
                    {item.sourceVariant || "unknown"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">
                  Reasons: {item.moderationReasons.length ? item.moderationReasons.join(", ") : "none recorded"}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Employer: {item.employerId || "n/a"} • Consultant: {item.consultantId || "n/a"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Route: {item.pageRoute || "n/a"} • {item.createdAt ? new Date(item.createdAt).toLocaleString() : "unknown"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
