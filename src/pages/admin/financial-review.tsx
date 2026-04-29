import type { GetServerSideProps } from "next";
import { requireAdminPageProps } from "@/lib/adminPageGuard";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type Data = any;

const STREAMS = [
  ["Advertising / Sponsorship Revenue", "advertising"],
  ["Marketplace Platform Fees", "marketplace"],
  ["Job Posting Revenue", "jobs"],
  ["Membership / Black Card Revenue", "membership"],
  ["Course / Financial Literacy Revenue", "courses"],
  ["Consulting / Opportunity Network Revenue", "consulting"],
  ["Music Creator Plan Revenue", "music_creator_plan"],
  ["Directory Listing / Featured Placement Revenue", "directory"],
  ["Affiliate Revenue", "affiliate"],
  ["Other / Manual Revenue", "manual"],
] as const;

const BY_STREAM_KEYS: Record<string, string[]> = {
  advertising: ["advertising"],
  marketplace: ["marketplace"],
  jobs: ["jobs"],
  membership: ["membership_black_card"],
  courses: ["courses"],
  consulting: ["consulting_opportunity_network"],
  music_creator_plan: ["music_creator_plan"],
  directory: ["directory"],
  affiliate: ["affiliate_liability"],
  manual: ["other"],
};

export default function FinancialReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerEnabled, setLedgerEnabled] = useState<boolean>(true);
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

  const streams = data?.byStream || {};
  const selectedLabel = useMemo(
    () => STREAMS.find(([, key]) => key === selectedStream)?.[0] || selectedStream,
    [selectedStream],
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">Financial Review</h1>
          <Link href="/admin/dashboard" className="text-sm border border-zinc-700 px-3 py-2 rounded">Back to Admin</Link>
        </div>

        <Section title="Revenue Streams">
          {STREAMS.map(([label, key]) => {
            const backingKeys = BY_STREAM_KEYS[key] || [key];
            const hasAmount = backingKeys.some((k) => streams[k]?.count);
            const total = backingKeys.reduce((sum, k) => sum + Number(streams[k]?.retained || 0), 0);
            return (
              <div key={key} className="rounded border border-zinc-800 bg-zinc-950 p-3 text-sm">
                {label}:{" "}
                {hasAmount ? (
                  <Link
                    href={`/admin/financial-review?stream=${encodeURIComponent(key)}`}
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

        <Section title="Ledger Transactions — Source of Truth Preview">
          {!ledgerEnabled ? (
            <p className="text-sm text-zinc-300">Financial ledger not enabled yet</p>
          ) : selectedStream ? (
            <div className="space-y-3">
              <h3 className="text-sm text-yellow-300">Transaction Details — {selectedLabel}</h3>
              {ledger.length === 0 ? (
                <p className="text-sm text-zinc-300">Revenue total exists, but detailed transaction records are not available yet for this stream.</p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-zinc-400">
                        <th className="text-left p-2">Date</th><th className="text-left p-2">Customer / User</th><th className="text-left p-2">Revenue Stream</th><th className="text-left p-2">Gross Amount</th><th className="text-left p-2">BWE Fee</th><th className="text-left p-2">Net BWE Revenue</th><th className="text-left p-2">Payment Status</th><th className="text-left p-2">Fulfillment Status</th><th className="text-left p-2">Stripe Session ID</th><th className="text-left p-2">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((r, i) => (
                        <tr key={`${r.transactionId || i}`} className="border-t border-zinc-800">
                          <td className="p-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
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
            <p className="text-sm text-zinc-300">Select a connected revenue amount above to view filtered transaction details.</p>
          )}
        </Section>
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
