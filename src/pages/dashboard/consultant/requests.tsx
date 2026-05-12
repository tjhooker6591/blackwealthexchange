import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Waiting on consultant response",
  accepted: "Accepted by consultant",
  declined: "Declined by consultant",
  more_info_requested: "More info requested",
  under_admin_review: "Under admin review",
  rejected: "Rejected",
};

const STATUS_NEXT_STEP: Record<string, string> = {
  submitted: "Choose Accept, Decline, or Request info.",
  accepted: "Employer should follow up with scheduling details.",
  declined: "No further action required unless employer retries.",
  more_info_requested: "Wait for employer clarification.",
  under_admin_review: "Admin moderation team is reviewing this request.",
  rejected: "Request is closed by moderation.",
};

export default function ConsultantRequestInboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>(
    {},
  );

  async function loadInbox() {
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
  }

  useEffect(() => {
    void loadInbox();
  }, []);

  async function respondToRequest(
    requestId: string,
    action: "accept" | "decline" | "request_more_info",
  ) {
    setBusyId(requestId);
    setActionMessage("");
    try {
      const res = await fetch("/api/consultants/contact-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requestId,
          action,
          note: (responseNotes[requestId] || "").trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update request");

      setItems((prev) =>
        prev.map((x) =>
          x.id === requestId
            ? {
                ...x,
                status: data?.status || x.status,
                consultantResponseAction: action,
                consultantRespondedAt: new Date().toISOString(),
              }
            : x,
        ),
      );
      setActionMessage("Request updated.");
      setResponseNotes((prev) => ({ ...prev, [requestId]: "" }));
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Failed to update request",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              Consultant inbox
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">Employer Requests</h1>
            <p className="mt-2 text-sm text-zinc-300">
              View employer contact and interview requests tied to your
              consultant profile.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void loadInbox()}
              className="rounded border border-white/20 px-2 py-1 text-xs text-zinc-200"
            >
              Refresh inbox
            </button>
            <Link
              href="/dashboard/consultant/profile"
              className="text-sm text-cyan-200 underline"
            >
              Back to profile
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mb-4 rounded-lg border border-cyan-700/40 bg-cyan-950/30 p-3 text-sm text-cyan-100">
            {actionMessage}
          </div>
        ) : null}

        {loading ? (
          <p className="text-zinc-300">Loading requests...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-300">
            No requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <article
                key={r.id}
                className="rounded-xl border border-white/10 bg-zinc-950 p-4"
              >
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
                  From: {r.employerEmail || "Employer"} •{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => void respondToRequest(r.id, "accept")}
                    disabled={busyId === r.id || r.status === "accepted"}
                    className="rounded border border-emerald-400/50 px-2 py-1 text-xs text-emerald-200 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => void respondToRequest(r.id, "decline")}
                    disabled={busyId === r.id || r.status === "declined"}
                    className="rounded border border-red-400/50 px-2 py-1 text-xs text-red-200 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() =>
                      void respondToRequest(r.id, "request_more_info")
                    }
                    disabled={
                      busyId === r.id || r.status === "more_info_requested"
                    }
                    className="rounded border border-amber-400/50 px-2 py-1 text-xs text-amber-200 disabled:opacity-50"
                  >
                    Request info
                  </button>
                  <span className="rounded-full border border-white/20 px-2 py-1 text-xs text-zinc-200">
                    Status:{" "}
                    {STATUS_LABELS[String(r.status || "submitted")] ||
                      String(r.status || "submitted").replace("_", " ")}
                  </span>
                </div>

                {r.consultantResponseNote ? (
                  <p className="mt-2 text-xs text-cyan-100/90">
                    Last response note: {r.consultantResponseNote}
                  </p>
                ) : null}

                <div className="mt-2 text-[11px] text-zinc-500">
                  Responded:{" "}
                  {r.consultantRespondedAt
                    ? new Date(r.consultantRespondedAt).toLocaleString()
                    : "Not yet"}
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Next step:{" "}
                  {STATUS_NEXT_STEP[String(r.status || "submitted")] ||
                    "Follow request lifecycle updates."}
                </p>

                <label className="mt-3 block text-xs text-zinc-300">
                  Optional response note
                  <textarea
                    value={responseNotes[r.id] || ""}
                    onChange={(e) =>
                      setResponseNotes((prev) => ({
                        ...prev,
                        [r.id]: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Add scheduling details, conditions, or next-step context"
                    className="mt-1 w-full rounded border border-white/10 bg-black px-2 py-1 text-xs"
                  />
                </label>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
