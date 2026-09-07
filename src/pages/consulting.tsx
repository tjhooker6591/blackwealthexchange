// src/pages/consulting.tsx
//
// Recruiting + Consulting Commercial MVP (2026-09-07). BWE's own
// advisory/implementation services offer -- distinct from
// /recruiting-consulting (which is the platform's existing talent-
// matching/recruiting lead system, historically misnamed "consulting").
// Priced per engagement -- no universal percentage is stated or implied
// anywhere on this page.

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function ConsultingOfferPage() {
  const [clientCompany, setClientCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [scope, setScope] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [budgetIndication, setBudgetIndication] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const track = (eventType: string, extras: Record<string, unknown> = {}) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/consulting",
      section: "consulting_offer",
      ...extras,
    });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setSubmitting(true);
    track("consulting_service_submission_started", {
      ctaId: "consulting_request_submit",
      destination: "/api/consulting-service-intake",
    });
    try {
      const res = await fetch("/api/consulting-service-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientCompany,
          contactName,
          contactEmail,
          serviceTitle,
          scope,
          timeframe,
          budgetIndication,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setErr(data?.error || "Submission failed.");
      } else {
        setMsg(data.message || "Submitted.");
        track("consulting_service_submission_completed", {
          requestId: data.requestId || null,
        });
        setClientCompany("");
        setContactName("");
        setContactEmail("");
        setServiceTitle("");
        setScope("");
        setTimeframe("");
        setBudgetIndication("");
      }
    } catch {
      setErr("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>BWE Consulting | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Request a BWE consulting engagement -- advisory and implementation support priced by engagement.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/consulting")} />
      </Head>
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm text-[#D4AF37] hover:underline">
            ← Back to Homepage
          </Link>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
              BWE Consulting
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Solutions priced by engagement.
            </h1>
            <p className="mt-2 text-sm text-white/70 sm:text-base">
              BWE provides advisory and implementation support for businesses
              building on the platform. Every engagement is scoped and priced
              individually with you -- there is no fixed or universal rate.
            </p>

            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/75 sm:text-sm">
              <p className="font-semibold text-white">How it works</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  Tell us about the problem or project below (Request a
                  Consultation).
                </li>
                <li>
                  BWE reviews your request and follows up to discuss scope.
                </li>
                <li>
                  Once you agree on scope and price, BWE sends a payment request
                  for the agreed engagement amount.
                </li>
              </ul>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-3">
              <input
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="Company / organization"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
                required
              />
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
                required
              />
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                type="email"
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
                required
              />
              <input
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="What do you need help with? (e.g. Marketplace launch strategy)"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
                required
              />
              <textarea
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                rows={5}
                placeholder="Describe the problem, goals, and any relevant context."
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
                required
              />
              <input
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="Desired timeframe (optional)"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
              />
              <input
                value={budgetIndication}
                onChange={(e) => setBudgetIndication(e.target.value)}
                placeholder="Budget range, if you have one (optional)"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]/50"
              />

              {err ? <div className="text-sm text-red-300">{err}</div> : null}
              {msg ? (
                <div className="text-sm text-emerald-300">{msg}</div>
              ) : null}

              <button
                disabled={submitting}
                className="h-11 rounded-xl bg-[#D4AF37] px-5 text-sm font-extrabold text-black transition hover:bg-yellow-500 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Request a Consultation"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
