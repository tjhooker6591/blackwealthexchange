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
  normalCheckCounts?: {
    routineAdminReview?: number;
    exceptionAdminReview?: number;
  };
  verificationDecisionCounts?: {
    AUTO_VERIFY_ELIGIBLE?: number;
    ADMIN_REVIEW_REQUIRED?: number;
    MORE_EVIDENCE_REQUIRED?: number;
    CONFLICT_BLOCKED?: number;
    DISPUTED?: number;
    VERIFICATION_FAILED?: number;
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

function verdictTone(verdict: unknown) {
  return verdict === "exception_admin_review"
    ? "border-red-500/30 bg-red-500/10 text-red-100"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
}

function dispositionTone(value: unknown) {
  if (value === "AUTO_VERIFY_ELIGIBLE") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  }
  if (value === "MORE_EVIDENCE_REQUIRED") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-100";
  }
  if (value === "CONFLICT_BLOCKED" || value === "DISPUTED") {
    return "border-red-500/30 bg-red-500/10 text-red-100";
  }
  if (value === "VERIFICATION_FAILED") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  }
  return "border-sky-500/30 bg-sky-500/10 text-sky-100";
}

function renderMatchField(field: any) {
  return (
    <>
      <div className="mt-1 text-white/85">
        Listing: {field?.currentListingValue || "-"}
      </div>
      <div className="mt-1 text-white/75">
        Claimant: {field?.claimantProvidedValue || "-"}
      </div>
      <div className="mt-1 text-xs text-white/55">
        Match: {labelize(field?.normalizedMatchResult || "UNKNOWN")}
      </div>
    </>
  );
}

