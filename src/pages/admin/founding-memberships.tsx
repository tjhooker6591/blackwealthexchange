import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Payload = {
  ok: boolean;
  memberships?: any[];
  claims?: any[];
  reviews?: any[];
  fulfillment?: any[];
};

export default function AdminFoundingMembershipsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/founding-memberships", {
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
        <title>Admin Founding Memberships | BWE</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-yellow-200">
              Founding Membership Pilot Review
            </h1>
            <Link href="/admin/dashboard" className="text-yellow-300 underline">
              Back to Admin Dashboard
            </Link>
          </div>

          {loading ? <div>Loading…</div> : null}

          {data?.ok ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-white/15 bg-white/5 p-4">
                <h2 className="mb-3 text-lg font-semibold text-yellow-200">Membership records</h2>
                <div className="space-y-3 text-sm">
                  {(data.memberships || []).map((row, idx) => (
                    <div key={idx} className="rounded border border-white/10 p-3">
                      <div className="font-semibold text-white">{String(row.membershipName || row.membershipId || "membership")}</div>
                      <div className="text-white/70">Status: {String(row.membershipStatus || "-")}</div>
                      <div className="text-white/70">Business: {String(row.businessId || "-")}</div>
                      <div className="text-white/70">User: {String(row.userId || row.email || "-")}</div>
                      <div className="text-white/70">Amount: {typeof row.amountCents === "number" ? `$${(row.amountCents / 100).toFixed(2)}` : "-"}</div>
                      <div className="text-white/70 break-all">Stripe session: {String(row.stripeSessionId || "-")}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-white/15 bg-white/5 p-4">
                <h2 className="mb-3 text-lg font-semibold text-yellow-200">Claim + ownership review</h2>
                <div className="space-y-3 text-sm">
                  {(data.claims || []).map((row, idx) => (
                    <div key={idx} className="rounded border border-white/10 p-3">
                      <div className="font-semibold text-white">Business {String(row.businessId || "-")}</div>
                      <div className="text-white/70">Claim: {String(row.claimStatus || "-")}</div>
                      <div className="text-white/70">Ownership review: {String(row.ownershipReviewStatus || "-")}</div>
                      <div className="text-white/70">Membership: {String(row.membershipId || "-")}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-white/15 bg-white/5 p-4">
                <h2 className="mb-3 text-lg font-semibold text-yellow-200">Ownership review queue</h2>
                <div className="space-y-3 text-sm">
                  {(data.reviews || []).map((row, idx) => (
                    <div key={idx} className="rounded border border-white/10 p-3">
                      <div className="font-semibold text-white">Business {String(row.businessId || "-")}</div>
                      <div className="text-white/70">Review status: {String(row.reviewStatus || "-")}</div>
                      <div className="text-white/70">Evidence status: {String(row.evidenceStatus || "-")}</div>
                      <div className="text-white/70">Membership: {String(row.sourceMembershipId || "-")}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-white/15 bg-white/5 p-4">
                <h2 className="mb-3 text-lg font-semibold text-yellow-200">Fulfillment + baseline</h2>
                <div className="space-y-3 text-sm">
                  {(data.fulfillment || []).map((row, idx) => (
                    <div key={idx} className="rounded border border-white/10 p-3">
                      <div className="font-semibold text-white">{String(row.membershipId || "-")}</div>
                      <div className="text-white/70">Fulfillment: {String(row.fulfillmentStatus || "-")}</div>
                      <div className="text-white/70">Profile review: {String(row.profileReviewStatus || "-")}</div>
                      <div className="text-white/70">Baseline: {String(row.baselineStatus || "-")}</div>
                      <div className="text-white/70">Monthly reporting: {String(row.monthlyReportingStatus || "-")}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/founding-memberships",
);
