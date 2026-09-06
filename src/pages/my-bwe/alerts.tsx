// src/pages/my-bwe/alerts.tsx
//
// Phase 5 -- Job Alerts, Scholarship Alerts, Product Alerts, and generic
// Saved Search. All are the same saved_searches record
// (src/pages/api/user/save-search.ts); this page lists all of the caller's
// saved searches and lets them toggle alerts or delete a search.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type SavedSearch = {
  id: string;
  domain: string;
  label: string;
  alertsEnabled: boolean;
  lastAlertedAt: string | null;
};

const DOMAIN_LABEL: Record<string, string> = {
  jobs: "Job",
  scholarships: "Scholarship",
  products: "Product",
  directory: "Directory",
  universal: "Search",
};

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/user/save-search", {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setItems(data?.searches || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    load();
  }, [user]);

  async function toggleAlerts(id: string, alertsEnabled: boolean) {
    await fetch("/api/user/save-search", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, alertsEnabled: !alertsEnabled }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/user/save-search?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
  }

  const canonical = canonicalUrl("/my-bwe/alerts");

  return (
    <>
      <Head>
        <title>Saved Searches & Alerts | My BWE</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <Link href="/my-bwe" className="bwe-open-link bwe-focus-ring">
            Back to My BWE
          </Link>
          <h1 className="bwe-display-title mt-3 text-3xl sm:text-4xl">
            Saved Searches &amp; Alerts
          </h1>
          <p className="bwe-lead mt-3 max-w-xl">
            Job Alerts, Scholarship Alerts, and Product Alerts all live here.
          </p>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/my-bwe/alerts"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              No saved searches yet. Save one from{" "}
              <Link
                href="/job-listings"
                className="text-[var(--accent)] underline"
              >
                Jobs
              </Link>
              ,{" "}
              <Link
                href="/marketplace"
                className="text-[var(--accent)] underline"
              >
                Marketplace
              </Link>
              , or{" "}
              <Link
                href="/black-student-opportunities/scholarships"
                className="text-[var(--accent)] underline"
              >
                Scholarships
              </Link>
              .
            </div>
          ) : (
            <div className="mt-8 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="min-w-0">
                    <span className="bwe-badge mr-2">
                      {DOMAIN_LABEL[item.domain] || item.domain}
                    </span>
                    <span className="font-semibold text-white/90">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleAlerts(item.id, item.alertsEnabled)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        item.alertsEnabled
                          ? "border border-yellow-500/40 bg-yellow-500/15 text-yellow-200"
                          : "border border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      {item.alertsEnabled ? "Alerts on" : "Alerts off"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="text-xs font-semibold text-white/50 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
