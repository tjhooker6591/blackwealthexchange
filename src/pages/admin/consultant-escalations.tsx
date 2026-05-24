import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type EscalationItem = {
  id: string;
  requestId: string | null;
  status: "open" | "in_review" | "closed" | string;
  escalationNote: string;
  resolutionNote: string;
  escalatedBy: string;
  actedBy: string;
  escalatedAt: string | null;
  actedAt: string | null;
  updatedAt: string | null;
};

export default function ConsultantEscalationsPage() {
  const [items, setItems] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<
    Record<string, string>
  >({});
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(
        `/api/admin/consultant-escalations${params.toString() ? `?${params.toString()}` : ""}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to load escalations",
        );
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load escalations",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateEscalation(
    item: EscalationItem,
    status: "open" | "in_review" | "closed",
  ) {
    setBusyId(item.id);
    setError("");
    setSuccess("");
    try {
      const resolutionNote = resolutionNotes[item.id] || "";
      const res = await fetch("/api/admin/consultant-escalations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          escalationId: item.id,
          status,
          resolutionNote,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to update escalation",
        );
      setSuccess(`Escalation moved to ${status.replace("_", " ")}.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update escalation",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              Admin escalation workflow
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">
              Consultant Moderation Escalations
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Manage escalated consultant request incidents through review and
              closure.
            </p>
          </div>
          <Link
            href="/admin/consultant-moderation"
            className="text-sm text-cyan-200 underline"
          >
            Back to moderation queue
          </Link>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 p-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-white/10 bg-black px-3 py-2 text-sm text-white"
          >
            <option value="">All statuses</option>
            <option value="open">open</option>
            <option value="in_review">in_review</option>
            <option value="closed">closed</option>
          </select>
          <button
            onClick={() => void load()}
            className="rounded border border-cyan-400/40 px-3 py-2 text-sm text-cyan-200"
          >
            Apply filter
          </button>
        </div>

        {success ? (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {success}
          </div>
        ) : null}

        {loading ? (
          <p className="text-zinc-300">Loading escalations...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-300">
            No consultant escalation records match the current filters.
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
                    Request ID: {item.requestId || "n/a"}
                  </p>
                  <span className="rounded-full border border-amber-400/40 px-2 py-1 text-[11px] text-amber-200">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">
                  Escalation note: {item.escalationNote || "(none)"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Escalated by: {item.escalatedBy || "n/a"} •{" "}
                  {item.escalatedAt
                    ? new Date(item.escalatedAt).toLocaleString()
                    : "unknown"}
                </p>
                {item.resolutionNote ? (
                  <p className="mt-1 text-xs text-zinc-400">
                    Resolution: {item.resolutionNote}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <textarea
                    value={resolutionNotes[item.id] || ""}
                    onChange={(e) =>
                      setResolutionNotes((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    placeholder="Resolution note (required to close)"
                    className="min-h-[56px] min-w-[320px] flex-1 rounded border border-white/10 bg-black px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={busyId === item.id}
                    onClick={() => void updateEscalation(item, "open")}
                    className="rounded border border-white/30 px-2 py-1 text-xs text-white disabled:opacity-40"
                  >
                    Mark Open
                  </button>
                  <button
                    disabled={busyId === item.id}
                    onClick={() => void updateEscalation(item, "in_review")}
                    className="rounded border border-amber-400/40 px-2 py-1 text-xs text-amber-200 disabled:opacity-40"
                  >
                    Mark In Review
                  </button>
                  <button
                    disabled={busyId === item.id}
                    onClick={() => void updateEscalation(item, "closed")}
                    className="rounded border border-emerald-400/40 px-2 py-1 text-xs text-emerald-200 disabled:opacity-40"
                  >
                    Close
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
  "/admin/consultant-escalations",
);
