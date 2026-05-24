import type { GetServerSideProps } from "next";
import { requireAdminPageProps } from "@/lib/adminPageGuard";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FINANCE_STREAMS } from "@/lib/finance/stream-map";

type Data = any;

const DISPLAY_TO_BACKING: Record<string, string[]> = {
  advertising: ["advertising"],
  marketplace: ["marketplace"],
  jobs: ["jobs"],
  membership_black_card: ["membership_black_card"],
  courses: ["courses"],
  consulting_opportunity_network: ["consulting_opportunity_network"],
  music_creator_plan: ["music_creator_plan"],
  directory: ["directory"],
  affiliate_revenue: ["affiliate_revenue"],
  affiliate_liability: ["affiliate_liability"],
  manual_offline: ["manual_offline", "other"],
};

const adminNavLinks = [
  ["Command Center", "/admin/command-center"],
  ["Financial Review", "/admin/financial-review"],
  ["Dashboard", "/admin/dashboard"],
  ["Support", "/admin/support"],
  ["Revenue", "/admin/revenue"],
  ["Growth", "/admin/growth"],
  ["Partnerships", "/admin/partnerships"],
] as const;

function AdminHubNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {adminNavLinks.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="text-xs border border-zinc-700 px-3 py-1.5 rounded"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
export default function FinancialReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerEnabled, setLedgerEnabled] = useState<boolean>(true);
  const [eventRows, setEventRows] = useState<any[]>([]);
  const selectedStream = String(router.query.stream || "").trim();

  useEffect(() => {
    fetch("/api/admin/financial-review", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    const q = selectedStream
      ? `?limit=50&revenueStream=${encodeURIComponent(selectedStream)}`
      : "?limit=20";
    fetch(`/api/admin/financial-ledger${q}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setLedger(d?.rows || []);
        setLedgerEnabled(d?.enabled !== false);
      })
      .catch(() => {
        setLedger([]);
        setLedgerEnabled(false);
      });
  }, [selectedStream]);

  useEffect(() => {
    fetch("/api/admin/webhook-events?limit=20", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setEventRows(d?.rows || []))
      .catch(() => setEventRows([]));
  }, []);

  const streams = data?.byStream || {};
  const hasSelectedStream = selectedStream.length > 0;

  const selectedLabel = useMemo(
    () =>
      FINANCE_STREAMS.find((x) => x.key === selectedStream)?.label ||
      selectedStream,
    [selectedStream],
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminHubNav />

        {router.query.source === "command-center" ? (
          <div className="rounded border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            Opened from Command Center
            {router.query.focus
              ? ` • Focus: ${String(router.query.focus)}`
              : ""}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">
            Financial Review
          </h1>
          <Link
            href="/admin/dashboard"
            className="text-sm border border-zinc-700 px-3 py-2 rounded"
          >
            Back to Admin
          </Link>
        </div>

        <Section title="Top Totals">
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              Total Revenue: {money(data?.totalRevenue)}
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              BWE Net Revenue: {money(data?.totalRevenue)}
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              Pending Payments: {money(data?.pendingRevenue)}
            </div>
          </div>
        </Section>

        <Section title="Revenue Streams">
          {FINANCE_STREAMS.map(({ label, key }) => {
            const backing = DISPLAY_TO_BACKING[key] || [key];
            const hasAmount = backing.some((k) => Boolean(streams[k]?.count));
            const total = backing.reduce(
              (sum, k) => sum + Number(streams[k]?.retained || 0),
              0,
            );
            return (
              <div
                key={key}
                className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm"
              >
                {label}:{" "}
                {hasAmount ? (
                  <Link
                    href={`/admin/financial-review?stream=${encodeURIComponent(key)}#transaction-details`}
                    aria-label={`View ${label} transaction details`}
                    className="text-yellow-300 underline decoration-yellow-500 hover:text-yellow-200"
                  >
                    {money(total)}
                  </Link>
                ) : (
                  <span className="text-yellow-300">Not connected yet</span>
                )}
              </div>
            );
          })}
        </Section>

        <Section title="Monthly Summary">
          {Object.keys(data?.monthlySummary || {}).length === 0 ? (
            <p className="text-sm text-zinc-300">
              No monthly revenue data yet.
            </p>
          ) : (
            <div className="space-y-1 text-sm">
              {Object.entries(data?.monthlySummary || {})
                .sort()
                .reverse()
                .map(([month, cents]) => (
                  <div
                    key={month}
                    className="flex justify-between border-b border-zinc-800 py-1"
                  >
                    <span>{month}</span>
                    <span>{money(cents)}</span>
                  </div>
                ))}
            </div>
          )}
        </Section>

        <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-lg text-yellow-400 mb-2">Related Actions</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/admin/command-center?source=command-center&focus=marketplace-trust"
              className="underline text-yellow-300"
            >
              View marketplace trust
            </Link>
            <Link
              href="/admin/support?source=command-center&focus=priority"
              className="underline text-yellow-300"
            >
              View support issues
            </Link>
          </div>
        </section>

        <Section title="Ledger Readiness">
          <p className="text-sm text-zinc-300">
            {ledgerEnabled
              ? "Ledger enabled, new transactions will be recorded"
              : "Ledger disabled, no financial records will be written"}
          </p>
        </Section>

        <Section title="Recent Payment Events (Debug View)">
          {eventRows.length === 0 ? (
            <p className="text-sm text-zinc-300">
              No webhook events captured yet.
            </p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-zinc-400">
                    <th className="text-left p-2">Event Time</th>
                    <th className="text-left p-2">Revenue Stream</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Session ID</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRows.map((r, i) => (
                    <tr key={i} className="border-t border-zinc-800">
                      <td className="p-2">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2">{r.revenueStream || "-"}</td>
                      <td className="p-2">{r.status || "-"}</td>
                      <td className="p-2">{r.sessionId || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
        <section
          id="transaction-details"
          className="rounded border border-zinc-800 bg-zinc-950 p-4"
        >
          <h2 className="text-lg text-yellow-400 mb-2">
            Ledger Transactions — Source of Truth Preview
          </h2>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-400 mb-2">
              Selected stream: {hasSelectedStream ? selectedStream : "none"}
            </p>
            <button
              type="button"
              onClick={() => {
                if (!ledger.length) return;
                const rows = ledger.map((r) => [
                  r.createdAt || "",
                  r.userId || "",
                  r.revenueStream || "",
                  r.grossAmount || 0,
                  r.bweFeeAmount || 0,
                  r.netBweRevenue || 0,
                  r.paymentStatus || "",
                  r.fulfillmentStatus || "",
                  r.stripeSessionId || "",
                  r.sourceRoute || "",
                ]);
                const head = [
                  "createdAt",
                  "userId",
                  "revenueStream",
                  "grossAmount",
                  "bweFeeAmount",
                  "netBweRevenue",
                  "paymentStatus",
                  "fulfillmentStatus",
                  "stripeSessionId",
                  "sourceRoute",
                ];
                const csv = [head, ...rows]
                  .map((line) =>
                    line
                      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                      .join(","),
                  )
                  .join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `financial-ledger-${hasSelectedStream ? selectedStream : "all"}.csv`;
                a.click();
              }}
              className="text-xs border border-zinc-700 px-2 py-1 rounded"
            >
              Export CSV (filtered)
            </button>
          </div>

          {hasSelectedStream ? (
            <div className="space-y-3">
              <h3 className="text-sm text-yellow-300">
                Transaction Details — {selectedLabel}
              </h3>
              {!ledgerEnabled ? (
                <p className="text-sm text-zinc-300">
                  Financial ledger not enabled yet.
                </p>
              ) : ledger.length === 0 ? (
                <p className="text-sm text-zinc-300">
                  No transaction records found for this stream yet.
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-zinc-400">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Customer / User</th>
                        <th className="text-left p-2">Revenue Stream</th>
                        <th className="text-left p-2">Gross Amount</th>
                        <th className="text-left p-2">BWE Fee</th>
                        <th className="text-left p-2">Net BWE Revenue</th>
                        <th className="text-left p-2">Payment Status</th>
                        <th className="text-left p-2">Fulfillment Status</th>
                        <th className="text-left p-2">Stripe Session ID</th>
                        <th className="text-left p-2">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((r, i) => (
                        <tr
                          key={`${r.transactionId || i}`}
                          className="border-t border-zinc-800"
                        >
                          <td className="p-2">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleString()
                              : "-"}
                          </td>
                          <td className="p-2">{r.userId || "-"}</td>
                          <td className="p-2">{r.revenueStream || "-"}</td>
                          <td className="p-2">{money(r.grossAmount)}</td>
                          <td className="p-2">{money(r.bweFeeAmount)}</td>
                          <td className="p-2">{money(r.netBweRevenue)}</td>
                          <td className="p-2">{r.paymentStatus || "-"}</td>
                          <td className="p-2">{r.fulfillmentStatus || "-"}</td>
                          <td className="p-2">{r.stripeSessionId || "-"}</td>
                          <td className="p-2">{r.sourceRoute || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-300">
              Select a connected revenue amount above to view filtered
              transaction details.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function money(v: any) {
  return `$${(Number(v || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function Section({ title, children }: { title: string; children: any }) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-lg text-yellow-400 mb-2">{title}</h2>
      {children}
    </section>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/financial-review",
);
