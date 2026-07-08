import { useEffect, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Payload = {
  ok: boolean;
  memberships?: any[];
  claims?: any[];
  records?: any[];
  claimVerificationCounts?: {
    pending?: number;
    additionalEvidenceRequired?: number;
    disputed?: number;
    verificationFailed?: number;
    verifiedHistory?: number;
  };
  reviews?: any[];
  fulfillment?: any[];
  onboarding?: any[];
  businesses?: any[];
};

function labelize(value: unknown) {
  const text =
    typeof value === "string" ? value : value == null ? "" : String(value);
  if (!text) return "-";
  return text.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

const ACTIONS = [
  { key: "verify", label: "Verify Ownership" },
  { key: "request_additional_evidence", label: "Request Additional Evidence" },
  { key: "verification_failed", label: "Verification Failed" },
  { key: "mark_disputed", label: "Mark as Disputed" },
  { key: "reopen_verification", label: "Reopen Verification" },
] as const;

export default function ClaimVerificationPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
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
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const records = Array.isArray(data?.records) ? data.records : [];
    return records;
  }, [data]);

  async function takeAction(membershipId: string, action: string) {
    setBusyId(`${membershipId}:${action}`);
    try {
      const res = await fetch("/api/admin/founding-memberships", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          membershipId,
          reason: reasons[membershipId] || "",
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "update_failed");
      }
      await load();
    } catch (error) {
      alert(error instanceof Error ? error.message : "update_failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Head>
        <title>Claim Verification | BWE</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-yellow-200">
                Claim Verification Queue
              </h1>
              <p className="mt-2 text-sm text-white/65">
                Verify whether the claimant is authorized to control the
                business. Payment activates membership, but it does not verify
                ownership.
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <Link
                href="/admin/founding-memberships"
                className="text-yellow-300 underline"
              >
                Founding Membership Pilot Review
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

          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
              <div className="text-white/45">Pending Verification</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {data?.claimVerificationCounts?.pending || 0}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
              <div className="text-white/45">Additional Evidence Required</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {data?.claimVerificationCounts?.additionalEvidenceRequired || 0}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
              <div className="text-white/45">Disputed</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {data?.claimVerificationCounts?.disputed || 0}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
              <div className="text-white/45">Verification Failed</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {data?.claimVerificationCounts?.verificationFailed || 0}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
              <div className="text-white/45">Verified History</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {data?.claimVerificationCounts?.verifiedHistory || 0}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {rows.map((row) => {
              const claim = row.claim || null;
              const review = row.review || null;
              const membership = row.membership || null;
              const onboarding = row.onboarding || null;
              const fulfillment = row.fulfillment || null;
              const business = row.business || null;
              const membershipId = String(
                row.membershipId || membership?.membershipId || "",
              );
              const auditHistory = Array.isArray(row.auditHistory)
                ? row.auditHistory
                : [];
              return (
                <section
                  key={membershipId}
                  className="rounded-2xl border border-white/15 bg-white/5 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-yellow-200">
                        {String(
                          row.businessName ||
                            business?.business_name ||
                            membership?.membershipName ||
                            membershipId ||
                            "Claim Verification",
                        )}
                      </h2>
                      <div className="mt-1 text-sm text-white/65 break-all">
                        {membershipId}
                      </div>
                    </div>
                    <div className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-200">
                      {labelize(
                        row.queueState ||
                          review?.reviewStatus ||
                          claim?.ownershipReviewStatus ||
                          claim?.claimStatus,
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4 text-sm">
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-white/45">Claimant</div>
                      <div className="mt-1 break-all text-white/85">
                        {String(
                          claim?.email ||
                            membership?.email ||
                            membership?.userId ||
                            "-",
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-white/45">Business</div>
                      <div className="mt-1 text-white/85">
                        {String(
                          claim?.businessName || business?.business_name || "-",
                        )}
                      </div>
                      <div className="mt-1 break-all text-xs text-white/55">
                        {String(
                          claim?.businessId ||
                            membership?.businessId ||
                            business?._id ||
                            "-",
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-white/45">Submitted evidence</div>
                      <div className="mt-1 text-white/85">
                        {labelize(review?.evidenceStatus)}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        Portal: {labelize(onboarding?.evidencePortalStatus)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-white/45">Payment</div>
                      <div className="mt-1 text-white/85">
                        {row.paymentDisplayAmount ||
                          membership?.paymentAmount ||
                          "-"}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        Status:{" "}
                        {labelize(
                          row.paymentStatus || membership?.paymentStatus,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-white/45">Claim status</div>
                      <div className="mt-1 text-white/85">
                        {labelize(claim?.claimStatus)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-white/45">Onboarding</div>
                      <div className="mt-1 text-white/85">
                        {labelize(onboarding?.onboardingStatus)}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        Next:{" "}
                        {onboarding?.nextStep || "submit ownership evidence"}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-white/45">Management access</div>
                      <div className="mt-1 text-white/85">
                        {labelize(
                          fulfillment?.ownershipAccessStatus ||
                            membership?.managementAccessStatus,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm font-semibold text-white">
                      Verification notes
                    </div>
                    <textarea
                      value={reasons[membershipId] || ""}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [membershipId]: event.target.value,
                        }))
                      }
                      placeholder="Reason, evidence request, dispute context, or verification-failure details"
                      className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ACTIONS.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          onClick={() => takeAction(membershipId, action.key)}
                          disabled={busyId === `${membershipId}:${action.key}`}
                          className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs font-bold text-yellow-100 disabled:opacity-50"
                        >
                          {busyId === `${membershipId}:${action.key}`
                            ? "Saving…"
                            : action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm font-semibold text-white">
                      Dates and audit history
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-white/75">
                      <div>
                        Initiated:{" "}
                        {claim?.createdAt
                          ? new Date(claim.createdAt).toLocaleString()
                          : "-"}
                      </div>
                      <div>
                        Last updated:{" "}
                        {claim?.updatedAt
                          ? new Date(claim.updatedAt).toLocaleString()
                          : review?.updatedAt
                            ? new Date(review.updatedAt).toLocaleString()
                            : "-"}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-white/75">
                      {auditHistory.length ? (
                        auditHistory.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-white/10 px-3 py-2"
                          >
                            <div className="font-semibold text-white/85">
                              {labelize(item.action)} ·{" "}
                              {labelize(item.resultingStatus)}
                            </div>
                            <div className="mt-1 text-white/60">
                              Previous: {labelize(item.previousStatus)} ·
                              Reviewer: {item.reviewer || "-"}
                            </div>
                            <div className="mt-1 text-white/60">
                              Reason: {item.reason || "-"}
                            </div>
                            <div className="mt-1 text-white/50">
                              {item.timestamp
                                ? new Date(item.timestamp).toLocaleString()
                                : "-"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-white/55">
                          No audit history yet.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
            {!loading && !rows.length ? (
              <div className="text-white/60">
                No pending claim verifications found.
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/claim-verification",
);
