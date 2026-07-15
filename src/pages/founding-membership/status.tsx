import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";

type MembershipStatusPayload = {
  ok: boolean;
  membership?: null | {
    membershipId: string;
    membershipName: string;
    membershipStatus: string;
    ownershipReviewStatus: string | null;
    business: {
      id?: string | null;
      name: string | null;
      slug: string | null;
      alias?: string | null;
      city: string | null;
      state: string | null;
    } | null;
    claimStatus: string | null;
    claimStatusLabel?: string | null;
    reviewStatus: string | null;
    paymentStatus?: string | null;
    paymentAmount?: string | null;
    amountCents?: number;
    currency?: string | null;
    evidenceStatus: string | null;
    evidencePortalStatus?: string | null;
    onboardingStatus: string | null;
    nextStep?: string | null;
    managementAccessLocked?: boolean;
    managementAccessStatus?: string | null;
    fulfillmentStatus: string | null;
    profileReviewStatus: string | null;
    baselineStatus: string | null;
    monthlyReportingStatus: string | null;
    supportStatus: string | null;
    checklist: Array<{ key?: string; label?: string; status?: string }>;
    billing: {
      hasManageableSubscription: boolean;
      nextBillingDate: string | null;
      cancelAtPeriodEnd: boolean;
      subscriptionStatus: string | null;
      renewalStatus: string | null;
    };
  };
  error?: string;
};

