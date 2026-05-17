import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from "@/lib/support";

function normalizeIncomingValue(
  value: unknown,
  allowed: readonly string[],
  fallback: string,
) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  if (allowed.includes(raw)) return raw;

  const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedRaw = compact(raw);

  const exact = allowed.find((option) => compact(option) === normalizedRaw);
  if (exact) return exact;

  const partial = allowed.find((option) =>
    compact(option).startsWith(normalizedRaw),
  );
  if (partial) return partial;

  return fallback;
}

export default function SupportTicketForm({
  defaultCategory,
}: {
  defaultCategory?: string;
}) {
  const router = useRouter();
  const pre = useMemo(
    () => ({
      category: normalizeIncomingValue(
        router.query.category || defaultCategory,
        SUPPORT_CATEGORIES,
        "General Question",
      ),
      priority: normalizeIncomingValue(
        router.query.priority,
        SUPPORT_PRIORITIES,
        "Normal",
      ),
    }),
    [router.query.category, router.query.priority, defaultCategory],
  );
  const [f, setF] = useState({
    name: "",
    email: "",
    category: pre.category,
    priority: pre.priority,
    subject: "",
    message: "",
    relatedOrderId: "",
    relatedPaymentId: "",
    relatedBusinessId: "",
    relatedProductId: "",
    accountType: "guest",
  });
  const [msg, setMsg] = useState("");

  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Submitting...");
    const r = await fetch("/api/support/create-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? `Ticket created: ${d.ticketId}` : d?.message || "Failed");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded border border-zinc-800 bg-zinc-950 p-4"
    >
      <input
        className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded"
        placeholder="Name"
        value={f.name}
        onChange={(e) => set("name", e.target.value)}
        required
      />
      <input
        className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded"
        placeholder="Email"
        value={f.email}
        onChange={(e) => set("email", e.target.value)}
        required
      />
      <div className="grid md:grid-cols-3 gap-3">
        <select
          className="p-2 bg-zinc-900 border border-zinc-700 rounded"
          value={f.category}
          onChange={(e) => set("category", e.target.value)}
        >
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="p-2 bg-zinc-900 border border-zinc-700 rounded"
          value={f.priority}
          onChange={(e) => set("priority", e.target.value)}
        >
          {SUPPORT_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          className="p-2 bg-zinc-900 border border-zinc-700 rounded"
          placeholder="Account Type"
          value={f.accountType}
          onChange={(e) => set("accountType", e.target.value)}
        />
      </div>
      <input
        className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded"
        placeholder="Subject"
        value={f.subject}
        onChange={(e) => set("subject", e.target.value)}
        required
      />
      <textarea
        className="w-full p-2 min-h-32 bg-zinc-900 border border-zinc-700 rounded"
        placeholder="Message"
        value={f.message}
        onChange={(e) => set("message", e.target.value)}
        required
      />
      <div className="grid md:grid-cols-2 gap-3">
        <input
          className="p-2 bg-zinc-900 border border-zinc-700 rounded"
          placeholder="Related Order ID"
          value={f.relatedOrderId}
          onChange={(e) => set("relatedOrderId", e.target.value)}
        />
        <input
          className="p-2 bg-zinc-900 border border-zinc-700 rounded"
          placeholder="Related Payment ID"
          value={f.relatedPaymentId}
          onChange={(e) => set("relatedPaymentId", e.target.value)}
        />
        <input
          className="p-2 bg-zinc-900 border border-zinc-700 rounded"
          placeholder="Related Business ID"
          value={f.relatedBusinessId}
          onChange={(e) => set("relatedBusinessId", e.target.value)}
        />
        <input
          className="p-2 bg-zinc-900 border border-zinc-700 rounded"
          placeholder="Related Product ID"
          value={f.relatedProductId}
          onChange={(e) => set("relatedProductId", e.target.value)}
        />
      </div>
      <button className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold">
        Create Ticket
      </button>
      {msg && <p className="text-sm text-zinc-300">{msg}</p>}
    </form>
  );
}
