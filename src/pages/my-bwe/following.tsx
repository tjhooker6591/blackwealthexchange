// src/pages/my-bwe/following.tsx
//
// Phase 5 -- Follow Business. List of businesses the caller follows.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type Followed = {
  businessId: string;
  displayName: string;
  shortSummary: string;
  primaryCategory: string;
  city: string;
  state: string;
  publicHref: string | null;
};

export default function FollowingPage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [items, setItems] = useState<Followed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/business/follow?mine=1", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((data) => setItems(data?.businesses || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [user]);

  const canonical = canonicalUrl("/my-bwe/following");

  return (
    <>
      <Head>
        <title>Following | My BWE</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <Link href="/my-bwe" className="bwe-open-link bwe-focus-ring">
            Back to My BWE
          </Link>
          <h1 className="bwe-display-title mt-3 text-3xl sm:text-4xl">
            Following
          </h1>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/my-bwe/following"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              You&apos;re not following any businesses yet.{" "}
              <Link
                href="/business-directory"
                className="text-[var(--accent)] underline"
              >
                Browse the directory
              </Link>
              .
            </div>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.businessId}
                  href={item.publicHref || "/business-directory"}
                  className="bwe-grid-card bwe-focus-ring block p-4"
                >
                  <div className="bwe-card-title">{item.displayName}</div>
                  {item.primaryCategory ? (
                    <div className="mt-1 text-xs text-white/55">
                      {item.primaryCategory}
                    </div>
                  ) : null}
                  {item.shortSummary ? (
                    <p className="mt-2 text-sm text-white/62">
                      {item.shortSummary}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
