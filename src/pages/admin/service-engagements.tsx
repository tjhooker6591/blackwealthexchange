// src/pages/admin/service-engagements.tsx
//
// Recruiting + Consulting Commercial MVP (2026-09-07). One practical
// admin experience for both service types (section I of the MVP spec).
// Deliberately simple: a list + a detail panel with the handful of
// actions admin actually needs (update status, set the agreed amount,
// create a payment request). Not a CRM.

import { useEffect, useState } from "react";
import Head from "next/head";

type RowType = "recruiting" | "consulting";

type EngagementRow = {
  type: RowType;
  id: string;
  customer: string;
  request: string;
  status: string;
  agreedAmountCents: number | null;
  paymentStatus: string;
  createdAt: string;
};

type EngagementDetail = Record<string, any>;

const RECRUITING_STATES = [
  "new",
  "contacted",
  "engaged",
  "placement_confirmed",
  "payment_due",
  "paid",
  "closed",
  "cancelled",
];

const CONSULTING_STATES = [
  "new",
  "contacted",
  "proposal_agreed",
  "payment_due",
  "paid",
  "in_progress",
  "completed",
  "cancelled",
];

function formatCents(cents: number | null) {
  if (cents === null || cents === undefined) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ServiceEngagementsAdminPage() {
  const [rows, setRows] = useState<EngagementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<EngagementRow | null>(null);
  const [detail, setDetail] = useState<EngagementDetail | null>(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [amountDraft, setAmountDraft] = useState("");
  const [compDraft, setCompDraft] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/service-engagements", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Failed to load engagements.");
      } else {
        setRows(json.rows);
      }
    } catch {
      setError("Failed to load engagements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  async function openRow(row: EngagementRow) {
    setSelected(row);
    setDetail(null);
    setActionMsg("");
    setCheckoutUrl("");
    const base =
      row.type === "recruiting"
        ? `/api/admin/recruiting/engagements/${row.id}`
        : `/api/admin/consulting/engagements/${row.id}`;
    const res = await fetch(base, {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    if (res.ok && json?.ok) {
      setDetail(json.engagement);
      setStatusDraft(json.engagement.status || "");
      setAmountDraft(
        row.type === "recruiting"
          ? String(json.engagement.agreedFeeCents ?? "")
          : String(json.engagement.agreedAmountCents ?? ""),
      );
      setCompDraft(String(json.engagement.compensationBasisCents ?? ""));
      setCheckoutUrl(json.engagement.stripeCheckoutUrl || "");
    }
  }

  async function saveStatus() {
    if (!selected) return;
    setBusy(true);
    setActionMsg("");
    const base =
      selected.type === "recruiting"
        ? `/api/admin/recruiting/engagements/${selected.id}`
        : `/api/admin/consulting/engagements/${selected.id}`;
    const res = await fetch(base, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: statusDraft }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.ok && json?.ok) {
      setActionMsg("Status updated.");
      loadRows();
      openRow(selected);
    } else {
      setActionMsg(json?.error || "Failed to update status.");
    }
  }

  async function saveAmount() {
    if (!selected) return;
    const cents = Math.round(Number(amountDraft) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setActionMsg("Enter a valid dollar amount.");
      return;
    }
    setBusy(true);
    setActionMsg("");
    const base =
      selected.type === "recruiting"
        ? `/api/admin/recruiting/engagements/${selected.id}`
        : `/api/admin/consulting/engagements/${selected.id}`;
    const field =
      selected.type === "recruiting" ? "agreedFeeCents" : "agreedAmountCents";
    const res = await fetch(base, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ [field]: cents }),
    });
    const json = await res.json();
    setBusy(false);
    if (res.ok && json?.ok) {
      setActionMsg("Agreed amount updated.");
      loadRows();
      openRow(selected);
    } else {
      setActionMsg(json?.error || "Failed to update amount.");
    }
  }

  async function saveCompensation() {
    if (!selected || selected.type !== "recruiting") return;
    const cents = Math.round(Number(compDraft) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setActionMsg("Enter a valid dollar amount.");
      return;
    }
    setBusy(true);
    setActionMsg("");
    const res = await fetch(
      `/api/admin/recruiting/engagements/${selected.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ compensationBasisCents: cents }),
      },
    );
    const json = await res.json();
    setBusy(false);
    if (res.ok && json?.ok) {
      setActionMsg(
        `Standard 15% fee recalculated: ${formatCents(json.engagement.calculatedStandardFeeCents)}`,
      );
      loadRows();
      openRow(selected);
    } else {
      setActionMsg(json?.error || "Failed to update compensation basis.");
    }
  }

  async function createPayment() {
    if (!selected) return;
    setBusy(true);
    setActionMsg("");
    const base =
      selected.type === "recruiting"
        ? `/api/admin/recruiting/engagements/${selected.id}/create-payment`
        : `/api/admin/consulting/engagements/${selected.id}/create-payment`;
    const res = await fetch(base, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    setBusy(false);
    if (res.ok && json?.ok) {
      setCheckoutUrl(json.checkoutUrl || "");
      setActionMsg(
        "Payment request created. Share the link below with the customer.",
      );
      loadRows();
    } else {
      setActionMsg(json?.error || "Failed to create payment request.");
    }
  }

  const states =
    selected?.type === "recruiting" ? RECRUITING_STATES : CONSULTING_STATES;

  return (
    <>
      <Head>
        <title>Service Engagements | BWE Admin</title>
      </Head>
      <div className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-black tracking-tight">
            Recruiting &amp; Consulting Engagements
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Combined admin queue for both service types.
          </p>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
          {loading ? (
            <p className="mt-4 text-sm text-white/60">Loading...</p>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Request</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Agreed</th>
                    <th className="px-3 py-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={`${r.type}:${r.id}`}
                      onClick={() => openRow(r)}
                      className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${
                        selected?.id === r.id && selected?.type === r.type
                          ? "bg-white/10"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            r.type === "recruiting"
                              ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                              : "bg-cyan-500/20 text-cyan-300"
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">{r.customer}</td>
                      <td className="px-3 py-2">{r.request}</td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2">
                        {formatCents(r.agreedAmountCents)}
                      </td>
                      <td className="px-3 py-2">{r.paymentStatus}</td>
                    </tr>
                  ))}
                  {!loading && !rows.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-white/50"
                      >
                        No engagements yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              {!selected ? (
                <p className="text-sm text-white/60">
                  Select an engagement to manage it.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-white/50">
                      {selected.type} engagement
                    </div>
                    <div className="text-lg font-bold">{selected.customer}</div>
                    <div className="text-sm text-white/70">
                      {selected.request}
                    </div>
                  </div>

                  {selected.type === "recruiting" ? (
                    <div>
                      <label className="mb-1 block text-xs text-white/60">
                        Compensation basis ($, first-year) -- recalculates the
                        standard 15% fee
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={compDraft}
                          onChange={(e) => setCompDraft(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                        />
                        <button
                          onClick={saveCompensation}
                          disabled={busy}
                          className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                        >
                          Save
                        </button>
                      </div>
                      {detail?.calculatedStandardFeeCents != null ? (
                        <div className="mt-1 text-xs text-white/50">
                          Standard 15%:{" "}
                          {formatCents(detail.calculatedStandardFeeCents)}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1 block text-xs text-white/60">
                      Agreed amount ($) -- what the customer will be charged
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={amountDraft}
                        onChange={(e) => setAmountDraft(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={saveAmount}
                        disabled={busy}
                        className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">
                      Status
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                      >
                        {states.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={saveStatus}
                        disabled={busy}
                        className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={createPayment}
                    disabled={busy}
                    className="w-full rounded-lg bg-[#D4AF37] px-3 py-2.5 text-sm font-extrabold text-black hover:bg-yellow-500 disabled:opacity-60"
                  >
                    Create Payment Request
                  </button>

                  {checkoutUrl ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/10 p-3 text-xs text-emerald-200 break-all">
                      Share with customer: {checkoutUrl}
                      <br />
                      Status page: /{selected.type}/engagement/{selected.id}
                    </div>
                  ) : (
                    <div className="text-xs text-white/50">
                      Status page: /{selected.type}/engagement/{selected.id}
                    </div>
                  )}

                  {actionMsg ? (
                    <div className="text-xs text-white/70">{actionMsg}</div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
