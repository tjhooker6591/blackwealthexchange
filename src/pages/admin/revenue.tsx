import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

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

function money(cents: unknown) {
  const n = Number(cents || 0);
  return `$${(n / 100).toFixed(2)}`;
}

export default function Page() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, l] = await Promise.all([
          fetch("/api/admin/financial-review", { credentials: "include" }).then(
            (r) => r.json(),
          ),
          fetch("/api/admin/financial-ledger?limit=8", {
            credentials: "include",
          }).then((r) => r.json()),
        ]);
        setSummary(s || null);
        setLedger(Array.isArray(l?.rows) ? l.rows : []);
      } catch {
        setSummary(null);
        setLedger([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalRevenue = useMemo(
    () => Number(summary?.totalRevenue || 0),
    [summary],
  );

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-4">
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
            Revenue Operations
          </h1>
          <Link
            href="/admin/dashboard"
            className="text-sm border border-zinc-700 px-3 py-2 rounded"
          >
            Back to Admin
          </Link>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-xs text-zinc-400">
            Total revenue (aligned with Financial Review)
          </div>
          <div className="mt-1 text-2xl font-bold text-yellow-300">
            {loading ? "Loading..." : money(totalRevenue)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            {totalRevenue > 0 ? "Live data" : "No data yet"}
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg text-yellow-300">Recent transactions</h2>
            <Link
              href="/admin/financial-review?source=command-center&focus=revenue#transaction-details"
              className="text-sm underline text-yellow-300"
            >
              View full financial detail
            </Link>
          </div>

          {loading ? (
            <p className="text-zinc-400 text-sm">Loading transactions...</p>
          ) : ledger.length === 0 ? (
            <p className="text-zinc-300 text-sm">No transactions yet.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-zinc-400">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-right p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((r, i) => (
                    <tr
                      key={String(r?._id || i)}
                      className="border-t border-zinc-800"
                    >
                      <td className="p-2">
                        {r?.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2">
                        {String(r?.type || r?.revenueStream || "-")}
                      </td>
                      <td className="p-2">{String(r?.status || "-")}</td>
                      <td className="p-2 text-right">
                        {money(r?.amountCents || r?.grossCents || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/revenue");