const ACTIONS = [
  { key: "verify", label: "Verify Ownership" },
  { key: "request_more_evidence", label: "Request More Evidence" },
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
                Founding Membership Claim Records
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

          <div className="grid gap-3 md:grid-cols-7">
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
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
              <div className="text-emerald-100/75">Routine Admin Review</div>
              <div className="mt-1 text-xl font-semibold text-emerald-50">
                {data?.normalCheckCounts?.routineAdminReview || 0}
              </div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm">
              <div className="text-red-100/75">Exception Review</div>
              <div className="mt-1 text-xl font-semibold text-red-50">
                {data?.normalCheckCounts?.exceptionAdminReview || 0}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-6">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
              <div className="text-emerald-100/75">Auto-Verify Eligible</div>
              <div className="mt-1 text-xl font-semibold text-emerald-50">
                {data?.verificationDecisionCounts?.AUTO_VERIFY_ELIGIBLE || 0}
              </div>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-sm">
              <div className="text-sky-100/75">Admin Review Required</div>
              <div className="mt-1 text-xl font-semibold text-sky-50">
                {data?.verificationDecisionCounts?.ADMIN_REVIEW_REQUIRED || 0}
              </div>
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm">
              <div className="text-yellow-100/75">More Evidence Required</div>
              <div className="mt-1 text-xl font-semibold text-yellow-50">
                {data?.verificationDecisionCounts?.MORE_EVIDENCE_REQUIRED || 0}
              </div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm">
              <div className="text-red-100/75">Conflict Blocked</div>
              <div className="mt-1 text-xl font-semibold text-red-50">
                {data?.verificationDecisionCounts?.CONFLICT_BLOCKED || 0}
              </div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm">
              <div className="text-red-100/75">Disputed</div>
              <div className="mt-1 text-xl font-semibold text-red-50">
                {data?.verificationDecisionCounts?.DISPUTED || 0}
              </div>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm">
              <div className="text-rose-100/75">Verification Failed</div>
              <div className="mt-1 text-xl font-semibold text-rose-50">
                {data?.verificationDecisionCounts?.VERIFICATION_FAILED || 0}
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
              const normalCheck = row.normalCheck || null;
              const verificationDecision = row.verificationDecision || null;
              const claimIntake = review?.claimIntake || null;
              const structuredEvidence = Array.isArray(
                review?.structuredEvidenceSubmissions,
              )
                ? review.structuredEvidenceSubmissions
                : [];
              const legacyVerified =
                String(row.queueState || "").trim() === "ownership_verified" &&
                !claimIntake;
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
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Claim intake evidence
                        </div>
                        <div className="mt-1 text-sm text-white/60">
                          Current listing values stay separate from
                          claimant-provided values until ownership verification
                          is complete.
                        </div>
                      </div>
                      {legacyVerified ? (
                        <div className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-bold text-sky-200">
                          Legacy verified
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">
                          Claimant relationship
                        </div>
                        <div className="mt-1 text-white/85">
                          {labelize(
                            claimIntake?.claimant?.relationshipToBusiness ||
                              "-",
                          )}
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          Role: {claimIntake?.claimant?.roleTitle || "-"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Evidence metadata</div>
                        <div className="mt-1 text-white/85">
                          {structuredEvidence.length
                            ? `${structuredEvidence.length} structured evidence record(s)`
                            : "No structured evidence submitted yet"}
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          Authorization verified:{" "}
                          {claimIntake?.authority?.authorizationVerified
                            ? "Yes"
                            : "No"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
                      {[
                        ["Business name", claimIntake?.business?.businessName],
                        ["Address", claimIntake?.business?.addressLine1],
                        ["Phone", claimIntake?.business?.phone],
                        ["Website", claimIntake?.business?.website],
                      ].map(([label, field]: any) => (
                        <div
                          key={label}
                          className="rounded-xl border border-white/10 bg-black/30 p-3"
                        >
                          <div className="text-white/45">{label}</div>
                          {renderMatchField(field)}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-3 xl:grid-cols-3 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Claimant identity</div>
                        <div className="mt-1 text-white/85">
                          Name: {claimIntake?.claimant?.claimantName || "-"}
                        </div>
                        <div className="mt-1 break-all text-white/75">
                          Email: {claimIntake?.claimant?.claimantEmail || "-"}
                        </div>
                        <div className="mt-1 text-white/75">
                          Phone: {claimIntake?.claimant?.claimantPhone || "-"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">
                          Additional business identity signals
                        </div>
                        <div className="mt-2 space-y-3">
                          {[
                            ["City", claimIntake?.business?.city],
                            ["State", claimIntake?.business?.state],
                            ["Postal code", claimIntake?.business?.postalCode],
                            [
                              "Business email",
                              claimIntake?.business?.businessEmail,
                            ],
                          ].map(([label, field]: any) => (
                            <div
                              key={label}
                              className="rounded-lg border border-white/10 px-3 py-2"
                            >
                              <div className="text-white/55">{label}</div>
                              {renderMatchField(field)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">
                          Social profile comparisons
                        </div>
                        <div className="mt-2 space-y-3">
                          {Array.isArray(claimIntake?.business?.socialUrls) &&
                          claimIntake.business.socialUrls.length ? (
                            claimIntake.business.socialUrls.map(
                              (field: any, index: number) => (
                                <div
                                  key={`${field?.claimantProvidedValue || "social"}:${index}`}
                                  className="rounded-lg border border-white/10 px-3 py-2"
                                >
                                  <div className="text-white/55">
                                    Social URL {index + 1}
                                  </div>
                                  {renderMatchField(field)}
                                </div>
                              ),
                            )
                          ) : (
                            <div className="rounded-lg border border-white/10 px-3 py-2 text-white/65">
                              No claimant-provided social URLs.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Automated normal check
                        </div>
                        <div className="mt-1 text-sm text-white/60">
                          Shared DA-12 classifier for routine versus
                          exception-only review.
                        </div>
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${verdictTone(
                          normalCheck?.verdict,
                        )}`}
                      >
                        {labelize(
                          normalCheck?.verdict || "routine_admin_review",
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Consistency</div>
                        <div className="mt-1 text-white/85">
                          {labelize(normalCheck?.consistency)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Verdict reason</div>
                        <div className="mt-1 text-white/85">
                          {labelize(normalCheck?.verdictReason)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                      <div className="text-white/45">Detected issues</div>
                      <div className="mt-1 text-white/85">
                        {Array.isArray(normalCheck?.issues) &&
                        normalCheck.issues.length
                          ? normalCheck.issues.map(labelize).join(" • ")
                          : "No exception issues detected."}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Auto-verify recommendation
                        </div>
                        <div className="mt-1 text-sm text-white/60">
                          Dry-run only. This recommendation does not activate
                          verified ownership or management rights.
                        </div>
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${dispositionTone(
                          verificationDecision?.disposition,
                        )}`}
                      >
                        {labelize(
                          verificationDecision?.disposition ||
                            "ADMIN_REVIEW_REQUIRED",
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Policy version</div>
                        <div className="mt-1 text-white/85">
                          {verificationDecision?.policyVersion || "da13-v1"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Automation boundary</div>
                        <div className="mt-1 text-white/85">
                          {verificationDecision?.automationBoundary || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Black-owned status</div>
                        <div className="mt-1 text-white/85">
                          {labelize(
                            verificationDecision?.blackOwnedStatusLabel ||
                              "NOT_ESTABLISHED",
                          )}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">
                          Automatic ownership activation
                        </div>
                        <div className="mt-1 text-white/85">No</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Admin review</div>
                        <div className="mt-1 text-white/85">
                          {verificationDecision?.adminReviewRequired
                            ? "Required"
                            : "Not required"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Mandatory failures</div>
                        <div className="mt-1 text-white/85">
                          {Array.isArray(
                            verificationDecision?.mandatoryFailures,
                          ) && verificationDecision.mandatoryFailures.length
                            ? verificationDecision.mandatoryFailures.join(" • ")
                            : "None"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-white/45">Mandatory unknowns</div>
                        <div className="mt-1 text-white/85">
                          {Array.isArray(
                            verificationDecision?.mandatoryUnknowns,
                          ) && verificationDecision.mandatoryUnknowns.length
                            ? verificationDecision.mandatoryUnknowns.join(" • ")
                            : "None"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                      <div className="text-white/45">
                        Why admin review is required
                      </div>
                      <div className="mt-1 text-white/85">
                        {verificationDecision?.adminReviewRequired
                          ? Array.isArray(verificationDecision?.rationale)
                            ? verificationDecision.rationale.join(" ")
                            : "Admin review remains required."
                          : "This case is dry-run auto-verify eligible, but automatic ownership activation is still disabled in this phase."}
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                      <div className="text-white/45">
                        Auto-verify mandatory conditions
                      </div>
                      <div className="mt-3 space-y-2">
                        {Array.isArray(
                          verificationDecision?.mandatoryConditions,
                        )
                          ? verificationDecision.mandatoryConditions.map(
                              (condition: any) => (
                                <div
                                  key={condition.key}
                                  className="rounded-lg border border-white/10 px-3 py-2"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="font-medium text-white/90">
                                      {condition.label}
                                    </div>
                                    <div className="text-[11px] uppercase tracking-wide text-white/55">
                                      {labelize(condition.status)}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-white/65">
                                    {condition.reason}
                                  </div>
                                </div>
                              ),
                            )
                          : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {Array.isArray(verificationDecision?.groups)
                        ? verificationDecision.groups.map((group: any) => (
                            <div
                              key={group.id}
                              className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm"
                            >
                              <div className="font-semibold text-white">
                                {group.label}
                              </div>
                              <div className="mt-1 text-white/55">
                                {group.summary}
                              </div>
                              <div className="mt-2 text-xs text-white/45">
                                Pass {group.passCount || 0} • Fail{" "}
                                {group.failCount || 0} • Unknown{" "}
                                {group.unknownCount || 0}
                              </div>
                              <div className="mt-3 space-y-2">
                                {Array.isArray(group.signals)
                                  ? group.signals.map((signal: any) => (
                                      <div
                                        key={signal.key}
                                        className="rounded-lg border border-white/10 px-3 py-2"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="font-medium text-white/90">
                                            {signal.label}
                                          </div>
                                          <div className="text-[11px] uppercase tracking-wide text-white/55">
                                            {labelize(signal.status)}
                                          </div>
                                        </div>
                                        <div className="mt-1 text-white/65">
                                          {signal.summary}
                                        </div>
                                        <div className="mt-1 text-[11px] text-white/40">
                                          Data:{" "}
                                          {Array.isArray(signal.dataUsed)
                                            ? signal.dataUsed.join(", ")
                                            : "-"}
                                        </div>
                                      </div>
                                    ))
                                  : null}
                              </div>
                            </div>
                          ))
                        : null}
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
