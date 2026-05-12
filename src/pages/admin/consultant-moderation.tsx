import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type QueueItem = {
  id: string;
  requestId?: string | null;
  eventType: string;
  consultantId: string;
  employerId: string;
  moderationReasons: string[];
  source: string;
  sourceVariant: string;
  pageRoute: string;
  createdAt: string | null;
  requestMessage?: string;
  requestStatus?: string | null;
  requestModerationStatus?: string | null;
  adminDisposition?: string | null;
  adminDispositionNote?: string;
  adminDispositionBy?: string | null;
  adminDispositionAt?: string | null;
};

export default function ConsultantModerationPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonFilter, setReasonFilter] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (reasonFilter) params.set("reason", reasonFilter);

      const res = await fetch(
        `/api/admin/consultant-moderation-queue${params.toString() ? `?${params.toString()}` : ""}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || data?.error || "Failed to load queue");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function moderate(
    item: QueueItem,
    disposition: "resolved" | "escalated" | "rejected",
  ) {
    if (!item.requestId) return;
    setBusyId(item.id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/consultant-moderation-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requestId: item.requestId,
          disposition,
          note: notes[item.id] || "",
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to update request",
        );
      setSuccess(`Request ${disposition}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request");
    } finally {
      setBusyId(null);
    }
  }

  const unresolvedCount = items.filter((x) => !x.adminDisposition).length;
  const escalatedCount = items.filter(
    (x) => x.adminDisposition === "escalated",
  ).length;
  const rejectedCount = items.filter(
    (x) => x.adminDisposition === "rejected",
  ).length;

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
          <div className="flex flex-col items-end gap-1">
            <Link
              href="/admin/dashboard"
              className="text-sm text-cyan-200 underline"
            >
              Back to admin dashboard
            </Link>
            <Link
              href="/admin/consultant-escalations"
              className="text-sm text-amber-200 underline"
            >
              View escalations
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 p-3">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="rounded border border-white/10 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="">All reasons</option>
            <option value="blocked_term">blocked_term</option>
            <option value="too_many_links">too_many_links</option>
            <option value="repeated_characters">repeated_characters</option>
            <option value="excessive_caps">excessive_caps</option>
          </select>
          <button
            onClick={() => void load()}
            className="rounded border border-cyan-400/40 px-3 py-2 text-sm text-cyan-200"
          >
            Apply filter
          </button>
          <button
            onClick={() => {
              setReasonFilter("");
              setTimeout(() => void load(), 0);
            }}
            className="rounded border border-white/20 px-3 py-2 text-sm text-white/85"
          >
            Reset
          </button>
        </div>

        {success ? (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {success}
          </div>
        ) : null}

        <section className="mb-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Needs action
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {unresolvedCount}
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Escalated
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-200">
              {escalatedCount}
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-zinc-950 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Rejected
            </p>
            <p className="mt-1 text-2xl font-extrabold text-red-200">
              {rejectedCount}
            </p>
          </article>
        </section>

        {loading ? (
          <p className="text-zinc-300">Loading moderation queue...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-300">
            No blocked or flagged consultant request events match this view.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-white/10 bg-zinc-950 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-100">
                    {item.eventType}
                  </p>
                  <span className="rounded-full border border-amber-400/40 px-2 py-1 text-[11px] text-amber-200">
                    {item.sourceVariant || "unknown"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">
                  Reasons:{" "}
                  {item.moderationReasons.length
                    ? item.moderationReasons.join(", ")
                    : "none recorded"}
                </p>
                {item.requestMessage ? (
                  <p className="mt-2 rounded border border-white/10 bg-black/30 p-2 text-xs text-zinc-200">
                    Message preview: {item.requestMessage.slice(0, 280)}
                    {item.requestMessage.length > 280 ? "…" : ""}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-zinc-500">
                  Employer: {item.employerId || "n/a"} • Consultant:{" "}
                  {item.consultantId || "n/a"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Route: {item.pageRoute || "n/a"} •{" "}
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : "unknown"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                  <span className="rounded border border-white/15 px-2 py-0.5">
                    request:{" "}
                    {String(item.requestStatus || "unknown").replace("_", " ")}
                  </span>
                  <span className="rounded border border-white/15 px-2 py-0.5">
                    moderation:{" "}
                    {String(item.requestModerationStatus || "unknown").replace(
                      "_",
                      " ",
                    )}
                  </span>
                  {item.adminDisposition ? (
                    <span className="rounded border border-cyan-400/30 px-2 py-0.5 text-cyan-200">
                      disposition:{" "}
                      {String(item.adminDisposition).replace("_", " ")}
                    </span>
                  ) : null}
                </div>
                {item.adminDispositionNote ? (
                  <p className="mt-2 text-xs text-cyan-100/90">
                    Last disposition note: {item.adminDispositionNote}
                  </p>
                ) : null}
                <div className="mt-3">
                  <textarea
                    value={notes[item.id] || ""}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    placeholder="Action note (required for escalate/reject)"
                    className="min-h-[56px] w-full rounded border border-white/10 bg-black px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={!item.requestId || busyId === item.id}
                    onClick={() => void moderate(item, "resolved")}
                    className="rounded border border-emerald-400/40 px-2 py-1 text-xs text-emerald-200 disabled:opacity-40"
                  >
                    Resolve
                  </button>
                  <button
                    disabled={!item.requestId || busyId === item.id}
                    onClick={() => void moderate(item, "escalated")}
                    className="rounded border border-amber-400/40 px-2 py-1 text-xs text-amber-200 disabled:opacity-40"
                  >
                    Escalate
                  </button>
                  <button
                    disabled={!item.requestId || busyId === item.id}
                    onClick={() => void moderate(item, "rejected")}
                    className="rounded border border-red-400/40 px-2 py-1 text-xs text-red-200 disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/consultant-moderation",
);
