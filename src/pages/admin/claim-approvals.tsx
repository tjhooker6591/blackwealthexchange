import { useEffect, useMemo, useState } from "react";
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
  onboarding?: any[];
};

function labelize(value: unknown) {
  const text =
    typeof value === "string" ? value : value == null ? "" : String(value);
  if (!text) return "-";
  return text.replace(/[_-]/g, " ").replace(/\w/g, (m) => m.toUpperCase());
}

const ACTIONS = [
  { key: "approve", label: "Approve Ownership Claim" },
  { key: "request_additional_evidence", label: "Request Additional Evidence" },
  { key: "reject", label: "Reject Ownership Claim" },
  { key: "mark_disputed", label: "Mark as Disputed" },
  { key: "reopen", label: "Reopen Claim" },
] as const;

export default function ClaimApprovalsPage() {
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
    const claims = data?.claims || [];
    const reviews = data?.reviews || [];
    const memberships = data?.memberships || [];
    const onboarding = data?.onboarding || [];
    return claims.map((claim) => ({
      claim,
      review: reviews.find(
        (item) => item.sourceMembershipId === claim.membershipId,
      ),
      membership: memberships.find(
        (item) => item.membershipId === claim.membershipId,
      ),
      onboarding: onboarding.find(
        (item) => item.membershipId === claim.membershipId,
      ),
    }));
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
        <title>Admin Ownership Claim Approvals | BWE</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-yellow-200">
                Pending Ownership Claims
              </h1>
              <p className="mt-2 text-sm text-white/65">
                Review whether the claimant is authorized to control the
                business. Payment does not approve ownership.
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

          <div className="space-y-4">
            {rows.map(({ claim, review, membership, onboarding }) => {
              const membershipId = String(
                claim.membershipId || membership?.membershipId || "",
              );
              const auditHistory = Array.isArray(review?.auditHistory)
                ? review.auditHistory
                : Array.isArray(claim?.auditHistory)
                  ? claim.auditHistory
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
                          membership?.membershipName ||
                            membershipId ||
                            "Ownership Claim",
                        )}
                      </h2>
                      <div className="mt-1 text-sm text-white/65 break-all">
                        {membershipId}
                      </div>
                    </div>
                    <div className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-200">
                      {labelize(
                        review?.reviewStatus ||
                          claim?.ownershipReviewStatus ||
                          claim?.claimStatus,
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 text-sm">
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
                      <div className="mt-1 break-all text-white/85">
                        {String(
                          claim?.businessId || membership?.businessId || "-",
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-white/45">Evidence</div>
                      <div className="mt-1 text-white/85">
                        {labelize(review?.evidenceStatus)}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        Portal: {labelize(onboarding?.evidencePortalStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm font-semibold text-white">
                      Claim reviewer notes
                    </div>
                    <textarea
                      value={reasons[membershipId] || ""}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [membershipId]: event.target.value,
                        }))
                      }
                      placeholder="Reason, evidence request, dispute context, or rejection details"
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
                      Audit history
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
                No pending ownership claims found.
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/claim-approvals",
);
