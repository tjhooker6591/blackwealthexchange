import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";
import { INQUIRY_CATEGORIES } from "@/lib/inquiries/categories";

type Item = {
  _id: string;
  inquiryId: string;
  category: string;
  name: string;
  businessName?: string | null;
  email: string;
  phone?: string | null;
  message: string;
  listingUrl?: string | null;
  createdAt: string;
  optedOut?: boolean;
  reply?: { state: string };
  teamAlert?: { state: string };
  speedToLead?: {
    state: string;
    reason?: string | null;
    attempts?: number;
    leadId?: string | null;
    lastError?: string | null;
  };
};
type Summary = {
  inquiries: number;
  repliesSent: number;
  optedOut: number;
  convertedToMembers: number;
  membershipRevenueCents: number;
  byCategory: Record<
    string,
    {
      inquiries: number;
      sentToSpeedToLead: number;
      converted: number;
      revenueCents: number;
    }
  >;
  speedToLead: {
    sent: number;
    waitingForGoLive: number;
    retrying: number;
    failed: number;
  };
};

const label = (k: string) =>
  INQUIRY_CATEGORIES.find((c) => c.key === k)?.label || k;
const money = (c: number) =>
  `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const STL: Record<string, string> = {
  sent: "Sent",
  waiting_for_go_live: "Waiting for BWE to go live",
  retrying: "Will retry",
  pending: "Sending",
  failed: "Failed",
  not_applicable: "Not sent",
};
const WHY: Record<string, string> = {
  no_phone: "no phone given",
  category: "shopper inquiry",
  not_configured: "connection not set up",
};

export default function AdminInquiries() {
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/inquiries", { credentials: "include" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Could not load inquiries");
      setItems(d.items || []);
      setSummary(d.summary);
      setConfigured(Boolean(d.speedToLeadConfigured));
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const retry = async () => {
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch("/api/admin/inquiries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "Retry failed");
      setNotice(
        `Tried ${d.processed} hand-off${d.processed === 1 ? "" : "s"} to Speed-to-Lead.`,
      );
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const s = summary;
  return (
    <>
      <Head>
        <title>Inquiries | BWE Admin</title>
      </Head>
      <div className="min-h-screen bg-black text-white p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Link
                href="/admin/dashboard"
                className="text-sm text-zinc-400 hover:text-gold"
              >
                ← Admin dashboard
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-gold">Inquiries</h1>
              <p className="text-sm text-zinc-400">
                Messages from the contact form, what each person was sent, and
                who became a paying member.
              </p>
            </div>
            <button
              onClick={retry}
              disabled={busy || !configured}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
              title={
                configured
                  ? "Send waiting inquiries to Speed-to-Lead now"
                  : "STL_LEAD_WEBHOOK_URL is not set"
              }
            >
              {busy ? "Sending…" : "Retry Speed-to-Lead now"}
            </button>
          </div>
          {!configured ? (
            <p className="mt-3 rounded-lg border border-yellow-500/40 bg-yellow-950/30 p-3 text-sm text-yellow-200">
              Speed-to-Lead isn&apos;t connected yet (STL_LEAD_WEBHOOK_URL is not
              set), so inquiries stay in BWE only.
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="mt-3 rounded-lg border border-green-500/40 bg-green-950/30 p-3 text-sm text-green-200">
              {notice}
            </p>
          ) : null}

          {s ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [s.inquiries, "Inquiries"],
                [s.convertedToMembers, "Became paying members"],
                [money(s.membershipRevenueCents), "Membership revenue"],
                [s.speedToLead.sent, "Sent to Speed-to-Lead"],
                [s.speedToLead.waitingForGoLive, "Waiting for go-live"],
                [s.repliesSent, "Replies sent"],
                [s.optedOut, "Unsubscribed"],
                [s.speedToLead.failed, "Hand-offs failed"],
              ].map(([v, l]) => (
                <div
                  key={String(l)}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="text-2xl font-bold">{v}</div>
                  <div className="text-xs text-zinc-400">{l}</div>
                </div>
              ))}
            </div>
          ) : null}

          {s && Object.keys(s.byCategory).length ? (
            <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-gold">
                    <th className="p-3">Category</th>
                    <th className="p-3">Inquiries</th>
                    <th className="p-3">To Speed-to-Lead</th>
                    <th className="p-3">Became members</th>
                    <th className="p-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(s.byCategory).map(([k, v]) => (
                    <tr
                      key={k}
                      className="border-b border-zinc-800 last:border-0"
                    >
                      <td className="p-3">{label(k)}</td>
                      <td className="p-3">{v.inquiries}</td>
                      <td className="p-3">{v.sentToSpeedToLead}</td>
                      <td className="p-3">{v.converted}</td>
                      <td className="p-3">{money(v.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-6 space-y-2">
            {items.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
                No inquiries yet.
              </p>
            ) : null}
            {items.map((i) => (
              <div
                key={i._id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <button
                  type="button"
                  onClick={() => setOpen(open === i._id ? null : i._id)}
                  className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left"
                >
                  <span>
                    <b>{i.businessName || i.name}</b>{" "}
                    <span className="text-sm text-zinc-400">
                      · {label(i.category)}
                    </span>
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(i.createdAt).toLocaleString()}
                  </span>
                </button>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-zinc-800 px-2 py-0.5">
                    Reply:{" "}
                    {i.reply?.state === "sent"
                      ? "sent"
                      : i.reply?.state === "skipped_opted_out"
                        ? "not sent (unsubscribed)"
                        : i.reply?.state || "—"}
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5">
                    Speed-to-Lead: {STL[i.speedToLead?.state || ""] || "—"}
                    {i.speedToLead?.state === "not_applicable" &&
                    i.speedToLead?.reason
                      ? ` (${WHY[i.speedToLead.reason] || i.speedToLead.reason})`
                      : ""}
                  </span>
                </div>
                {open === i._id ? (
                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
                    <dt className="text-zinc-400">Name</dt>
                    <dd>{i.name}</dd>
                    <dt className="text-zinc-400">Email</dt>
                    <dd>
                      <a className="underline" href={`mailto:${i.email}`}>
                        {i.email}
                      </a>
                    </dd>
                    {i.phone ? (
                      <>
                        <dt className="text-zinc-400">Phone</dt>
                        <dd>
                          <a className="underline" href={`tel:${i.phone}`}>
                            {i.phone}
                          </a>
                        </dd>
                      </>
                    ) : null}
                    {i.listingUrl ? (
                      <>
                        <dt className="text-zinc-400">Listing</dt>
                        <dd className="break-words">{i.listingUrl}</dd>
                      </>
                    ) : null}
                    <dt className="text-zinc-400">Message</dt>
                    <dd className="whitespace-pre-wrap break-words">
                      {i.message}
                    </dd>
                    <dt className="text-zinc-400">Reference</dt>
                    <dd>
                      {i.inquiryId}
                      {i.speedToLead?.leadId
                        ? ` · Speed-to-Lead lead ${i.speedToLead.leadId}`
                        : ""}
                    </dd>
                  </dl>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/inquiries");
