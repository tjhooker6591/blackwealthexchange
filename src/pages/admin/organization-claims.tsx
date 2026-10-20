// src/pages/admin/organization-claims.tsx
//
// Review claims on church and organization listings. A paid claim comes from
// the Founding membership ($49/month, same as businesses). Verifying makes
// the claimant the organization's verified owner.

import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Claim = {
  _id: string;
  entityId: string;
  organizationName?: string | null;
  organizationCity?: string | null;
  organizationState?: string | null;
  organizationType?: string | null;
  claimantName?: string | null;
  claimantRole?: string | null;
  claimantPhone?: string | null;
  claimantEmail?: string | null;
  claimStatus?: string;
  paymentStatus?: string | null;
  amountCents?: number | null;
  submittedAt?: string;
  paidAt?: string | null;
  statusChangeReason?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  ownership_verification_pending: "Waiting for review",
  ownership_verified: "Verified",
  verified: "Verified",
  additional_evidence_required: "More information requested",
  ownership_verification_failed: "Rejected",
};

const day = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : "");

export default function AdminOrganizationClaimsPage() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/organizations/claims", {
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    setClaims(Array.isArray(json?.claims) ? json.claims : []);
  }, []);

  useEffect(() => {
    load().catch(() => setClaims([]));
  }, [load]);

  const act = async (c: Claim, action: string, label: string) => {
    let reason = "";
    if (
      action === "verification_failed" &&
      c.paymentStatus === "paid" &&
      !window.confirm(
        "Rejecting cancels this membership and refunds everything paid. Continue?",
      )
    ) {
      return;
    }
    if (action !== "verify") {
      reason =
        window.prompt(`${label}: add a short note for the record (optional)`) ??
        "";
    } else if (
      c.paymentStatus !== "paid" &&
      !window.confirm("This claim has no payment on record. Verify anyway?")
    ) {
      return;
    }
    setBusyId(c._id);
    setNotice("");
    try {
      const res = await fetch("/api/admin/organizations/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ claimId: c._id, action, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Update failed");
      const refunded = json?.refund?.refundedCents
        ? ` Membership cancelled and $${(json.refund.refundedCents / 100).toFixed(2)} refunded.`
        : json?.refund?.cancelled
          ? " Membership cancelled (nothing to refund)."
          : "";
      setNotice(
        `${c.organizationName || "Claim"}: ${label.toLowerCase()} done.${refunded}`,
      );
      await load();
    } catch (err: any) {
      setNotice(err?.message || "Update failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <Head>
        <title>Admin | Organization Claims</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-yellow-200">
                Organization Claims
              </h1>
              <p className="text-sm text-white/60">
                Organizations that claimed their listing. Paid claims use the
                same $49/month Founding membership as businesses.
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-sm text-yellow-300 underline"
            >
              Back to Admin Dashboard
            </Link>
          </div>
          {notice ? (
            <div className="rounded-xl border border-green-500/30 bg-green-950/20 p-3 text-sm text-green-200">
              {notice}
            </div>
          ) : null}
          {claims === null ? (
            <p>Loading…</p>
          ) : claims.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">
              No organization claims yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-yellow-200">
                  <tr>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Claimant</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c) => {
                    const st = String(c.claimStatus || "");
                    const done =
                      st === "ownership_verified" ||
                      st === "verified" ||
                      st === "ownership_verification_failed";
                    return (
                      <tr
                        key={c._id}
                        className="border-b border-white/10 align-top last:border-b-0"
                      >
                        <td className="p-3">
                          <Link
                            href={`/organizations/${encodeURIComponent(c.entityId)}`}
                            target="_blank"
                            className="font-semibold underline"
                          >
                            {c.organizationName || c.entityId}
                          </Link>
                          <div className="text-xs text-white/50">
                            {[c.organizationCity, c.organizationState]
                              .filter(Boolean)
                              .join(", ")}
                            {c.organizationType
                              ? ` · ${c.organizationType}`
                              : ""}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            {c.claimantName || "—"}
                            {c.claimantRole ? (
                              <span className="text-white/60">
                                {" "}
                                · {c.claimantRole}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-white/60 break-all">
                            {c.claimantEmail || ""}
                          </div>
                          <div className="text-xs text-white/60">
                            {c.claimantPhone || ""}
                          </div>
                        </td>
                        <td className="p-3">
                          {c.paymentStatus === "paid" ? (
                            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-200">
                              Paid{" "}
                              {c.amountCents
                                ? `$${(c.amountCents / 100).toFixed(0)}/mo`
                                : ""}
                            </span>
                          ) : (
                            <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/60">
                              Not paid
                            </span>
                          )}
                          <div className="mt-1 text-xs text-white/50">
                            {day(c.paidAt || c.submittedAt)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>{STATUS_LABEL[st] || st || "—"}</div>
                          {c.statusChangeReason ? (
                            <div className="text-xs text-white/50">
                              {c.statusChangeReason}
                            </div>
                          ) : null}
                        </td>
                        <td className="p-3">
                          {done ? (
                            <span className="text-xs text-white/50">
                              No action needed
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={busyId === c._id}
                                onClick={() => act(c, "verify", "Verify")}
                                className="rounded bg-green-600 px-3 py-1 font-semibold text-black hover:bg-green-500 disabled:opacity-50"
                              >
                                Verify
                              </button>
                              <button
                                type="button"
                                disabled={busyId === c._id}
                                onClick={() =>
                                  act(
                                    c,
                                    "request_more_evidence",
                                    "Request more information",
                                  )
                                }
                                className="rounded border border-white/20 px-3 py-1 hover:bg-white/10 disabled:opacity-50"
                              >
                                Ask for more info
                              </button>
                              <button
                                type="button"
                                disabled={busyId === c._id}
                                onClick={() =>
                                  act(c, "verification_failed", "Reject")
                                }
                                className="rounded bg-red-600 px-3 py-1 font-semibold text-black hover:bg-red-500 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/organization-claims",
);
