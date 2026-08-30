import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

type StatusPayload = {
  overallStatus?: string;
  lastUpdatedAt?: string;
  typicalResponseTimeHours?: number | null;
  services?: Record<string, string>;
};

export default function Page() {
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    fetch("/api/support/status")
      .then((r) => r.json())
      .then((d) => setStatus(d || null))
      .catch(() => setStatus(null));
  }, []);

  const state = status?.overallStatus || "operational";
  const stateTone =
    state === "operational"
      ? "text-emerald-300"
      : state === "degraded"
        ? "text-yellow-300"
        : "text-red-300";

  return (
    <>
      <Head>
        <title>System Status | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Check Black Wealth Exchange system status, service health, and current support response timing.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/support/status")} />
      </Head>
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Support status</div>
                <h1 className="bwe-display-title mt-3 max-w-[10ch]">
                  System status and service health.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  Check the current platform state before opening an outage or
                  incident ticket.
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  Current state
                </div>
                <p className={`mt-2 text-lg font-semibold ${stateTone}`}>
                  {state}
                </p>
                <p className="mt-2 text-sm text-white/68">
                  Last updated:{" "}
                  {status?.lastUpdatedAt
                    ? new Date(status.lastUpdatedAt).toLocaleString()
                    : "live"}
                </p>
                <p className="mt-1 text-sm text-white/68">
                  Typical response time:{" "}
                  {status?.typicalResponseTimeHours != null
                    ? `${status.typicalResponseTimeHours}h`
                    : "not enough recent ticket data"}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="bwe-eyebrow">Service health</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(status?.services || {}).map(([name, value]) => (
                  <div
                    key={name}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <div className="text-xs uppercase tracking-[0.12em] text-white/45">
                      {name}
                    </div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <section className="rounded-[26px] border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] p-5 sm:p-6">
                <div className="bwe-eyebrow">Next step</div>
                <p className="mt-4 text-sm leading-6 text-white/72">
                  If the issue is active platform-wide, check back here first.
                  If your account or order is uniquely affected, open a ticket
                  with the specific page, order, or business context.
                </p>
              </section>

              <section className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/support/new"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Open ticket
                  </Link>
                  <Link
                    href="/support/tickets"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    My tickets
                  </Link>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
