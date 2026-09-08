// src/pages/recruiting/engagement/[id].tsx
//
// Recruiting + Consulting Commercial MVP (2026-09-07). Lightweight
// engagement status/payment page -- not a full dashboard (see section P
// of the MVP spec: "do not build ... customer dashboard"). An admin
// shares this specific link with the employer once an engagement and
// its agreed fee exist. Shows what service, the agreed amount, current
// status, and a Pay Now button when payment is due. Never claims a
// placement is "successful" merely because payment succeeded -- only a
// truthful payment confirmation.

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

type EngagementView = {
  id: string;
  service: string;
  employerCompany: string | null;
  role: string | null;
  status: string | null;
  paymentStatus: "not_applicable" | "payment_due" | "paid";
  agreedAmountCents: number | null;
  checkoutUrl: string | null;
  paidAt: string | null;
};

function formatCents(cents: number | null) {
  if (cents === null) return "To be confirmed";
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusLabel(status: string | null) {
  const labels: Record<string, string> = {
    new: "Request received",
    contacted: "In contact with BWE",
    engaged: "Engagement in progress",
    placement_confirmed: "Placement confirmed",
    payment_due: "Payment requested",
    paid: "Paid",
    closed: "Closed",
    cancelled: "Cancelled",
  };
  return labels[status || ""] || status || "Unknown";
}

export default function RecruitingEngagementStatusPage() {
  const router = useRouter();
  const { id, paid } = router.query;
  const [data, setData] = useState<EngagementView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/recruiting/engagement/${id}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.ok) {
          setError(json?.error || "Unable to load this engagement.");
        } else {
          setData(json.engagement);
        }
      } catch {
        if (!cancelled) setError("Unable to load this engagement.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <Head>
        <title>Recruiting Engagement | Black Wealth Exchange</title>
      </Head>
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-xl">
          <Link href="/" className="text-sm text-[#D4AF37] hover:underline">
            ← Back to Homepage
          </Link>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
              BWE Recruiting
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Loading...</p>
            ) : error ? (
              <p className="text-sm text-red-300">{error}</p>
            ) : data ? (
              <>
                <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                  {data.service}
                </h1>
                <div className="mt-4 space-y-2 text-sm text-white/80">
                  <div>
                    <span className="font-semibold text-white">Employer:</span>{" "}
                    {data.employerCompany || "—"}
                  </div>
                  <div>
                    <span className="font-semibold text-white">Role:</span>{" "}
                    {data.role || "—"}
                  </div>
                  <div>
                    <span className="font-semibold text-white">Status:</span>{" "}
                    {statusLabel(data.status)}
                  </div>
                  <div>
                    <span className="font-semibold text-white">
                      Agreed amount:
                    </span>{" "}
                    {formatCents(data.agreedAmountCents)}
                  </div>
                  <div>
                    <span className="font-semibold text-white">
                      Payment status:
                    </span>{" "}
                    {data.paymentStatus === "paid"
                      ? "Paid"
                      : data.paymentStatus === "payment_due"
                        ? "Payment due"
                        : "Not yet due"}
                  </div>
                </div>

                {data.paymentStatus === "paid" || paid === "1" ? (
                  <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-900/20 p-4 text-sm text-emerald-200">
                    Payment received. Thank you. A member of the BWE team will
                    follow up on next steps for this engagement.
                  </div>
                ) : data.paymentStatus === "payment_due" && data.checkoutUrl ? (
                  <a
                    href={data.checkoutUrl}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-6 text-sm font-extrabold text-black transition hover:bg-yellow-500"
                  >
                    Pay Now
                  </a>
                ) : (
                  <p className="mt-5 text-sm text-white/60">
                    No payment is currently requested for this engagement.
                  </p>
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
