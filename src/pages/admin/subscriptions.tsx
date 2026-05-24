import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import Head from "next/head";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Payload = {
  ok: boolean;
  summary?: { active: number; canceled: number; failed: number };
  subscriptions?: Array<any>;
  renewalHistory?: Array<any>;
};

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/subscriptions", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        setData(json);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Head>
        <title>Admin Subscriptions | BWE</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-yellow-200">
              Subscription Admin
            </h1>
            <Link href="/admin/tools" className="text-yellow-300 underline">
              Back to Admin Tools
            </Link>
          </div>

          {loading ? <div>Loading…</div> : null}

          {!loading && data?.ok ? (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                  <div className="text-xs text-white/70">Active</div>
                  <div className="text-2xl font-bold text-yellow-200">
                    {data.summary?.active || 0}
                  </div>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                  <div className="text-xs text-white/70">
                    Canceled/Canceling
                  </div>
                  <div className="text-2xl font-bold text-yellow-200">
                    {data.summary?.canceled || 0}
                  </div>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                  <div className="text-xs text-white/70">Failed/Past Due</div>
                  <div className="text-2xl font-bold text-yellow-200">
                    {data.summary?.failed || 0}
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-white/15 bg-white/5 p-4">
                <h2 className="mb-3 text-lg font-semibold text-yellow-200">
                  User → Plan Mapping
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-white/70">
                        <th className="pr-4">Email</th>
                        <th className="pr-4">Plan</th>
                        <th className="pr-4">Status</th>
                        <th className="pr-4">Renewal</th>
                        <th className="pr-4">Next Billing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.subscriptions || []).map((row, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                          <td className="pr-4 py-2">
                            {String(row.email || "")}
                          </td>
                          <td className="pr-4 py-2">
                            {String(
                              row.subscriptionPlan || row.currentPlan || "free",
                            )}
                          </td>
                          <td className="pr-4 py-2">
                            {String(row.subscriptionStatus || "inactive")}
                          </td>
                          <td className="pr-4 py-2">
                            {String(row.renewalStatus || "inactive")}
                          </td>
                          <td className="pr-4 py-2">
                            {row.nextBillingDate
                              ? new Date(
                                  row.nextBillingDate,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-lg border border-white/15 bg-white/5 p-4">
                <h2 className="mb-3 text-lg font-semibold text-yellow-200">
                  Renewal History
                </h2>
                <div className="space-y-2 text-sm">
                  {(data.renewalHistory || []).slice(0, 100).map((e, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-white/10 p-2"
                    >
                      <div>{String(e.stripeEventType || "event")}</div>
                      <div className="text-white/70">
                        {String(e.email || "")} · {String(e.plan || "")} ·{" "}
                        {String(e.status || "")}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/subscriptions",
);
