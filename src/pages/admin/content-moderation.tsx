import React, { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Row = {
  targetType: string;
  targetId: string;
  title: string;
  status: string;
  updatedAt?: string;
};

export default function ContentModeration() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/content-moderation/queue", {
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || "Failed to load moderation queue");
      setLoading(false);
      return;
    }
    setItems(Array.isArray(json.items) ? json.items : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (row: Row, action: string) => {
    const r = (reason[row.targetId] || "").trim();
    if (!r) {
      setError("Reason required");
      return;
    }
    setSaving(row.targetId);
    const res = await fetch("/api/admin/content-moderation/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        targetType: row.targetType,
        targetId: row.targetId,
        action,
        reason: r,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json?.error || "Action failed");
    await load();
    setSaving("");
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gold mb-1">
              Content Moderation
            </h1>
            <p className="text-sm text-gray-400">
              Review flagged content and apply audited moderation actions.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs">
          <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200">
            Queue items: {items.length}
          </span>
          <button
            onClick={load}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200 hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mb-3 rounded border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
            Loading moderation queue…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
            No moderation items are currently awaiting admin action.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((row) => (
              <div
                key={row.targetType + row.targetId}
                className="border border-gray-800 rounded p-3 bg-gray-900"
              >
                <div className="text-sm">
                  <span className="text-gold">{row.targetType}</span> •{" "}
                  {row.title} • status: {row.status}
                </div>
                <input
                  className="mt-2 w-full bg-black border border-gray-700 rounded px-2 py-1 text-sm"
                  placeholder="reason (required)"
                  value={reason[row.targetId] || ""}
                  onChange={(e) =>
                    setReason((prev) => ({
                      ...prev,
                      [row.targetId]: e.target.value,
                    }))
                  }
                />
                <div className="mt-2 flex gap-2">
                  <button
                    disabled={saving === row.targetId}
                    onClick={() => act(row, "approve")}
                    className="px-2 py-1 rounded bg-emerald-600 text-black text-sm"
                  >
                    Approve
                  </button>
                  <button
                    disabled={saving === row.targetId}
                    onClick={() => act(row, "reject")}
                    className="px-2 py-1 rounded bg-orange-600 text-black text-sm"
                  >
                    Reject
                  </button>
                  <button
                    disabled={saving === row.targetId}
                    onClick={() => act(row, "remove")}
                    className="px-2 py-1 rounded bg-red-600 text-black text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/content-moderation",
);
