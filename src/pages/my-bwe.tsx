// src/pages/my-bwe.tsx
//
// Phase 5 -- Network Effects hub. Where /explore is the discovery portal
// ("show me everything BWE can do"), My BWE is the personal-engagement
// portal ("show me what I've built here") -- Following, Saved, Collections,
// Alerts, Notifications, Inbox, Referrals. All data below is the caller's
// own real activity, pulled live from the Phase 5 APIs; nothing is
// pre-seeded.

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
};

export default function MyBwePage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });

  const [followCount, setFollowCount] = useState(0);
  const [savedBusinessCount, setSavedBusinessCount] = useState(0);
  const [savedProductCount, setSavedProductCount] = useState(0);
  const [savedOpportunityCount, setSavedOpportunityCount] = useState(0);
  const [collectionCount, setCollectionCount] = useState(0);
  const [alerts, setAlerts] = useState<SavedSearch[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetch("/api/business/follow?mine=1", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((data) => setFollowCount((data?.businesses || []).length))
      .catch(() => null);

    fetch("/api/user/save-business", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((data) => setSavedBusinessCount((data?.businesses || []).length))
      .catch(() => null);

    fetch("/api/user/save-product", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => setSavedProductCount((data?.products || []).length))
      .catch(() => null);

    fetch("/api/user/save-opportunity", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { opportunities: [] }))
      .then((data) =>
        setSavedOpportunityCount((data?.opportunities || []).length),
      )
      .catch(() => null);

    fetch("/api/user/collections", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { collections: [] }))
      .then((data) => setCollectionCount((data?.collections || []).length))
      .catch(() => null);

    fetch("/api/user/save-search", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { searches: [] }))
      .then((data) =>
        setAlerts(
          (data?.searches || []).filter((s: SavedSearch) => s.alertsEnabled),
        ),
      )
      .catch(() => null);

    fetch("/api/notifications/list", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { unreadCount: 0 }))
      .then((data) => setUnreadNotifications(data?.unreadCount || 0))
      .catch(() => null);

    fetch("/api/messages/list", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((data) => setConversationCount((data?.conversations || []).length))
      .catch(() => null);
  }, [user]);

  const canonical = canonicalUrl("/my-bwe");

  const tiles = [
    {
      label: "Following",
      count: followCount,
      href: "/my-bwe/following",
      description: "Businesses you follow for real updates.",
    },
    {
      label: "Saved businesses",
      count: savedBusinessCount,
      href: "/my-bwe/saved-businesses",
      description: "Businesses you bookmarked.",
    },
    {
      label: "Saved products",
      count: savedProductCount,
      href: "/my-bwe/saved-products",
      description: "Marketplace items you bookmarked.",
    },
    {
      label: "Saved opportunities",
      count: savedOpportunityCount,
      href: "/black-student-opportunities/scholarships",
      description: "Scholarships, grants, and internships you saved.",
    },
    {
      label: "Collections",
      count: collectionCount,
      href: "/collections",
      description: "Your own named lists of saved businesses/products.",
    },
    {
      label: "Alerts",
      count: alerts.length,
      href: "/my-bwe/alerts",
      description: "Saved searches with Job/Scholarship/Product alerts on.",
    },
    {
      label: "Notifications",
      count: unreadNotifications,
      href: "/notifications",
      description: "Real activity: follows, reviews, updates, alert matches.",
    },
    {
      label: "Inbox",
      count: conversationCount,
      href: "/inbox",
      description: "Direct messages with businesses and BWE members.",
    },
    {
      label: "Referrals",
      count: null,
      href: "/referrals",
      description: "Your referral link and real referral activity.",
    },
  ];

  return (
    <>
      <Head>
        <title>My BWE | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <div className="bwe-eyebrow">My BWE</div>
          <h1 className="bwe-display-title mt-2 text-3xl sm:text-4xl">
            Everything you&apos;ve built on BWE.
          </h1>
          <p className="bwe-lead mt-3 max-w-xl">
            Following, saves, collections, alerts, notifications, your inbox,
            and referrals -- all in one place.
          </p>

          {authLoading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/my-bwe"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>{" "}
              to see your activity.
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tiles.map((tile) => (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className="bwe-grid-card bwe-focus-ring flex flex-col gap-2 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="bwe-card-title">{tile.label}</div>
                    {tile.count !== null ? (
                      <div className="text-xl font-extrabold text-[var(--accent)]">
                        {tile.count}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-sm leading-5 text-white/62">
                    {tile.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
