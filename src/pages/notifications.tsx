// src/pages/notifications.tsx
//
// Phase 5 -- Notifications. Full history of the caller's own real
// notifications (follows, reviews, business updates, alert matches,
// referral events, inbox messages), backed by /api/notifications/list.ts.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string | null;
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/notifications/list", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((data) => {
        setItems(Array.isArray(data?.notifications) ? data.notifications : []);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [user]);

  const canonical = canonicalUrl("/notifications");

  return (
    <>
      <Head>
        <title>Notifications | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <div className="bwe-eyebrow">My BWE</div>
          <h1 className="bwe-display-title mt-2 text-3xl sm:text-4xl">
            Notifications
          </h1>
          <p className="bwe-lead mt-3 max-w-xl">
            Real activity from businesses you follow, reviews, updates, and your
            saved-search alerts.
          </p>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/notifications"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>{" "}
              to see your notifications.
            </div>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              Nothing yet. Follow a business or save a search to start getting
              real updates here.
            </div>
          ) : (
            <div className="mt-8 space-y-2">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href || "#"}
                  className="bwe-grid-card bwe-focus-ring block p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white/90">
                        {item.title}
                      </div>
                      {item.body ? (
                        <div className="mt-1 text-sm text-white/65">
                          {item.body}
                        </div>
                      ) : null}
                    </div>
                    {!item.read ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
