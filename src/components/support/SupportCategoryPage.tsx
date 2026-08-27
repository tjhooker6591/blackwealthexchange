import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

type Item = { label: string; href: string };

export default function SupportCategoryPage({
  title,
  intro,
  pageTitle,
  metaDescription,
  canonicalPath,
  commonIssues,
  quickActions,
  guidedActions,
  decisionGuidance,
  scenarios,
  stepHints,
  nextActions,
}: {
  title: string;
  intro: string;
  pageTitle?: string;
  metaDescription?: string;
  canonicalPath?: string;
  commonIssues: string[];
  quickActions: Item[];
  guidedActions: { label: string; category: string; priority?: string }[];
  decisionGuidance: string[];
  scenarios: string[];
  stepHints: string[];
  nextActions: string[];
}) {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => {
    fetch("/api/support/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  const statusTone =
    status?.overallStatus === "operational"
      ? "text-emerald-200 border-emerald-500/30 bg-emerald-500/10"
      : status?.overallStatus === "degraded"
        ? "text-amber-100 border-amber-500/30 bg-amber-500/10"
        : "text-rose-100 border-rose-500/30 bg-rose-500/10";

  const Mini = ({ title, items }: { title: string; items: string[] }) =>
    items.length ? (
      <section className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
        <div className="bwe-eyebrow">{title}</div>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
          {items.map((x) => (
            <li key={x} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <>
      <Head>
        <title>{pageTitle || `${title} | Black Wealth Exchange`}</title>
        <meta
          name="description"
          content={truncateMeta(metaDescription || intro)}
        />
        {canonicalPath ? (
          <link rel="canonical" href={canonicalUrl(canonicalPath)} />
        ) : null}
      </Head>
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-[-8rem] h-[420px] w-[420px] rounded-full bg-sky-500/[0.05] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Support</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">{title}</h1>
                <p className="bwe-lead mt-4 max-w-2xl">{intro}</p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/support/new"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Open support ticket
                  </Link>
                  <Link
                    href="/support/tickets"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    Review my tickets
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                <div className={`rounded-2xl border px-4 py-4 ${statusTone}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                    System status
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {status?.overallStatus || "Loading"}
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    Last updated: {status?.lastUpdatedAt || "Live"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                    Fastest path
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/68">
                    Use quick actions first, then move into guided ticket flows
                    only when the issue still needs support-team follow-up.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="grid gap-4">
              <Mini title="Common issues" items={commonIssues} />
              <Mini title="Decision guidance" items={decisionGuidance} />
              <Mini title="Real-world scenarios" items={scenarios} />
              <Mini
                title="Step hints before opening a ticket"
                items={stepHints}
              />
            </div>

            <div className="grid gap-4">
              <section className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                <div className="bwe-eyebrow">Quick actions</div>
                <div className="mt-4 grid gap-3">
                  {quickActions.map((a) => (
                    <Link
                      key={a.href + a.label}
                      href={a.href}
                      className="flex min-h-12 items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 text-sm font-medium text-white/86 transition hover:border-[rgba(212,175,55,0.3)] hover:bg-white/[0.04]"
                    >
                      <span>{a.label}</span>
                      <span className="text-[var(--accent)]">→</span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-[26px] border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] p-5 sm:p-6">
                <div className="bwe-eyebrow">Guided help actions</div>
                <div className="mt-4 grid gap-3">
                  {guidedActions.map((a) => (
                    <Link
                      key={a.label}
                      href={`/support/new?category=${encodeURIComponent(a.category)}&priority=${encodeURIComponent(a.priority || "Normal")}`}
                      className="rounded-2xl border border-[rgba(212,175,55,0.26)] bg-black/20 px-4 py-3 text-sm font-medium text-white/88 transition hover:border-[rgba(212,175,55,0.46)] hover:bg-white/[0.04]"
                    >
                      <div>{a.label}</div>
                      <div className="mt-1 text-xs text-white/58">
                        Category: {a.category}
                        {a.priority ? ` • Priority: ${a.priority}` : ""}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <Mini title="Clear next actions" items={nextActions} />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
