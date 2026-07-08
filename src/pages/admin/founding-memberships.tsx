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

function labelize(value: unknown) {
  const text =
    typeof value === "string" ? value : value == null ? "" : String(value);
  if (!text) return "-";
  return text.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function money(value: unknown) {
  const num = typeof value === "number" ? value : Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return "-";
  return `$${(num / 100).toFixed(2)}`;
}

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
            <div className="flex gap-4 text-sm">
              <Link
                href="/admin/claim-verification"
                className="text-yellow-300 underline"
              >
                Pending Claim Verifications
              </Link>
              <Link
                href="/admin/dashboard"
                className="text-yellow-300 underline"
              >
                Back to Admin Dashboard
              </Link>
            </div>
          </div>

          {loading ? <div>Loading…</div> : null}

          {data?.ok ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {(data.memberships || []).map((row, idx) => {
                const claim = (data.claims || []).find(
                  (item) => item.membershipId === row.membershipId,
                );
                const review = (data.reviews || []).find(
                  (item) => item.sourceMembershipId === row.membershipId,
                );
                const fulfillment = (data.fulfillment || []).find(
                  (item) => item.membershipId === row.membershipId,
                );
                const checklist = Array.isArray(fulfillment?.checklist)
                  ? fulfillment.checklist
                  : [];
                const needsAction = [
                  review?.evidenceStatus === "awaiting_owner_documents"
                    ? "Awaiting owner evidence"
                    : "",
                  review?.reviewStatus && review.reviewStatus !== "approved"
                    ? `Review: ${labelize(review.reviewStatus)}`
                    : "",
                  fulfillment?.profileReviewStatus &&
                  fulfillment.profileReviewStatus !== "completed"
                    ? `Profile: ${labelize(fulfillment.profileReviewStatus)}`
                    : "",
                  fulfillment?.baselineStatus &&
                  fulfillment.baselineStatus !== "completed"
                    ? `Baseline: ${labelize(fulfillment.baselineStatus)}`
                    : "",
                  fulfillment?.monthlyReportingStatus &&
                  fulfillment.monthlyReportingStatus !== "active"
                    ? `Reporting: ${labelize(fulfillment.monthlyReportingStatus)}`
                    : "",
                ].filter(Boolean);

                return (
                  <section
                    key={idx}
                    className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-yellow-200">
                          {String(
                            row.membershipName ||
                              row.membershipId ||
                              "Membership",
                          )}
                        </h2>
                        <div className="mt-1 text-sm text-white/65 break-all">
                          {String(row.membershipId || "-")}
                        </div>
                      </div>
                      <div className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-100">
                        {labelize(row.membershipStatus)}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-white/45">Customer</div>
                        <div className="mt-1 text-white/85 break-all">
                          {String(row.email || row.userId || "-")}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-white/45">Business</div>
                        <div className="mt-1 text-white/85 break-all">
                          {String(row.businessId || "-")}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-white/45">Payment status</div>
                        <div className="mt-1 text-white/85">
                          {row.stripeSessionId ? "Paid" : "Pending"} ·{" "}
                          {money(row.amountCents)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-white/45">Ownership review</div>
                        <div className="mt-1 text-white/85">
                          {labelize(
                            review?.reviewStatus || row.ownershipReviewStatus,
                          )}
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          Evidence: {labelize(review?.evidenceStatus)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-white/45">Claim</div>
                        <div className="mt-1 text-white/85">
                          {labelize(claim?.claimStatus)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-white/45">Profile review</div>
                        <div className="mt-1 text-white/85">
                          {labelize(fulfillment?.profileReviewStatus)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-white/45">Baseline</div>
                        <div className="mt-1 text-white/85">
                          {labelize(fulfillment?.baselineStatus)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-white/45">Monthly reporting</div>
                        <div className="mt-1 text-white/85">
                          {labelize(fulfillment?.monthlyReportingStatus)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="text-sm font-semibold text-white">
                        Fulfillment checklist
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-white/75">
                        {checklist.length ? (
                          checklist.map((item: any, itemIdx: number) => (
                            <div
                              key={item.key || itemIdx}
                              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2"
                            >
                              <span>
                                {item.label ||
                                  item.key ||
                                  `Step ${itemIdx + 1}`}
                              </span>
                              <span className="text-white/55">
                                {labelize(item.status)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-white/55">
                            No checklist items yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                      <div className="text-sm font-semibold text-red-200">
                        Exceptions requiring action
                      </div>
                      <div className="mt-2 text-sm text-red-100/90">
                        {needsAction.length
                          ? needsAction.join(" • ")
                          : "No active exceptions right now."}
                      </div>
                    </div>
                  </section>
                );
              })}
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
