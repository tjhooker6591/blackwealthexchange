import Link from "next/link";
import Head from "next/head";
import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const helpTopics = [
  { title: "Account/Login", href: "/support/help-center?topic=account-login" },
  {
    title: "Marketplace Orders",
    href: "/support/new?category=marketplace-orders",
  },
  { title: "Billing/Refunds", href: "/support/billing" },
  { title: "Seller/Payouts", href: "/support/seller" },
  { title: "Business Directory", href: "/support/business" },
  { title: "Advertising/Sponsorship", href: "/support/advertising" },
  { title: "Jobs/Employer", href: "/support/employer" },
  {
    title: "Membership/Black Card",
    href: "/support/new?category=membership-black-card",
  },
  {
    title: "Financial Education",
    href: "/support/new?category=financial-education",
  },
  { title: "Wealth Builder", href: "/support/new?category=wealth-builder" },
  { title: "Music/Creator", href: "/support/new?category=music-creator" },
  { title: "Security/Trust & Safety", href: "/support/security" },
  { title: "Technical Issue", href: "/support/new?category=technical-issue" },
];
function Card({
  href,
  title,
  subtitle,
  big = false,
}: {
  href: string;
  title: string;
  subtitle?: string;
  big?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[24px] border border-white/8 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(212,175,55,0.3)] hover:bg-white/[0.05] ${big ? "min-h-28" : "min-h-20"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-white font-semibold">{title}</div>
        <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
      </div>
      {subtitle ? (
        <div className="mt-2 text-sm leading-6 text-white/60">{subtitle}</div>
      ) : null}
    </Link>
  );
}
export default function Support() {
  const [s, setS] = useState<any>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    fetch("/api/support/status")
      .then((r) => r.json())
      .then(setS)
      .catch(() => null);
  }, []);
  const statusValue = s?.overallStatus || "operational";
  const sig =
    statusValue === "operational"
      ? "text-emerald-300"
      : statusValue === "degraded"
        ? "text-yellow-300"
        : "text-red-300";
  const q = query.trim().toLowerCase();
  const filtered = q
    ? helpTopics.filter((t) => t.title.toLowerCase().includes(q))
    : [];
  return (
    <>
      <Head>
        <title>Support Center | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Get help with your BWE account, jobs, marketplace orders, billing, and support tickets from one support center.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/support")} />
      </Head>
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[740px] w-[740px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-[-8rem] h-[420px] w-[420px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Support</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  BWE customer support with a clearer next step.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  Search help topics, check system status, open tickets, and
                  route account, billing, marketplace, employer, and security
                  issues without dead-end navigation.
                </p>
                <p className={`mt-4 text-sm ${sig}`}>
                  {statusValue} • Last updated:{" "}
                  {s?.lastUpdatedAt
                    ? new Date(s.lastUpdatedAt).toLocaleString()
                    : "updating"}{" "}
                  • Typical response time:{" "}
                  {s?.typicalResponseTimeHours != null
                    ? `${s.typicalResponseTimeHours}h`
                    : "calculating"}
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/support/new"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Open support ticket
                  </Link>
                  <Link
                    href="/support/status"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    Check system status
                  </Link>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/24 p-3 text-sm text-white/78">
                  <div className="font-semibold text-white">
                    Support quick start
                  </div>
                  <div className="mt-2">
                    Open a ticket for account, billing, security, marketplace,
                    jobs, or directory issues.
                  </div>
                  <div className="mt-1">
                    Use My Tickets to track responses and follow-ups from the
                    support team.
                  </div>
                  <div className="mt-1">
                    Check System Status before opening an outage report.
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-white/80">
                  <Search className="h-4 w-4 text-white/45" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search help topics"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
                  />
                </div>
              </div>
            </div>
          </section>

          {q ? (
            <section className="mt-6 rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
              {filtered.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((t) => (
                    <Card key={t.title} href={t.href} title={t.title} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-white/68">
                  No exact match found. You can open a ticket or browse the
                  support categories below.
                </div>
              )}
            </section>
          ) : null}

          <section className="mt-8 space-y-3">
            <h2 className="bwe-section-title text-[1.55rem] sm:text-[1.8rem]">
              Primary actions
            </h2>
            <p className="text-sm text-white/58">
              Start here for the fastest route to a real answer or support-team
              follow-up.
            </p>
            <div className="grid gap-3 md:grid-cols-4">
              <Card
                href="/support/new"
                title="Open ticket"
                subtitle="Need personalized help now?"
                big
              />
              <Card
                href="/support/tickets"
                title="My tickets"
                subtitle="Review updates on your requests"
                big
              />
              <Card
                href="/support/status"
                title="System status"
                subtitle="Check if there is an active issue"
                big
              />
              <Card
                href="/support/releases"
                title="What’s New / Release Notes"
                subtitle="See the latest Black Wealth Exchange platform updates, improvements, and release information."
                big
              />
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
            <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="bwe-eyebrow">Support categories</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {helpTopics.map((topic) => (
                  <Card
                    key={topic.title}
                    href={topic.href}
                    title={topic.title}
                    subtitle="Open the most relevant help path"
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <section className="rounded-[26px] border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] p-5 sm:p-6">
                <div className="bwe-eyebrow">Most useful next steps</div>
                <div className="mt-4 grid gap-3">
                  <Link
                    href="/job-listings"
                    className="bwe-open-link bwe-focus-ring text-white/86"
                  >
                    Jobs and opportunities
                  </Link>
                  <Link
                    href="/marketplace"
                    className="bwe-open-link bwe-focus-ring text-white/86"
                  >
                    Marketplace orders and sellers
                  </Link>
                  <Link
                    href="/login"
                    className="bwe-open-link bwe-focus-ring text-white/86"
                  >
                    Account login and access
                  </Link>
                </div>
              </section>

              <section className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                <div className="bwe-eyebrow">Platform note</div>
                <p className="mt-4 text-sm leading-6 text-white/64">
                  Black Wealth Exchange is a founder-led for-profit platform
                  founded by Thomas James Hooker Sr.
                </p>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
