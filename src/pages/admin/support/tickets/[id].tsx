import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function TicketDetailPage() {
  const router = useRouter();
  const id = String(router.query.id || "");
  const [t, setT] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [escalationLevel, setEscalationLevel] = useState("none");
  const [internalNote, setInternalNote] = useState("");
  const [publicReply, setPublicReply] = useState("");
  const [setWaiting, setSetWaiting] = useState(false);
  const [markResolved, setMarkResolved] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  async function load() {
    if (!id) return;
    const d = await fetch(`/api/admin/support/${encodeURIComponent(id)}`, {
      credentials: "include",
    }).then((r) => r.json());
    setT(d.ticket);
    setStatus(d.ticket?.status || "New");
    setAssignedTo(d.ticket?.assignedTo || "");
    setEscalationLevel(d.ticket?.escalationLevel || "none");
  }
  useEffect(() => {
    load();
  }, [id]);

  async function patch(extra: any = {}) {
    setSaveMsg("Saving...");
    const payload: any = {
      status,
      assignedTo,
      escalationLevel,
      internalNote,
      followUpMessage: publicReply,
      ...extra,
    };
    const r = await fetch(`/api/admin/support/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setSaveMsg(d?.error || "Update failed");
    setSaveMsg(
      d?.emailNotification?.attempted
        ? d?.emailNotification?.sent
          ? "Reply saved, email sent."
          : `Reply saved, email failed${d?.emailNotification?.error ? `: ${d.emailNotification.error}` : ""}`
        : "Ticket updated.",
    );
    setInternalNote("");
    setPublicReply("");
    await load();
  }

  if (!t)
    return (
      <main className="min-h-screen bg-black text-white p-8">Loading...</main>
    );

  const timeline = [
    { type: "ticket", at: t.createdAt, by: t.email, message: t.message },
    ...(t.publicReplies || []).map((x: any) => ({
      type: `public_${x.from}`,
      at: x.at,
      by: x.by || x.from,
      message: x.message,
    })),
    ...(t.internalNotes || []).map((x: any) => ({
      type: "internal",
      at: x.at,
      by: x.by,
      message: x.note,
    })),
    ...(t.emailEvents || []).map((x: any) => ({
      type: "email",
      at: x.at,
      by: x.by,
      message: `${x.type} ${x.sent ? "SENT" : "FAILED"} to ${x.to}${x.error ? ` (${x.error})` : ""}`,
    })),
  ].sort(
    (a: any, b: any) =>
      new Date(a.at || 0).getTime() - new Date(b.at || 0).getTime(),
  );

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-3xl text-yellow-400 font-bold">{t.ticketId}</h1>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm space-y-1">
            <div className="font-semibold">Customer information</div>
            <div>{t.name || "-"}</div>
            <div>{t.email || "-"}</div>
            <div>Account: {t.accountType || "-"}</div>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm space-y-1">
            <div className="font-semibold">Ticket summary</div>
            <div>Subject: {t.subject}</div>
            <div>Status: {t.status}</div>
            <div>Priority: {t.priority}</div>
            <div>Category: {t.category}</div>
            <div>
              Created:{" "}
              {t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}
            </div>
            <div>
              Updated:{" "}
              {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "-"}
            </div>
            <div>
              First response:{" "}
              {t.firstResponseAt
                ? new Date(t.firstResponseAt).toLocaleString()
                : "-"}
            </div>
            <div>
              Resolved:{" "}
              {t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : "-"}
            </div>
            <div>Last updated by: {t.lastUpdatedBy || "-"}</div>
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm">
          <div className="font-semibold mb-2">Related records</div>
          <div>
            Order: {t.relatedOrderId || "-"} | Payment:{" "}
            {t.relatedPaymentId || "-"} | Business: {t.relatedBusinessId || "-"}
          </div>
          <div>
            Product: {t.relatedProductId || "-"} | Job: {t.relatedJobId || "-"}{" "}
            | Ad Campaign: {t.relatedAdCampaignId || "-"}
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm space-y-2">
          <div className="font-semibold">Admin action panel</div>
          <div className="grid md:grid-cols-3 gap-2">
            <input
              className="p-2 bg-zinc-900 border border-zinc-700 rounded"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Status"
            />
            <input
              className="p-2 bg-zinc-900 border border-zinc-700 rounded"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Assigned to"
            />
            <input
              className="p-2 bg-zinc-900 border border-zinc-700 rounded"
              value={escalationLevel}
              onChange={(e) => setEscalationLevel(e.target.value)}
              placeholder="Escalation level"
            />
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setAssignedTo("me")}
              className="px-2 py-1 border border-zinc-600 rounded"
            >
              Assign to me
            </button>
            <button
              onClick={() => setStatus("Escalated")}
              className="px-2 py-1 border border-zinc-600 rounded"
            >
              Escalate
            </button>
            <button
              onClick={() => setStatus("Waiting on User")}
              className="px-2 py-1 border border-zinc-600 rounded"
            >
              Waiting on User
            </button>
            <button
              onClick={() => setStatus("Resolved")}
              className="px-2 py-1 border border-zinc-600 rounded"
            >
              Resolve
            </button>
            <button
              onClick={() => setStatus("Closed")}
              className="px-2 py-1 border border-zinc-600 rounded"
            >
              Close
            </button>
            <button
              onClick={() => setStatus("In Review")}
              className="px-2 py-1 border border-zinc-600 rounded"
            >
              Reopen
            </button>
          </div>
          <textarea
            className="w-full p-2 min-h-20 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="Public reply"
            value={publicReply}
            onChange={(e) => setPublicReply(e.target.value)}
          />
          <label className="text-xs flex items-center gap-2">
            <input
              type="checkbox"
              checked={setWaiting}
              onChange={(e) => setSetWaiting(e.target.checked)}
            />
            Also set status to Waiting on User
          </label>
          <label className="text-xs flex items-center gap-2">
            <input
              type="checkbox"
              checked={markResolved}
              onChange={(e) => setMarkResolved(e.target.checked)}
            />
            Mark as Resolved after sending
          </label>
          <button
            onClick={() =>
              patch({
                status: markResolved
                  ? "Resolved"
                  : setWaiting
                    ? "Waiting on User"
                    : status,
              })
            }
            className="px-3 py-2 bg-yellow-500 text-black rounded"
          >
            Send Reply to Customer
          </button>
          <textarea
            className="w-full p-2 min-h-20 bg-zinc-900 border border-zinc-700 rounded"
            placeholder="Internal note (not emailed)"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
          <button
            onClick={() => patch({ followUpMessage: "" })}
            className="px-3 py-2 bg-zinc-700 text-white rounded"
          >
            Add Internal Note
          </button>
          {saveMsg ? <p className="text-sm text-zinc-300">{saveMsg}</p> : null}
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm">
          <div className="font-semibold mb-2">Conversation timeline</div>
          <ul className="space-y-2">
            {timeline.map((x: any, i: number) => (
              <li key={i} className="border border-zinc-800 rounded p-2">
                <div className="text-xs text-zinc-400">
                  {x.at ? new Date(x.at).toLocaleString() : "-"} • {x.type} •{" "}
                  {x.by || "-"}
                </div>
                <div>{x.message}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/support/tickets/[id]",
);
