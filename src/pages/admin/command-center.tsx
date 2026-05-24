import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

type Metric = {
  value: number | string;
  sourceStatus: string;
  note?: string;
  link?: string;
};

function valueNum(m?: Metric) {
  const n = Number(m?.value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function statusTone(sourceStatus?: string) {
  if (sourceStatus === "live")
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (sourceStatus === "empty")
    return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40";
  if (sourceStatus === "collection_missing")
    return "bg-amber-500/20 text-amber-300 border-amber-500/40";
  return "bg-sky-500/20 text-sky-300 border-sky-500/40";
}

function prettyStatus(sourceStatus?: string) {
  if (sourceStatus === "live") return "Live data";
  if (sourceStatus === "empty") return "No data yet";
  if (
    sourceStatus === "collection_missing" ||
    sourceStatus === "needs_mapping" ||
    sourceStatus === "needs_tracking"
  ) {
    return "Partial data";
  }
  return "Partial data";
}

function loopRow(label: string, metric?: Metric) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-zinc-300">{label}</span>
      <span className="text-zinc-100 font-semibold text-right">
        {String(metric?.value ?? 0)} ({prettyStatus(metric?.sourceStatus)})
      </span>
    </div>
  );
}

function MetricCard({
  label,
  metric,
  href,
  help,
}: {
  label: string;
  metric?: Metric;
  href: string;
  help: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-yellow-500/50 transition block"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-zinc-400">{label}</div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full border ${statusTone(metric?.sourceStatus)}`}
        >
          {prettyStatus(metric?.sourceStatus)}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-yellow-300">
        {String(metric?.value ?? 0)}
      </div>
      <div className="mt-1 text-[11px] text-zinc-500">
        {help}
        {metric?.note ? ` • ${metric.note}` : ""}
      </div>
    </Link>
  );
}

export default function CommandCenterPage() {
  const [d, setD] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [weekly, setWeekly] = useState<any>(null);
  const [retention, setRetention] = useState<any>(null);
  const [trustM, setTrustM] = useState<any>(null);
  const [sponsor, setSponsor] = useState<any>(null);
  const [err, setErr] = useState("");
  const [showRetention, setShowRetention] = useState(false);
  const [showTrust, setShowTrust] = useState(false);
  const [showSponsor, setShowSponsor] = useState(false);

  useEffect(() => {
    fetch("/api/admin/metrics/command-center", { credentials: "include" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok)
          throw new Error(j?.message || "Failed to load command center");
        setD(j);
      })
      .catch((e) => setErr(e?.message || "Failed to load command center"));

    fetch("/api/admin/execution-plan", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setPlan(j?.row || null))
      .catch(() => setPlan(null));
    fetch("/api/admin/weekly-operating-review/current", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((j) => setWeekly(j?.review || null))
      .catch(() => setWeekly(null));
    fetch("/api/admin/metrics/retention", { credentials: "include" })
      .then((r) => r.json())
      .then(setRetention)
      .catch(() => setRetention(null));
    fetch("/api/admin/metrics/marketplace-trust", { credentials: "include" })
      .then((r) => r.json())
      .then(setTrustM)
      .catch(() => setTrustM(null));
    fetch("/api/admin/metrics/sponsor-proof", { credentials: "include" })
      .then((r) => r.json())
      .then(setSponsor)
      .catch(() => setSponsor(null));
  }, []);

  const company = d?.companyHealth || {};
  const revenue = d?.revenueHealth || {};
  const support = d?.supportHealth || {};
  const pe = d?.productEngineeringHealth || {};
  const trust = d?.trustSafetyHealth || {};
  const priorities = d?.executivePriorities || {};

  const snapshot = useMemo(() => {
    const totalUsers = valueNum(company.totalUsers);
    const pendingApprovals = valueNum(company.pendingAdminApprovals);
    const escalated = valueNum(support.escalated);
    const critical = valueNum(company.criticalIssues);
    const scoreRaw =
      100 - Math.min(60, escalated * 3 + pendingApprovals * 0.1 + critical * 5);
    const companyHealthScore: Metric = {
      value: Math.max(0, Math.round(scoreRaw)),
      sourceStatus: "live",
      note: "Derived from approvals, escalations, and critical issues",
    };

    const openTickets: Metric = {
      value:
        valueNum(support.newTickets) +
        valueNum(support.inReview) +
        valueNum(support.waitingOnUser) +
        valueNum(support.escalated),
      sourceStatus: [
        support.newTickets,
        support.inReview,
        support.waitingOnUser,
        support.escalated,
      ].some((m: any) => m?.sourceStatus === "live")
        ? "live"
        : "empty",
    };

    const founderDecisions: Metric = {
      value: Array.isArray(priorities.decisionsNeeded)
        ? priorities.decisionsNeeded.length
        : 0,
      sourceStatus: Array.isArray(priorities.decisionsNeeded)
        ? "live"
        : "needs_mapping",
    };

    const blockers: Metric = {
      value: Array.isArray(priorities.blockers)
        ? priorities.blockers.length
        : valueNum(pe.activeBlockers),
      sourceStatus: Array.isArray(priorities.blockers)
        ? "live"
        : pe.activeBlockers?.sourceStatus || "needs_mapping",
    };

    return {
      companyHealthScore,
      openTickets,
      founderDecisions,
      blockers,
      totalUsers,
    };
  }, [company, support, priorities, pe.activeBlockers]);

  const quickLinks = [
    ["Revenue Overview", "/admin/revenue"],
    ["Financial Review", "/admin/financial-review"],
    ["Support Tickets", "/admin/support"],
    ["Refunds / Disputes", "/admin/financial-review"],
    ["Business Lines", "/admin/business-lines"],
    ["Product Roadmap", "/admin/product"],
    ["Engineering Health", "/admin/engineering"],
    ["Releases", "/admin/releases"],
    ["Growth", "/admin/growth"],
    ["Partnerships", "/admin/partnerships"],
    ["Trust & Safety", "/admin/trust-safety"],
    ["Legal / Policies", "/admin/legal"],
    ["Marketplace Admin", "/admin/product-approvals"],
    ["Jobs Admin", "/admin/job-approvals"],
    ["Advertising Admin", "/admin/advertising-requests"],
    ["Sponsors Admin", "/admin/advertising-requests"],
  ];

  if (err) {
    return (
      <main className="min-h-screen bg-black text-white p-8">Error: {err}</main>
    );
  }
  if (!d) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        Loading CEO command center...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-yellow-400">
              BWE CEO Command Center
            </h1>
            <p className="text-sm text-zinc-400">
              Generated {d.generatedAt} • Source: {d.source}
            </p>
          </div>
          <div className="text-xs text-zinc-400">
            Fast executive view, linked to operating pages
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-yellow-300">
            CEO Executive Snapshot
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Company Health Score"
              metric={snapshot.companyHealthScore}
              href="/admin/business-lines"
              help="Overall operating signal"
            />
            <MetricCard
              label="Revenue This Month"
              metric={revenue.revenueThisMonth}
              href="/admin/revenue"
              help="BWE recognized revenue"
            />
            <MetricCard
              label="Revenue Today"
              metric={revenue.revenueToday}
              href="/admin/revenue"
              help="Today recognized revenue"
            />
            <MetricCard
              label="Open Support Tickets"
              metric={snapshot.openTickets}
              href="/admin/support"
              help="Active support workload"
            />
            <MetricCard
              label="Escalated Issues"
              metric={support.escalated}
              href="/admin/support"
              help="Escalated support cases"
            />
            <MetricCard
              label="Pending Approvals"
              metric={company.pendingAdminApprovals}
              href="/admin/trust-safety"
              help="Admin queue pressure"
            />
            <MetricCard
              label="Active Sponsors"
              metric={company.activeSponsors}
              href="/admin/partnerships"
              help="Active sponsor accounts"
            />
            <MetricCard
              label="Current Release Status"
              metric={pe.currentReleaseStatus}
              href="/admin/releases"
              help="Release channel status"
            />
            <MetricCard
              label="Go / No-Go Status"
              metric={pe.goNoGoStatus}
              href="/admin/releases"
              help="Launch decision state"
            />
            <MetricCard
              label="Critical Blockers"
              metric={snapshot.blockers}
              href="/admin/product"
              help="Blocked high-priority work"
            />
            <MetricCard
              label="Founder Decisions Needed"
              metric={snapshot.founderDecisions}
              href="/admin/command-center"
              help="Executive decisions pending"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-yellow-300">
            Weekly CEO Operating Cadence
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200 space-y-2">
            {!weekly ? (
              <div className="text-zinc-400">
                No weekly review started yet.{" "}
                <a href="#weekly-review" className="underline">
                  Start current week review
                </a>
                .
              </div>
            ) : (
              <div className="text-zinc-300">
                Current week: {String(weekly.weekStart || "set weekStart")}
              </div>
            )}
            <div>
              <b>MONDAY</b> - Top 3 priorities, blockers, founder decisions
              needed
            </div>
            <div>
              <b>TUES/WED</b> - Engineering progress, route/API health, support
              risk, marketplace trust issues
            </div>
            <div>
              <b>THURSDAY</b> - Sponsor proof, ad performance, marketplace
              revenue, jobs pipeline, partnerships
            </div>
            <div>
              <b>FRIDAY</b> - Release readiness, support status, revenue review,
              trust/safety, deploy or hold
            </div>
            <div>
              <b>SUNDAY</b> - Mission progress, revenue progress, trust
              progress, stop/carry-forward
            </div>
          </div>
        </section>

        <section className="space-y-3" id="weekly-review">
          <h2 className="text-xl font-semibold text-yellow-300">
            Weekly Operating Review
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
            {weekly ? (
              <pre className="text-xs text-zinc-300 overflow-auto">
                {JSON.stringify(weekly, null, 2)}
              </pre>
            ) : (
              <div className="text-zinc-400">No weekly review started yet.</div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-yellow-300">
            P0 Operating Loops
          </h2>
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              <div className="font-semibold text-yellow-300">Retention</div>
              {loopRow("Active Users", retention?.retention?.activeUsers)}
              {loopRow("New This Week", retention?.retention?.newUsersThisWeek)}
              {loopRow(
                "Listings Needing Action",
                retention?.retention?.listingsNeedingAction,
              )}
              <button
                type="button"
                className="mt-2 text-[11px] text-yellow-300 underline"
                onClick={() => setShowRetention((v) => !v)}
              >
                [ View Details {showRetention ? "▲" : "▼"} ]
              </button>
              <div className="mt-1">
                <Link
                  href="/admin/dashboard?source=command-center&focus=operations"
                  className="text-[11px] text-yellow-300 underline"
                >
                  Go to → Dashboard
                </Link>
              </div>
              {showRetention ? (
                <div className="mt-2 space-y-1 text-[11px] text-zinc-300 break-words">
                  {Object.entries(retention?.retention || {}).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-zinc-400">{k}:</span>{" "}
                      {typeof v === "object" && v !== null
                        ? `${String((v as any).value ?? "")}` +
                          ` (${prettyStatus((v as any).sourceStatus)})`
                        : String(v)}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              <div className="font-semibold text-yellow-300">
                Marketplace Trust
              </div>
              {loopRow("Total Orders", trustM?.metrics?.totalOrders)}
              {loopRow("Completed Orders", trustM?.metrics?.completedOrders)}
              {loopRow("Support Issues", trustM?.metrics?.supportIssues)}
              <button
                type="button"
                className="mt-2 text-[11px] text-yellow-300 underline"
                onClick={() => setShowTrust((v) => !v)}
              >
                [ View Details {showTrust ? "▲" : "▼"} ]
              </button>
              <div className="mt-1 flex flex-wrap gap-3">
                <Link
                  href="/admin/financial-review?source=command-center&focus=revenue"
                  className="text-[11px] text-yellow-300 underline"
                >
                  Go to → Financial Review
                </Link>
                <Link
                  href="/admin/support?source=command-center&focus=priority"
                  className="text-[11px] text-yellow-300 underline"
                >
                  Go to → Support
                </Link>
              </div>
              {showTrust ? (
                <div className="mt-2 space-y-1 text-[11px] text-zinc-300 break-words">
                  {Object.entries(trustM?.metrics || {}).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-zinc-400">{k}:</span>{" "}
                      {typeof v === "object" && v !== null
                        ? `${String((v as any).value ?? "")}` +
                          ` (${prettyStatus((v as any).sourceStatus)})`
                        : String(v)}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              <div className="font-semibold text-yellow-300">Sponsor Proof</div>
              {loopRow("Active Campaigns", sponsor?.metrics?.activeCampaigns)}
              {loopRow("Expired Campaigns", sponsor?.metrics?.expiredCampaigns)}
              {loopRow("Impressions", sponsor?.metrics?.impressions)}
              <button
                type="button"
                className="mt-2 text-[11px] text-yellow-300 underline"
                onClick={() => setShowSponsor((v) => !v)}
              >
                [ View Details {showSponsor ? "▲" : "▼"} ]
              </button>
              <div className="mt-1">
                <Link
                  href="/admin/advertising-requests?source=command-center&focus=sponsor-proof"
                  className="text-[11px] text-yellow-300 underline"
                >
                  Go to → Advertising Requests
                </Link>
              </div>
              {showSponsor ? (
                <div className="mt-2 space-y-1 text-[11px] text-zinc-300 break-words">
                  {Object.entries(sponsor?.metrics || {}).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-zinc-400">{k}:</span>{" "}
                      {typeof v === "object" && v !== null
                        ? `${String((v as any).value ?? "")}` +
                          ` (${prettyStatus((v as any).sourceStatus)})`
                        : String(v)}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-yellow-300">
            Executive Quick Access / All Access Cheat Sheet
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 hover:border-yellow-500/50 transition"
              >
                <div className="text-sm font-medium text-zinc-100">{label}</div>
                <div className="text-[11px] text-zinc-500 mt-1">{href}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-yellow-300">
            Execution Plan
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm text-zinc-400">Current Phase</div>
                <div className="text-lg font-semibold text-yellow-300">
                  {plan?.currentPhase ||
                    "Phase 1 (Days 1-30): Stabilize + Instrument"}
                </div>
              </div>
              <a
                className="text-xs underline text-zinc-300"
                href="/docs/BWE_TOP_TIER_90_DAY_EXECUTION_PLAN.md"
                target="_blank"
                rel="noreferrer"
              >
                Open Full Plan
              </a>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-zinc-400 mb-1">Top Actions</div>
                <ul className="list-disc ml-5 text-sm text-zinc-200 space-y-1">
                  {(plan?.topActions?.length
                    ? plan.topActions
                    : [
                        "Implement admin_metrics_snapshots and fallback logic",
                        "Wire system health logging into failure paths",
                        "Finalize releases collection writer",
                      ]
                  ).map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm text-zinc-400 mb-1">
                  Owner Review Needed
                </div>
                <ul className="list-disc ml-5 text-sm text-zinc-200 space-y-1">
                  {(plan?.ownerReviewNeeded?.length
                    ? plan.ownerReviewNeeded
                    : [
                        "Approve lane owners for reliability/support/growth",
                        "Confirm release go/no-go criteria",
                        "Set weekly CEO review cadence",
                      ]
                  ).map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-yellow-300">
            Trend (7d/30d)
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-yellow-300 font-semibold">Revenue Trend</div>
              <pre className="text-xs mt-2 text-zinc-300 overflow-auto">
                {JSON.stringify(d?.trends?.revenue || {}, null, 2)}
              </pre>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-yellow-300 font-semibold">Support Trend</div>
              <pre className="text-xs mt-2 text-zinc-300 overflow-auto">
                {JSON.stringify(d?.trends?.support || {}, null, 2)}
              </pre>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-yellow-300 font-semibold">Growth Trend</div>
              <pre className="text-xs mt-2 text-zinc-300 overflow-auto">
                {JSON.stringify(d?.trends?.growth || {}, null, 2)}
              </pre>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-yellow-300">
            Graphic Operating Dashboard
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-yellow-300 font-semibold mb-2">
                Revenue Health
              </h3>
              <MetricCard
                label="Revenue This Month"
                metric={revenue.revenueThisMonth}
                href="/admin/revenue"
                help="Executive summary"
              />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-yellow-300 font-semibold mb-2">
                Support Health
              </h3>
              <MetricCard
                label="Escalated"
                metric={support.escalated}
                href="/admin/support"
                help="Escalation pressure"
              />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-yellow-300 font-semibold mb-2">
                Growth Health
              </h3>
              <MetricCard
                label="New Users This Month"
                metric={d?.growthHealth?.newUsersThisMonth}
                href="/admin/growth"
                help="Acquisition trend"
              />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-yellow-300 font-semibold mb-2">
                Product / Engineering Health
              </h3>
              <MetricCard
                label="Active Blockers"
                metric={pe.activeBlockers}
                href="/admin/engineering"
                help="Execution risk"
              />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-yellow-300 font-semibold mb-2">
                Trust & Safety Health
              </h3>
              <MetricCard
                label="Pending Business Approvals"
                metric={trust.pendingBusinessApprovals}
                href="/admin/trust-safety"
                help="Review queue"
              />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-yellow-300 font-semibold mb-2">
                Release Readiness
              </h3>
              <MetricCard
                label="Go / No-Go"
                metric={pe.goNoGoStatus}
                href="/admin/releases"
                help="Release decision"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/command-center",
);
