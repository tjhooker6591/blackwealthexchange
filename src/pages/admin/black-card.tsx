import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type RedemptionItem = {
  id: string;
  userId: string;
  rewardType: string;
  pointsCost: number;
  status: string;
  createdAt: string | null;
};

export default function AdminBlackCardPage() {
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState("");
  const [pointsDelta, setPointsDelta] = useState("");
  const [reason, setReason] = useState("");
  const [adjustMsg, setAdjustMsg] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [queueUserId, setQueueUserId] = useState("");

  async function loadRedemptions() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (queueUserId) params.set("userId", queueUserId);

    const query = params.toString();
    const res = await fetch(`/api/admin/black-card/redemptions${query ? `?${query}` : ""}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error || "Unable to load redemptions");
      return;
    }
    setItems(Array.isArray(json.items) ? json.items : []);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadRedemptions();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(
    redemptionId: string,
    status: "approved" | "rejected" | "fulfilled",
  ) {
    const res = await fetch("/api/admin/black-card/redemptions", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redemptionId, status }),
    });
    if (res.ok) await loadRedemptions();
  }

  async function submitAdjust(e: FormEvent) {
    e.preventDefault();
    setAdjustMsg("");
    const res = await fetch("/api/admin/black-card/rewards-adjust", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        pointsDelta: Number(pointsDelta),
        reason,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAdjustMsg(json?.error || "Adjustment failed");
      return;
    }
    setAdjustMsg(`Adjusted successfully. New balance: ${json.balance}`);
    setUserId("");
    setPointsDelta("");
    setReason("");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-yellow-200">
            Admin • Black Card Ops
          </h1>
          <Link
            href="/admin/dashboard"
            className="rounded border border-white/20 px-3 py-1.5 text-sm"
          >
            Back to Admin
          </Link>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">
            Manual rewards adjustment
          </h2>
          <form
            onSubmit={submitAdjust}
            className="mt-3 grid gap-3 sm:grid-cols-4"
          >
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={pointsDelta}
              onChange={(e) => setPointsDelta(e.target.value)}
              placeholder="Points Delta"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <button className="rounded bg-yellow-500 px-3 py-2 text-sm font-semibold text-black">
              Submit
            </button>
          </form>
          {adjustMsg ? (
            <p className="mt-2 text-sm text-yellow-200">{adjustMsg}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">
            Redemption review queue
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded bg-black/40 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
            <input value={queueUserId} onChange={(e) => setQueueUserId(e.target.value)} placeholder="Filter by user ID" className="rounded bg-black/40 px-3 py-2 text-sm" />
            <button onClick={() => loadRedemptions()} className="rounded border border-yellow-500/30 px-3 py-2 text-sm text-yellow-200">Apply filters</button>
            <button onClick={() => { setStatusFilter(""); setQueueUserId(""); setTimeout(() => loadRedemptions(), 0); }} className="rounded border border-white/20 px-3 py-2 text-sm text-white/85">Reset</button>
          </div>
          {loading ? (
            <p className="mt-3 text-sm text-white/70">Loading...</p>
          ) : error ? (
            <p className="mt-3 text-sm text-red-300">{error}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm"
                >
                  <div className="font-semibold">
                    {item.rewardType} • {item.pointsCost} pts
                  </div>
                  <div className="text-white/70">
                    user: {item.userId} • status: {item.status}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setStatus(item.id, "approved")}
                      className="rounded border border-yellow-500/30 px-2 py-1 text-xs text-yellow-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setStatus(item.id, "rejected")}
                      className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-200"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setStatus(item.id, "fulfilled")}
                      className="rounded border border-green-500/30 px-2 py-1 text-xs text-green-200"
                    >
                      Fulfilled
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 ? (
                <p className="text-sm text-white/70">
                  No redemptions in queue.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