function labelize(value?: string | null) {
  if (!value) return "Not started";
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function FoundingMembershipStatusPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MembershipStatusPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/founding-membership/status", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(json?.error || "Unable to load membership status");
        setData(json);
      } catch (e: any) {
        setError(e?.message || "Unable to load membership status");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const membership = data?.membership || null;
  const billing = membership?.billing || {
    hasManageableSubscription: false,
    nextBillingDate: null,
    cancelAtPeriodEnd: false,
    subscriptionStatus: null,
    renewalStatus: null,
  };

  return (
    <>
      <Head>
        <title>Founding Membership Status | BWE</title>
        <meta
          name="description"
          content="View your Founding Verified Business Growth Membership status, ownership review, fulfillment steps, and billing access."
        />
      </Head>
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-300/80">
              Member status view
            </p>
            <h1 className="mt-2 text-3xl font-black text-yellow-300">
              Founding Membership Status
            </h1>
            <p className="mt-3 max-w-3xl text-white/75">
              Track membership status, claim progress, ownership verification,
              profile fulfillment, baseline setup, monthly reporting, and
              billing access in one place.
            </p>
          </section>

          {loading ? (
            <div className="text-white/70">Loading status…</div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : null}

          {!loading && !error && !membership ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold text-white">
                No founding membership found
              </h2>
              <p className="mt-2 text-white/70">
                Start by selecting an existing public business and opening the
                founding membership checkout path.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/business-directory"
                  className="rounded-xl bg-yellow-500 px-4 py-2 font-bold text-black"
                >
                  Find Existing Listing
                </Link>
                <Link
                  href="/founding-membership"
                  className="rounded-xl border border-yellow-500/40 px-4 py-2 font-bold text-yellow-300"
                >
                  Review Membership
                </Link>
              </div>
            </section>
          ) : null}

          {membership ? (
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div>
                  <div className="text-sm text-white/50">Membership</div>
                  <div className="text-xl font-bold text-white">
                    {membership.membershipName}
                  </div>
                  <div className="mt-1 text-white/70">
                    Status: {labelize(membership.membershipStatus)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-white/50">
                    Selected or claimed listing
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {membership.business?.name || "Business pending linkage"}
                  </div>
                  <div className="mt-1 text-white/65">
                    {[membership.business?.city, membership.business?.state]
                      .filter(Boolean)
                      .join(", ") || "Location pending"}
                  </div>
                  <div className="mt-1 text-xs text-white/50 break-all">
                    {membership.business?.id || "Business ID pending"}
                  </div>
                  {membership.business?.slug ? (
                    <Link
                      href={`/business/${encodeURIComponent(membership.business.slug)}`}
                      className="mt-2 inline-block text-sm text-yellow-300 underline"
                    >
                      View public business profile
                    </Link>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm text-white/50">Claim status</div>
                    <div className="mt-1 font-semibold text-white">
                      {membership.claimStatusLabel ||
                        labelize(membership.claimStatus)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm text-white/50">
                      Ownership verification
                    </div>
                    <div className="mt-1 font-semibold text-white">
                      {labelize(
                        membership.ownershipReviewStatus ||
                          membership.reviewStatus,
                      )}
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      Evidence: {labelize(membership.evidenceStatus)}
                      {membership.evidencePortalStatus
                        ? ` · Portal: ${labelize(membership.evidencePortalStatus)}`
                        : ""}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm text-white/50">Payment</div>
                    <div className="mt-1 font-semibold text-white">
                      {membership.paymentAmount || "$49.00 USD"}
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      Status: {labelize(membership.paymentStatus)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm text-white/50">Profile review</div>
                    <div className="mt-1 font-semibold text-white">
                      {labelize(membership.profileReviewStatus)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm text-white/50">Fulfillment</div>
                    <div className="mt-1 font-semibold text-white">
                      {labelize(membership.fulfillmentStatus)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm text-white/50">
                      Performance baseline
                    </div>
                    <div className="mt-1 font-semibold text-white">
                      {labelize(membership.baselineStatus)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm text-white/50">
                      Monthly reporting
                    </div>
                    <div className="mt-1 font-semibold text-white">
                      {labelize(membership.monthlyReportingStatus)}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-xl font-bold text-white">
                    Fulfillment checklist
                  </h2>
                  <div className="mt-4 space-y-3">
                    {(membership.checklist || []).length ? (
                      membership.checklist.map((item, idx) => (
                        <div
                          key={`${item.key || item.label || idx}`}
                          className="rounded-2xl border border-white/10 bg-black/25 p-4"
                        >
                          <div className="font-semibold text-white">
                            {item.label || item.key || `Step ${idx + 1}`}
                          </div>
                          <div className="mt-1 text-sm text-white/65">
                            {labelize(item.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-white/60">
                        Checklist will appear here as fulfillment advances.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-xl font-bold text-white">
                    Next step and access
                  </h2>
                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <div>
                      Next step:{" "}
                      {membership.nextStep || "submit ownership evidence"}
                    </div>
                    <div>
                      Management access:{" "}
                      {membership.managementAccessLocked
                        ? "Locked until verification"
                        : "Unlocked"}
                    </div>
                    <div>
                      Access status:{" "}
                      {labelize(membership.managementAccessStatus)}
                    </div>
                  </div>
                  {membership.evidencePortalStatus !== "complete" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/founding-membership/evidence"
                        className="rounded-xl bg-yellow-500 px-4 py-2 font-bold text-black"
                      >
                        Submit ownership evidence
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-xl font-bold text-white">
                    Support and billing
                  </h2>
                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <div>
                      Support access: {labelize(membership.supportStatus)}
                    </div>
                    <div>
                      Public listing status:{" "}
                      {labelize((membership as any).publicListingStatus)}
                    </div>
                    <div>
                      Billing status: {labelize(billing.subscriptionStatus)}
                    </div>
                    <div>Renewal status: {labelize(billing.renewalStatus)}</div>
                    <div>
                      Next billing date:{" "}
                      {billing.nextBillingDate
                        ? new Date(billing.nextBillingDate).toLocaleDateString()
                        : "Not available yet"}
                    </div>
                    <div>
                      Cancellation status:{" "}
                      {billing.cancelAtPeriodEnd
                        ? "Cancellation scheduled at period end"
                        : "Active"}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/pricing"
                      className="rounded-xl border border-yellow-500/40 px-4 py-2 font-bold text-yellow-300"
                    >
                      Billing and plan info
                    </Link>
                    <a
                      href="mailto:support@blackwealthexchange.com?subject=Founding%20Membership%20Support"
                      className="rounded-xl border border-white/15 px-4 py-2 font-bold text-white/85"
                    >
                      Contact Support
                    </a>
                  </div>
                  <p className="mt-4 text-xs text-white/50">
                    Billing changes and cancellation continue through the
                    existing canonical process. Payment and ownership
                    verification remain separate states.
                  </p>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const token = context.req.cookies?.session_token;
    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=%2Ffounding-membership%2Fstatus",
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch (error) {
    console.error("[route-diagnostic][founding-membership/status][gssp]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    throw error;
  }
};
