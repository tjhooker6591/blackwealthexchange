import React, { useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type VerifyItem = {
  payment: any;
  enrollment: any;
  purchasedCourseMirror: boolean;
  verification: any;
  repairAudit?: Array<any>;
};

export default function FinancialClassReconciliationPage() {
  const [filters, setFilters] = useState({
    email: "",
    userId: "",
    stripeSessionId: "",
    paymentIntentId: "",
    courseId: "",
  });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<VerifyItem[]>([]);
  const [error, setError] = useState<string>("");
  const [repairing, setRepairing] = useState<string>("");
  const [repairReason, setRepairReason] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string>("");

  const runVerify = async () => {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v.trim()) qs.set(k, v.trim());
      });
      const res = await fetch(
        `/api/admin/financial-class/verify?${qs.toString()}`,
        { credentials: "include" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Verification failed");
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const repair = async (stripeSessionId: string) => {
    const reason = (repairReason[stripeSessionId] || "").trim();
    if (!reason) {
      setError("Repair reason is required.");
      return;
    }
    if (
      !confirm(
        "This will grant missing course access and write audit logs. Continue?",
      )
    ) {
      return;
    }

    setRepairing(stripeSessionId);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/financial-class/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stripeSessionId, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Repair failed");
      setMsg(`Repair completed for ${stripeSessionId}`);
      await runVerify();
    } catch (e: any) {
      setError(e?.message || "Repair failed");
    } finally {
      setRepairing("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold">
              Financial Class Reconciliation
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Verify payment-to-access fulfillment and run audited repairs.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm hover:bg-gray-800"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100 mb-4">
          Warning: Repair actions require a reason and are permanently audit
          logged.
        </div>

        <div className="grid md:grid-cols-5 gap-2 mb-3">
          {Object.entries(filters).map(([k, v]) => (
            <input
              key={k}
              value={v}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, [k]: e.target.value }))
              }
              placeholder={k}
              className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
            />
          ))}
        </div>

        <div className="mb-4">
          <button
            onClick={runVerify}
            disabled={loading}
            className="rounded bg-gold text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Run Verification"}
          </button>
        </div>

        {error ? (
          <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 p-2 text-red-200 text-sm">
            {error}
          </div>
        ) : null}
        {msg ? (
          <div className="mb-3 rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-200 text-sm">
            {msg}
          </div>
        ) : null}

        <div className="space-y-4">
          {items.map((item, idx) => {
            const sid = String(item?.payment?.stripeSessionId || `row-${idx}`);
            const canRepair = Boolean(item?.verification?.canRepair);
            return (
              <div
                key={sid + idx}
                className="rounded border border-gray-800 bg-gray-900 p-4"
              >
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <h3 className="text-gold font-semibold mb-1">
                      Payment Record
                    </h3>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(item.payment, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-gold font-semibold mb-1">
                      Enrollment + Mirror
                    </h3>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(
                        {
                          enrollment: item.enrollment,
                          purchasedCourseMirror: item.purchasedCourseMirror,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>

                <div className="mt-3 rounded border border-gray-700 bg-black/40 p-3 text-sm">
                  <div>
                    Entitlement status:{" "}
                    <span className="font-semibold">
                      {item?.verification?.entitlementStatus || "unknown"}
                    </span>
                  </div>
                  <div>
                    Failure point:{" "}
                    <span className="font-semibold">
                      {item?.verification?.failurePoint || "none"}
                    </span>
                  </div>
                  <div>
                    Recommended repair:{" "}
                    <span className="font-semibold">
                      {item?.verification?.recommendedRepairAction || "none"}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm text-gold font-semibold mb-1">
                    Repair History / Audit
                  </h4>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(item?.repairAudit || [], null, 2)}
                  </pre>
                </div>

                <div className="mt-3 flex flex-col md:flex-row gap-2 md:items-center">
                  <input
                    value={repairReason[sid] || ""}
                    onChange={(e) =>
                      setRepairReason((prev) => ({
                        ...prev,
                        [sid]: e.target.value,
                      }))
                    }
                    placeholder="Required repair reason"
                    className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm md:min-w-[360px]"
                  />
                  <button
                    disabled={!canRepair || repairing === sid}
                    onClick={() => repair(item?.payment?.stripeSessionId)}
                    className="rounded bg-emerald-500 text-black px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {repairing === sid
                      ? "Repairing..."
                      : "Run Repair (Audited)"}
                  </button>
                </div>
              </div>
            );
          })}

          {!loading && items.length === 0 ? (
            <div className="text-sm text-gray-400">
              No reconciliation records match the selected filters. Run
              verification with at least one filter.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/admin/financial-class-reconciliation",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      isAdmin?: boolean;
    };
    if (!(payload.isAdmin === true || payload.accountType === "admin")) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/financial-class-reconciliation",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/financial-class-reconciliation",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
