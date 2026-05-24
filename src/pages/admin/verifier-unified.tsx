import React, { useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function UnifiedVerifierPage() {
  const [filters, setFilters] = useState({
    email: "",
    userId: "",
    stripeSessionId: "",
    paymentIntentId: "",
    itemId: "",
  });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(
      ([k, v]) => v.trim() && qs.set(k, v.trim()),
    );
    const res = await fetch(`/api/admin/verifier/unified?${qs.toString()}`, {
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || "Failed");
      setLoading(false);
      return;
    }
    setItems(Array.isArray(json?.items) ? json.items : []);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gold mb-1">
              Unified Paid → Fulfilled → Entitled Verifier
            </h1>
            <p className="text-sm text-gray-400">
              Investigate payment-to-fulfillment-to-entitlement continuity for
              support and operations debugging.
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
            Results: {items.length}
          </span>
        </div>

        <div className="grid md:grid-cols-5 gap-2">
          {Object.entries(filters).map(([k, v]) => (
            <input
              key={k}
              value={v}
              onChange={(e) =>
                setFilters((p) => ({ ...p, [k]: e.target.value }))
              }
              placeholder={k}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm"
            />
          ))}
        </div>
        <button
          onClick={run}
          className="mt-3 bg-gold text-black px-3 py-2 rounded text-sm"
        >
          {loading ? "Running..." : "Run Verification"}
        </button>
        {error ? (
          <div className="mt-2 rounded border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <div className="mt-4 space-y-2">
          {!loading && !error && items.length === 0 ? (
            <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
              No verifier records match the current filters.
            </div>
          ) : null}
          {items.map((it, idx) => (
            <pre
              key={idx}
              className="bg-gray-900 border border-gray-800 rounded p-3 text-xs overflow-x-auto"
            >
              {JSON.stringify(it, null, 2)}
            </pre>
          ))}
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/verifier-unified",
);
