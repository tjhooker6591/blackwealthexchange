import Link from "next/link";
import Head from "next/head";
import { Search } from "lucide-react";
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
      className={`rounded-xl border border-zinc-800 bg-zinc-950 md:hover:border-yellow-400 md:hover:shadow-[0_0_0_1px_rgba(250,204,21,0.4)] md:hover:-translate-y-0.5 transition p-4 ${big ? "min-h-28" : "min-h-20"}`}
    >
      <div className="text-yellow-300 font-semibold">{title}</div>
      {subtitle ? (
        <div className="text-sm text-zinc-400 mt-1">{subtitle}</div>
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
  const sig =
    s?.overallStatus === "operational"
      ? "text-emerald-300"
      : s?.overallStatus === "degraded"
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
      <main className="min-h-screen bg-black text-white p-8">
        <section className="mx-auto mt-4 max-w-6xl rounded-xl border border-white/15 bg-white/[0.03] p-3 text-sm text-white/80">
          <div className="font-bold text-white">
            Action Required / What Changed
          </div>
          <div className="mt-1">
            What changed: latest items and statuses may have updated since your
            last visit.
          </div>
          <div>
            Needs action: review your active items and respond where pending.
          </div>
          <div>At risk: delayed response can reduce conversion and trust.</div>
          <div className="mt-1">
            sourceStatus: <span className="font-semibold">needs_mapping</span>
          </div>
        </section>

        <div className="max-w-6xl mx-auto space-y-8">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h1 className="text-4xl font-bold text-yellow-400">
              BWE Customer Support
            </h1>
            <p className="text-zinc-300 mt-2">
              Find answers fast, take guided actions, and escalate only when
              needed.
            </p>
            <p className="text-sm text-zinc-400 mt-2">
              Most issues can be resolved quickly without submitting a ticket.
            </p>
            <p className={`text-xs mt-2 ${sig}`}>
              ● {s?.overallStatus || "loading"} • Last updated:{" "}
              {s?.lastUpdatedAt || "-"} • Typical response time:{" "}
              {s?.typicalResponseTimeHours != null
                ? `${s.typicalResponseTimeHours}h`
                : "n/a"}
            </p>
            <div className="mt-4 w-full md:w-2/3 p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 flex items-center gap-2">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search help topics"
                className="w-full bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-400"
              />
            </div>
            {q ? (
              <div className="mt-3 w-full md:w-2/3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                {filtered.length ? (
                  <div className="space-y-2">
                    {filtered.map((t) => (
                      <Link
                        key={t.title}
                        href={t.href}
                        className="block text-sm text-yellow-300 underline"
                      >
                        {t.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-300">
                    No exact match found. You can open a ticket or browse all
                    support categories.
                  </div>
                )}
              </div>
            ) : null}
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-yellow-300">
              Primary Actions
            </h2>
            <p className="text-sm text-zinc-400">
              Start here for the fastest path to resolution.
            </p>
            <div className="grid md:grid-cols-4 gap-3">
              <Card
                href="/support/new"
                title="📝 Open Ticket"
                subtitle="Need personalized help now?"
                big
              />
              <Card
                href="/support/tickets"
                title="📄 My Tickets"
                subtitle="Review updates on your requests"
                big
              />
              <Card
                href="/support/status"
                title="🟢 System Status"
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

          <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-lg font-semibold text-yellow-300">
              Next steps
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link
                href="/job-listings"
                className="text-sm text-yellow-300 underline"
              >
                Jobs and opportunities
              </Link>
              <Link
                href="/marketplace"
                className="text-sm text-yellow-300 underline"
              >
                Marketplace orders and sellers
              </Link>
              <Link href="/login" className="text-sm text-yellow-300 underline">
                Account login and access
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
